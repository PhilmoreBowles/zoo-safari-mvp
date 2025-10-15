'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'

export default function TopAnimalsChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 font-semibold">No animal data available</p>
          <p className="text-sm text-gray-400 mt-2">Data will appear as families discover animals</p>
        </div>
      </div>
    )
  }

  // Color palette for bars
  const colors = [
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#10b981', // green
    '#3b82f6', // blue
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
    '#6366f1', // indigo
    '#84cc16', // lime
  ]

  // Format data with icons for display
  const formattedData = data.map((item, index) => ({
    ...item,
    displayName: `${item.icon || '🐾'} ${item.animal}`,
    color: colors[index % colors.length]
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-bold text-gray-800">{payload[0].payload.animal}</p>
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-semibold text-orange-600">{payload[0].value}</span> discoveries
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          layout="horizontal"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            type="category"
            dataKey="displayName"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
          />
          <YAxis 
            type="number"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            content={() => (
              <div className="text-center text-sm text-gray-600 pt-4">
                Number of families who discovered each animal
              </div>
            )}
          />
          <Bar 
            dataKey="count" 
            radius={[8, 8, 0, 0]}
            name="Discoveries"
          >
            {formattedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}