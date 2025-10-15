import { supabase } from './supabase'

// ==========================================
// HERO METRICS QUERIES
// ==========================================

/**
 * Get total number of unique families
 * @param {Object} dateRange - { startDate, endDate } or null for all time
 * @returns {Promise<number>} Total families count
 */
export async function getTotalFamilies(dateRange = null) {
  try {
    let query = supabase
      .from('families')
      .select('id', { count: 'exact', head: true })

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate)
    }

    const { count, error } = await query

    if (error) throw error
    return count || 0
  } catch (err) {
    console.error('Error fetching total families:', err)
    return 0
  }
}

/**
 * Get average session duration in minutes
 * @param {Object} dateRange - { startDate, endDate } or null for all time
 * @returns {Promise<number>} Average duration in minutes
 */
export async function getAverageSessionDuration(dateRange = null) {
  try {
    let query = supabase
      .from('sessions')
      .select('started_at, ended_at')
      .not('ended_at', 'is', null)
      .eq('completion_status', 'completed')

    if (dateRange) {
      query = query
        .gte('started_at', dateRange.startDate)
        .lte('started_at', dateRange.endDate)
    }

    const { data, error } = await query

    if (error) throw error
    if (!data || data.length === 0) return 0

    // Calculate average duration in minutes
    const totalMinutes = data.reduce((sum, session) => {
      const start = new Date(session.started_at)
      const end = new Date(session.ended_at)
      const durationMs = end - start
      const durationMinutes = durationMs / (1000 * 60)
      return sum + durationMinutes
    }, 0)

    const avgMinutes = totalMinutes / data.length
    return Math.round(avgMinutes)
  } catch (err) {
    console.error('Error fetching average duration:', err)
    return 0
  }
}

/**
 * Get completion rate percentage
 * @param {Object} dateRange - { startDate, endDate } or null for all time
 * @returns {Promise<number>} Completion rate as percentage (0-100)
 */
export async function getCompletionRate(dateRange = null) {
  try {
    let query = supabase
      .from('sessions')
      .select('completion_status')

    if (dateRange) {
      query = query
        .gte('started_at', dateRange.startDate)
        .lte('started_at', dateRange.endDate)
    }

    const { data, error } = await query

    if (error) throw error
    if (!data || data.length === 0) return 0

    const completedCount = data.filter(s => s.completion_status === 'completed').length
    const totalCount = data.length
    const rate = (completedCount / totalCount) * 100

    return Math.round(rate)
  } catch (err) {
    console.error('Error fetching completion rate:', err)
    return 0
  }
}

/**
 * Get total animals discovered across all families
 * @param {Object} dateRange - { startDate, endDate } or null for all time
 * @returns {Promise<number>} Total discoveries count
 */
export async function getTotalAnimalsDiscovered(dateRange = null) {
  try {
    let query = supabase
      .from('family_progress')
      .select('id', { count: 'exact', head: true })

    if (dateRange) {
      query = query
        .gte('completed_at', dateRange.startDate)
        .lte('completed_at', dateRange.endDate)
    }

    const { count, error } = await query

    if (error) throw error
    return count || 0
  } catch (err) {
    console.error('Error fetching total animals discovered:', err)
    return 0
  }
}

// ==========================================
// SESSIONS OVER TIME QUERY
// ==========================================

/**
 * Get daily session counts for chart
 * @param {Object} dateRange - { startDate, endDate }
 * @returns {Promise<Array>} Array of { date, count } objects
 */
export async function getSessionsOverTime(dateRange) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('started_at')
      .gte('started_at', dateRange.startDate)
      .lte('started_at', dateRange.endDate)
      .order('started_at')

    if (error) throw error
    if (!data || data.length === 0) return []

    // Group by date
    const groupedByDate = data.reduce((acc, session) => {
      const date = new Date(session.started_at).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

    // Convert to array format for charts
    const chartData = Object.entries(groupedByDate).map(([date, count]) => ({
      date,
      sessions: count
    }))

    return chartData
  } catch (err) {
    console.error('Error fetching sessions over time:', err)
    return []
  }
}

// ==========================================
// TOP ANIMALS QUERY
// ==========================================

/**
 * Get top 10 most popular animals
 * @param {Object} dateRange - { startDate, endDate } or null for all time
 * @returns {Promise<Array>} Array of { animal, count, icon } objects
 */
