'use client'

export default function CompletionFunnel({ data }) {
  if (!data || data.total === 0) {
    return (
      <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-300 rounded bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 font-semibold">No session data available</p>
          <p className="text-sm text-gray-400 mt-2">Data will appear as families start adventures</p>
        </div>
      </div>
    )
  }

  const { active, completed, abandoned, total } = data

  // Calculate percentages
  const completedPercent = total > 0 ? Math.round((completed / total) * 100) : 0
  const activePercent = total > 0 ? Math.round((active / total) * 100) : 0
  const abandonedPercent = total > 0 ? Math.round((abandoned / total) * 100) : 0

  return (
    <div className="space-y-6">
      
      {/* Visual Funnel Bars */}
      <div className="space-y-4">
        
        {/* Started (Total) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🚀</span>
              <span className="font-semibold text-gray-800">Started Adventures</span>
            </div>
            <span className="text-xl font-bold text-gray-800">{total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full flex items-center justify-end pr-2"
              style={{ width: '100%' }}
            >
              <span className="text-xs text-white font-bold">100%</span>
            </div>
          </div>
        </div>

        {/* Active */}
        <div className="pl-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⏳</span>
              <span className="font-semibold text-gray-800">In Progress</span>
            </div>
            <span className="text-xl font-bold text-yellow-600">{active}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-4 rounded-full flex items-center justify-end pr-2"
              style={{ width: `${activePercent}%` }}
            >
              {activePercent > 10 && (
                <span className="text-xs text-white font-bold">{activePercent}%</span>
              )}
            </div>
          </div>
          {activePercent <= 10 && (
            <p className="text-xs text-gray-500 mt-1">{activePercent}%</p>
          )}
        </div>

        {/* Completed */}
        <div className="pl-16">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">✅</span>
              <span className="font-semibold text-gray-800">Completed</span>
            </div>
            <span className="text-xl font-bold text-green-600">{completed}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full flex items-center justify-end pr-2"
              style={{ width: `${completedPercent}%` }}
            >
              {completedPercent > 10 && (
                <span className="text-xs text-white font-bold">{completedPercent}%</span>
              )}
            </div>
          </div>
          {completedPercent <= 10 && (
            <p className="text-xs text-gray-500 mt-1">{completedPercent}%</p>
          )}
        </div>

        {/* Abandoned */}
        <div className="pl-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⛔</span>
              <span className="font-semibold text-gray-800">Abandoned</span>
            </div>
            <span className="text-xl font-bold text-red-600">{abandoned}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-red-400 to-red-500 h-4 rounded-full flex items-center justify-end pr-2"
              style={{ width: `${abandonedPercent}%` }}
            >
              {abandonedPercent > 10 && (
                <span className="text-xs text-white font-bold">{abandonedPercent}%</span>
              )}
            </div>
          </div>
          {abandonedPercent <= 10 && (
            <p className="text-xs text-gray-500 mt-1">{abandonedPercent}%</p>
          )}
        </div>

      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{total}</div>
          <div className="text-xs text-gray-600 mt-1">Total Started</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{completedPercent}%</div>
          <div className="text-xs text-gray-600 mt-1">Completion Rate</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{active}</div>
          <div className="text-xs text-gray-600 mt-1">Active Now</div>
        </div>
      </div>

    </div>
  )
}