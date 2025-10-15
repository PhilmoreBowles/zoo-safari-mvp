'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  getTotalFamilies,
  getAverageSessionDuration,
  getCompletionRate,
  getTotalAnimalsDiscovered,
  getSessionsOverTime,
  getTopAnimals,
  getCompletionFunnel,
  getDetailedStats,
  getDateRange
} from '../../../lib/analyticsQueries'
import SessionsChart from '../../../components/SessionsChart'
import TopAnimalsChart from '../../../components/TopAnimalsChart'
import CompletionFunnel from '../../../components/CompletionFunnel'

export default function AnalyticsDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('last30days')
  
  // Hero metrics state
  const [metrics, setMetrics] = useState({
    totalFamilies: 0,
    avgDuration: 0,
    completionRate: 0,
    totalDiscoveries: 0
  })

  // Chart data state
  const [sessionsData, setSessionsData] = useState([])
  const [topAnimalsData, setTopAnimalsData] = useState([])
  const [funnelData, setFunnelData] = useState({ active: 0, completed: 0, abandoned: 0, total: 0 })

  // Check authentication
  useEffect(() => {
    const isAuth = sessionStorage.getItem('zooAdminAuth')
    if (!isAuth) {
      router.push('/admin')
    }
  }, [router])

  // Load analytics data
  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const dateRange = getDateRange(dateFilter)
      
      // Fetch all data in parallel
      const [
        families,
        duration,
        completion,
        discoveries,
        sessions,
        animals,
        funnel
      ] = await Promise.all([
        getTotalFamilies(dateRange),
        getAverageSessionDuration(dateRange),
        getCompletionRate(dateRange),
        getTotalAnimalsDiscovered(dateRange),
        getSessionsOverTime(dateRange || getDateRange('last30days')),
        getTopAnimals(dateRange, 10),
        getCompletionFunnel(dateRange)
      ])

      setMetrics({
        totalFamilies: families,
        avgDuration: duration,
        completionRate: completion,
        totalDiscoveries: discoveries
      })

      setSessionsData(sessions)
      setTopAnimalsData(animals)
      setFunnelData(funnel)

      console.log('📊 Analytics loaded:', {
        metrics: { families, duration, completion, discoveries },
        sessions: sessions.length,
        animals: animals.length,
        funnel
      })

    } catch (err) {
      console.error('Error loading analytics:', err)
      alert('Error loading analytics data')
    } finally {
      setLoading(false)
    }
  }

  // Load data on mount and when filter changes
  useEffect(() => {
    loadAnalytics()
  }, [dateFilter])

  // Logout function
  const handleLogout = () => {
    sessionStorage.removeItem('zooAdminAuth')
    router.push('/admin')
  }

  // Export to CSV function
  const exportToCSV = async () => {
    const dateRange = getDateRange(dateFilter)
    const stats = await getDetailedStats(dateRange)
    
    if (!stats) {
      alert('No data to export')
      return
    }

    // Create CSV content
    const csvContent = `Zoo Safari Analytics Report
Generated: ${new Date().toLocaleString()}
Date Range: ${dateFilter}

Metric,Value
Total Families,${stats.totalFamilies}
Average Visit Duration (minutes),${stats.avgDuration}
Completion Rate,${stats.completionRate}%
Total Animals Discovered,${stats.totalDiscoveries}
Average Discoveries per Family,${stats.avgDiscoveriesPerFamily}
Active Sessions,${stats.activeSessions}
Completed Sessions,${stats.completedSessions}
Abandoned Sessions,${stats.abandonedSessions}
Total Sessions,${stats.totalSessions}

Top Animals:
Animal,Discoveries
${topAnimalsData.map(a => `${a.animal},${a.count}`).join('\n')}
    `.trim()

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zoo-safari-analytics-${dateFilter}-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    alert('Analytics exported successfully!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📊</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Loading Analytics...</h1>
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="text-6xl">📊</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Zoo Safari Analytics</h1>
                <p className="text-gray-600">Visitor Engagement Dashboard</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold focus:outline-none focus:border-blue-500 bg-white hover:border-blue-400 transition-colors"
              >
                <option value="last7days">📅 Last 7 Days</option>
                <option value="last30days">📅 Last 30 Days</option>
                <option value="alltime">📅 All Time</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={loadAnalytics}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                title="Refresh data"
              >
                🔄 Refresh
              </button>

              {/* Export Button */}
              <button
                onClick={exportToCSV}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                📥 Export CSV
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>

        {/* Hero Metrics - Big Numbers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Families */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold opacity-90">Total Families</h3>
              <span className="text-4xl">👨‍👩‍👧‍👦</span>
            </div>
            <div className="text-5xl font-black mb-2">{metrics.totalFamilies}</div>
            <p className="text-sm opacity-80">Unique family visits</p>
          </div>

          {/* Average Duration */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold opacity-90">Avg Visit Duration</h3>
              <span className="text-4xl">⏱️</span>
            </div>
            <div className="text-5xl font-black mb-2">{metrics.avgDuration}<span className="text-2xl ml-1">min</span></div>
            <p className="text-sm opacity-80">Average time spent</p>
          </div>

          {/* Completion Rate */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold opacity-90">Completion Rate</h3>
              <span className="text-4xl">✅</span>
            </div>
            <div className="text-5xl font-black mb-2">{metrics.completionRate}<span className="text-2xl ml-1">%</span></div>
            <p className="text-sm opacity-80">Adventures completed</p>
          </div>

          {/* Total Discoveries */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold opacity-90">Animals Discovered</h3>
              <span className="text-4xl">🦁</span>
            </div>
            <div className="text-5xl font-black mb-2">{metrics.totalDiscoveries}</div>
            <p className="text-sm opacity-80">Total discoveries</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Sessions Over Time */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl">📈</span>
              <h2 className="text-2xl font-bold text-gray-800">Sessions Over Time</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">Daily family visits for selected period</p>
            <SessionsChart data={sessionsData} />
          </div>

          {/* Top Animals */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl">🏆</span>
              <h2 className="text-2xl font-bold text-gray-800">Most Popular Animals</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">Top 10 most discovered animals</p>
            <TopAnimalsChart data={topAnimalsData} />
          </div>
        </div>

        {/* Completion Funnel */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-3xl">🎯</span>
            <h2 className="text-2xl font-bold text-gray-800">Engagement Funnel</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">Journey from start to completion</p>
          <CompletionFunnel data={funnelData} />
        </div>

        {/* Quick Stats Table */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-3xl">📋</span>
            <h2 className="text-2xl font-bold text-gray-800">Quick Stats Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Metric</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">👨‍👩‍👧‍👦 Total Families</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right font-bold">{metrics.totalFamilies}</td>
                </tr>
                <tr className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">⏱️ Average Visit Duration</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right font-bold">{metrics.avgDuration} minutes</td>
                </tr>
                <tr className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">✅ Completion Rate</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right font-bold">{metrics.completionRate}%</td>
                </tr>
                <tr className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">🦁 Total Animals Discovered</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right font-bold">{metrics.totalDiscoveries}</td>
                </tr>
                <tr className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">📊 Total Sessions</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right font-bold">{funnelData.total}</td>
                </tr>
                <tr className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">⏳ Active Sessions</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right font-bold text-yellow-600">{funnelData.active}</td>
                </tr>
                <tr className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">✅ Completed Sessions</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right font-bold text-green-600">{funnelData.completed}</td>
                </tr>
                <tr className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">⛔ Abandoned Sessions</td>
                  <td className="px-6 py-4 text-sm text-gray-800 text-right font-bold text-red-600">{funnelData.abandoned}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 text-sm mt-8 pb-4">
          <p>Zoo Safari Analytics Dashboard • Last updated: {new Date().toLocaleString()}</p>
        </div>

      </div>
    </div>
  )
}