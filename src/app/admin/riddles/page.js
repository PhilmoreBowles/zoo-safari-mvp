'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function RiddlesAdmin() {
  const [riddles, setRiddles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingRiddle, setEditingRiddle] = useState(null)
  const router = useRouter()

  // Form state
const [formData, setFormData] = useState({
  animal: '',
  riddle: '',
  hint: '',
  difficulty: 'easy',
  points: 50,
  fact: '',
  qr_code: '',
  icon: '',
  active: true
})

  // Check authentication
  useEffect(() => {
    const isAuth = sessionStorage.getItem('zooAdminAuth')
    if (!isAuth) {
      router.push('/admin')
    }
  }, [router])

  // Load riddles from database
  const loadRiddles = async () => {
    try {
      const { data, error } = await supabase
        .from('riddles')
        .select('*')
        .order('id')
      
      if (error) {
        console.error('Error loading riddles:', error)
      } else {
        setRiddles(data)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRiddles()
  }, [])

// Handle form submission - FIXED VERSION
const handleSubmit = async (e) => {
  e.preventDefault()
  
  try {
    if (editingRiddle) {
      // Update existing riddle using integer ID
      const updateData = {
        animal: formData.animal,
        riddle: formData.riddle,
        hint: formData.hint,
        difficulty: formData.difficulty,
        points: formData.points,
        fact: formData.fact,
        qr_code: formData.qr_code,
        active: formData.active
      }
      
      const { error } = await supabase
        .from('riddles')
        .update(updateData)
        .eq('id', editingRiddle.id)
      
      if (error) throw error
      alert('Riddle updated successfully!')
      
    } else {
      // Add new riddle - let database auto-generate both id and uuid
      const insertData = {
        animal: formData.animal,
        riddle: formData.riddle,
        hint: formData.hint,
        difficulty: formData.difficulty,
        points: formData.points,
        fact: formData.fact,
        qr_code: formData.qr_code,
        active: formData.active
        // NOTE: Do NOT include 'id' or 'uuid' - let database generate both
      }
      
      console.log('Clean insert data:', insertData)
      
      const { data, error } = await supabase
        .from('riddles')
        .insert([insertData])
        .select('*')
      
      if (error) throw error
      console.log('New riddle created:', data)
      alert('Riddle added successfully!')
    }
    
    // Reset form and refresh riddles
    setFormData({
      animal: '',
      riddle: '',
      hint: '',
      difficulty: 'easy',
      points: 50,
      fact: '',
      qr_code: '',
      active: true
    })
    setShowAddForm(false)
    setEditingRiddle(null)
    loadRiddles()
    
  } catch (error) {
    console.error('Error saving riddle:', error)
    alert('Error saving riddle: ' + error.message)
  }
}

  // Handle edit
  const handleEdit = (riddle) => {
    setFormData({
      animal: riddle.animal,
      riddle: riddle.riddle,
      hint: riddle.hint,
      difficulty: riddle.difficulty,
      points: riddle.points,
      fact: riddle.fact,
      qr_code: riddle.qr_code || '',
      active: riddle.active
    })
    setEditingRiddle(riddle)
    setShowAddForm(true)
  }

  // Handle delete
  const handleDelete = async (riddleId) => {
    if (confirm('Are you sure you want to delete this riddle?')) {
      try {
        const { error } = await supabase
          .from('riddles')
          .delete()
          .eq('id', riddleId)
        
        if (error) throw error
        alert('Riddle deleted successfully!')
        loadRiddles()
      } catch (error) {
        console.error('Error deleting riddle:', error)
        alert('Error deleting riddle: ' + error.message)
      }
    }
  }

  // Logout function
  const handleLogout = () => {
    sessionStorage.removeItem('zooAdminAuth')
    router.push('/admin')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold">Loading riddles...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="text-7xl mb-2">🦁</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Zoo Safari Riddle Management</h1>
              <p className="text-gray-600">Add, Edit or Delete Riddles</p>
              <p className="text-gray-600"><b>Hint</b> should be the same difficulty as the riddle.</p>
              <p className="text-gray-600"><b>Fun Fact</b> should be the same education level as the riddle.</p>
            </div>
            <div className="flex space-x-4">
<button
  onClick={() => {
    // Clear ALL form data including any lingering id
    setFormData({
      animal: '',
      riddle: '',
      hint: '',
      difficulty: 'easy',
      points: 50,
      fact: '',
      qr_code: '',
      active: true
    })
    setEditingRiddle(null)
    setShowAddForm(true)
  }}
  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
>
  Add New Riddle
</button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingRiddle ? 'Edit Riddle' : 'Add New Riddle'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Animal Name
                  </label>
                  <input
                    type="text"
                    value={formData.animal}
                    onChange={(e) => setFormData({...formData, animal: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Riddle Text
                </label>
                <textarea
                  value={formData.riddle}
                  onChange={(e) => setFormData({...formData, riddle: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  rows="3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Hint (appropriate to riddle difficulty)
                </label>
                <textarea
                  value={formData.hint}
                  onChange={(e) => setFormData({...formData, hint: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  rows="2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Fun Fact (appropriate to education level)
                </label>
                <textarea
                  value={formData.fact}
                  onChange={(e) => setFormData({...formData, fact: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  rows="2"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Points
                  </label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    QR Code Value
                  </label>
                  <input
                    type="text"
                    value={formData.qr_code}
                    onChange={(e) => setFormData({...formData, qr_code: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    placeholder="e.g., LION, ELEPHANT"
                  />
                </div>

<div>
  <label className="block text-sm font-bold text-gray-700 mb-2">
    Animal Icon (Emoji)
  </label>
  <input
    type="text"
    value={formData.icon}
    onChange={(e) => setFormData({...formData, icon: e.target.value})}
    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
    placeholder="e.g., 🦁, 🐘, 🦒"
    maxLength="2"
  />
  <p className="text-xs text-gray-500 mt-1">Copy/paste an animal emoji</p>
</div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="active" className="text-sm font-bold text-gray-700">
                  Active (visible to users)
                </label>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
                >
                  {editingRiddle ? 'Update Riddle' : 'Add Riddle'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingRiddle(null)
                    setFormData({
                      animal: '',
                      riddle: '',
                      hint: '',
                      difficulty: 'easy',
                      points: 50,
                      fact: '',
                      qr_code: '',
                      active: true
                    })
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Riddles List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Current Riddles ({riddles.length})</h2>
            
            {riddles.length === 0 ? (
              <p className="text-gray-500">No riddles found.</p>
            ) : (
              <div className="space-y-4">
                {riddles.map((riddle) => (
                  <div key={riddle.id} className={`border rounded-lg p-4 ${riddle.active ? 'bg-white' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="text-xl font-bold">{riddle.animal}</h3>
                          <span className={`px-2 py-1 rounded text-sm font-semibold ${
                            riddle.difficulty === 'easy' ? 'bg-green-200 text-green-800' :
                            riddle.difficulty === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-red-200 text-red-800'
                          }`}>
                            {riddle.difficulty}
                          </span>
                          <span className="text-sm text-gray-600">{riddle.points} points</span>
                          <span className={`px-2 py-1 rounded text-sm ${
                            riddle.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
                          }`}>
                            {riddle.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-2">{riddle.riddle}</p>
                        <p className="text-sm text-gray-600 mb-2"><strong>Hint:</strong> {riddle.hint}</p>
                        <p className="text-sm text-gray-600 mb-2"><strong>Fact:</strong> {riddle.fact}</p>
                        {riddle.qr_code && (
                          <p className="text-sm text-gray-600"><strong>QR Code:</strong> {riddle.qr_code}</p>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(riddle)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(riddle.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}