export async function getTopAnimals(dateRange = null, limit = 10) {
  try {
    let query = supabase
      .from('family_progress')
      .select(`
        riddle_id,
        riddles (
          animal,
          icon
        )
      `)

    if (dateRange) {
      query = query
        .gte('completed_at', dateRange.startDate)
        .lte('completed_at', dateRange.endDate)
    }

    const { data, error } = await query

    if (error) throw error
    if (!data || data.length === 0) return []

    // Count completions per animal
    const animalCounts = data.reduce((acc, record) => {
      const animal = record.riddles?.animal
      const icon = record.riddles?.icon
      if (animal) {
        if (!acc[animal]) {
          acc[animal] = { animal, icon: icon || '🐾', count: 0 }
        }
        acc[animal].count++
      }
      return acc
    }, {})

    // Convert to array and sort by count
    const sortedAnimals = Object.values(animalCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    return sortedAnimals
  } catch (err) {
    console.error('Error fetching top animals:', err)
    return []
  }
}

// ==========================================
// COMPLETION FUNNEL QUERY
// ==========================================

/**
 * Get session funnel data (active, completed, abandoned)
 * @param {Object} dateRange - { startDate, endDate } or null for all time
 * @returns {Promise<Object>} Object with counts for each status
 */
export async function getCompletionFunnel(dateRange = null) {
  try {
    let query = supabase
      .from('sessions')
      .select('completion_status')

    if (dateRange) {
      query = query
        .gte('started_at', dateRange.startDate)
        .lte('started_at', dateRange.endDate)
    }

    const { data, error } = await query

    if (error) throw error
    if (!data || data.length === 0) {
      return { active: 0, completed: 0, abandoned: 0, total: 0 }
    }

    const funnel = data.reduce((acc, session) => {
      acc[session.completion_status] = (acc[session.completion_status] || 0) + 1
      return acc
    }, { active: 0, completed: 0, abandoned: 0 })

    funnel.total = data.length

    return funnel
  } catch (err) {
    console.error('Error fetching completion funnel:', err)
    return { active: 0, completed: 0, abandoned: 0, total: 0 }
  }
}

// ==========================================
// DETAILED STATS FOR TABLE
// ==========================================

/**
 * Get detailed analytics for export/table view
 * @param {Object} dateRange - { startDate, endDate } or null for all time
 * @returns {Promise<Object>} Object with all key metrics
 */
export async function getDetailedStats(dateRange = null) {
  try {
    // Run all queries in parallel
    const [
      totalFamilies,
      avgDuration,
      completionRate,
      totalDiscoveries,
      funnelData
    ] = await Promise.all([
      getTotalFamilies(dateRange),
      getAverageSessionDuration(dateRange),
      getCompletionRate(dateRange),
      getTotalAnimalsDiscovered(dateRange),
      getCompletionFunnel(dateRange)
    ])

    // Calculate additional metrics
    const avgDiscoveriesPerFamily = totalFamilies > 0 
      ? Math.round(totalDiscoveries / totalFamilies) 
      : 0

    return {
      totalFamilies,
      avgDuration,
      completionRate,
      totalDiscoveries,
      avgDiscoveriesPerFamily,
      activeSessions: funnelData.active,
      completedSessions: funnelData.completed,
      abandonedSessions: funnelData.abandoned,
      totalSessions: funnelData.total
    }
  } catch (err) {
    console.error('Error fetching detailed stats:', err)
    return null
  }
}

// ==========================================
// HELPER: DATE RANGE CALCULATOR
// ==========================================

/**
 * Calculate date range based on filter selection
 * @param {string} filter - 'last7days', 'last30days', 'alltime'
 * @returns {Object|null} Date range object or null for all time
 */
export function getDateRange(filter) {
  const now = new Date()
  
  switch (filter) {
    case 'last7days':
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(now.getDate() - 7)
      return {
        startDate: sevenDaysAgo.toISOString(),
        endDate: now.toISOString()
      }
    
    case 'last30days':
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(now.getDate() - 30)
      return {
        startDate: thirtyDaysAgo.toISOString(),
        endDate: now.toISOString()
      }
    
    case 'alltime':
    default:
      return null // null means no date filter
  }
}