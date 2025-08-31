'use client'
import { supabase } from '../lib/supabase'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

/* eslint-disable react/no-unescaped-entities */

// Custom CSS for html5-qrcode scanner buttons
const scannerButtonStyles = `
  #qr-reader button {
    background-color: #3B82F6 !important;
    color: white !important;
    padding: 12px 24px !important;
    border-radius: 8px !important;
    border: none !important;
    font-weight: 600 !important;
    font-size: 14px !important;
    cursor: pointer !important;
    margin: 8px 4px !important;
    transition: all 0.2s ease !important;
    display: inline-block !important;
    text-decoration: none !important;
    min-width: 140px !important;
    text-align: center !important;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3) !important;
  }
  
  #qr-reader button:hover {
    background-color: #2563EB !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4) !important;
  }
  
  #qr-reader a {
    background-color: #10B981 !important;
    color: white !important;
    padding: 12px 24px !important;
    border-radius: 8px !important;
    border: none !important;
    font-weight: 600 !important;
    font-size: 14px !important;
    cursor: pointer !important;
    margin: 8px 4px !important;
    transition: all 0.2s ease !important;
    display: inline-block !important;
    text-decoration: none !important;
    min-width: 140px !important;
    text-align: center !important;
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3) !important;
  }
  
  #qr-reader a:hover {
    background-color: #059669 !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 8px rgba(16, 185, 129, 0.4) !important;
  }
`
// Dynamic limit based on available riddles for selected difficulty
const RIDDLE_LIMIT = filteredRiddles.length

export default function Home() {
  // State variables
  const [familyName, setFamilyName] = useState('')
  const [gameStarted, setGameStarted] = useState(false)
  const [currentPoints, setCurrentPoints] = useState(0)
  const [discoveredAnimals, setDiscoveredAnimals] = useState([])
  const [currentRiddleIndex, setCurrentRiddleIndex] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [showScanner, setShowScanner] = useState(false)
  const [scanResult, setScanResult] = useState('')
  const [scanError, setScanError] = useState('')
  const [scannerInitialized, setScannerInitialized] = useState(false)
  const [showLimitReached, setShowLimitReached] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState('forward')
  const [riddles, setRiddles] = useState([])

  // QR Scanner ref
  const scannerRef = useRef(null)
  const html5QrcodeScannerRef = useRef(null)

  const transitionToScreen = (callback, direction = 'forward') => {
  setIsTransitioning(true)
  setTransitionDirection(direction)
  
  setTimeout(() => {
    callback()
    setTimeout(() => {
      setIsTransitioning(false)
    }, 150)
  }, 300)
}

// Load saved data when app starts
useEffect(() => {
  const loadFamilySession = async () => {
    const savedFamilyId = localStorage.getItem('zooSafariFamilyId')
    const savedFamily = localStorage.getItem('zooSafariFamilyName')
    const savedRiddleIndex = localStorage.getItem('zooSafariCurrentRiddle')
    const savedDifficulty = localStorage.getItem('zooSafariDifficulty')
    
    if (savedFamilyId && savedFamily) {
      try {
        // Verify family exists and load their progress
        const { data: familyData, error: familyError } = await supabase
          .from('families')
          .select('*')
          .eq('id', savedFamilyId)
          .single()
        
        if (familyData && !familyError) {
          // Family exists, load their progress
          const { data: progressData, error: progressError } = await supabase
            .from('family_progress')
            .select(`
              *,
              riddles (*)
            `)
            .eq('family_id', savedFamilyId)
          
          if (!progressError && progressData) {
            console.log('Loaded family progress:', progressData)
            
            // Calculate total points from database
            const totalPoints = progressData.reduce((sum, record) => sum + record.points_earned, 0)
            setCurrentPoints(totalPoints)
            
            // Reconstruct discovered animals array
            const discoveredAnimals = progressData.map(record => ({
              ...record.riddles,
              discoveredAt: record.completed_at
            }))
            setDiscoveredAnimals(discoveredAnimals)
            
            console.log('Restored session - Points:', totalPoints, 'Animals:', discoveredAnimals.length)
          }
          
          // Restore family session
          setFamilyName(savedFamily)
          setGameStarted(true)
          if (savedDifficulty) setSelectedDifficulty(savedDifficulty)
        } else {
          // Family doesn't exist, clear localStorage
          localStorage.removeItem('zooSafariFamilyId')
          localStorage.removeItem('zooSafariFamilyName')
        }
      } catch (err) {
        console.error('Error loading family session:', err)
      }
    }
    
    // Load current riddle index from localStorage (temporary)
    if (savedRiddleIndex) setCurrentRiddleIndex(parseInt(savedRiddleIndex))
  }
  
  loadFamilySession()
}, [])


// Load riddles from Supabase
useEffect(() => {
  async function fetchRiddles() {
    const { data, error } = await supabase
      .from('riddles')
      .select('*')
      .eq('active', true)
      .order('id')
    
    if (error) {
      console.error('Error fetching riddles:', error)
    } else {
      console.log('Riddles loaded:', data.length)
      setRiddles(data)
    }
  }
  
  fetchRiddles()
}, [])

  // Style QR scanner buttons
useEffect(() => {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    #qr-reader button {
      background: linear-gradient(135deg, #3B82F6, #1E40AF) !important;
      color: white !important;
      padding: 12px 24px !important;
      border-radius: 12px !important;
      border: none !important;
      font-weight: 600 !important;
      font-size: 14px !important;
      cursor: pointer !important;
      margin: 8px 4px !important;
      transition: all 0.2s ease !important;
      display: inline-block !important;
      text-decoration: none !important;
      min-width: 140px !important;
      text-align: center !important;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
    }
    
    #qr-reader button:hover {
      background: linear-gradient(135deg, #1E40AF, #1E3A8A) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4) !important;
    }
    
    #qr-reader a {
      background: linear-gradient(135deg, #10B981, #059669) !important;
      color: white !important;
      padding: 12px 24px !important;
      border-radius: 12px !important;
      border: none !important;
      font-weight: 600 !important;
      font-size: 14px !important;
      cursor: pointer !important;
      margin: 8px 4px !important;
      transition: all 0.2s ease !important;
      display: inline-block !important;
      text-decoration: none !important;
      min-width: 140px !important;
      text-align: center !important;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3) !important;
    }
    
    #qr-reader a:hover {
      background: linear-gradient(135deg, #059669, #047857) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4) !important;
    }
  `;
  document.head.appendChild(styleSheet);

  return () => {
    document.head.removeChild(styleSheet);
  };
}, []);

  // Filter riddles by difficulty
const getFilteredRiddles = () => {
  if (selectedDifficulty === 'all') return riddles
  return riddles.filter(riddle => riddle.difficulty === selectedDifficulty)
}

  const filteredRiddles = getFilteredRiddles()
  const currentRiddle = filteredRiddles[currentRiddleIndex]
  const isLastRiddle = currentRiddleIndex >= filteredRiddles.length - 1



  // Game functions
const startAdventure = async () => {
  if (familyName.trim()) {
    try {
      const { data, error } = await supabase
        .from('families')
        .insert([
          { 
            family_name: familyName.trim(),
            selected_difficulty: selectedDifficulty 
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Error creating family:', error)
        alert('Error starting adventure. Please try again.')
        return
      }

      console.log('Family created successfully:', data)
      
      // Only store family ID and name for session management
      const familyId = data.id
      localStorage.setItem('zooSafariFamilyId', familyId)
      localStorage.setItem('zooSafariFamilyName', familyName)
      localStorage.setItem('zooSafariDifficulty', selectedDifficulty)
      
      transitionToScreen(() => {
        setGameStarted(true)
        // Remove this localStorage call:
        // localStorage.setItem('zooSafariCurrentRiddle', '0')
      })
      
    } catch (err) {
      console.error('Database error:', err)
      alert('Error connecting to database. Please try again.')
    }
  }
}

const nextRiddle = () => {
  transitionToScreen(() => {
    setShowSuccess(false)
    setShowHint(false)
    if (currentRiddleIndex < filteredRiddles.length - 1) {
      const newIndex = currentRiddleIndex + 1
      setCurrentRiddleIndex(newIndex)
      localStorage.setItem('zooSafariCurrentRiddle', newIndex.toString())
    }
  })
}

const foundAnimal = useCallback(async () => {
  if (!currentRiddle) return;
  
  const familyId = localStorage.getItem('zooSafariFamilyId')
  if (!familyId) {
    console.error('No family ID found')
    return
  }

  try {
    // Check if this riddle was already completed by this family
    const { data: existingProgress } = await supabase
      .from('family_progress')
      .select('id')
      .eq('family_id', familyId)
      .eq('riddle_id', currentRiddle.id)
      .single()

    if (!existingProgress) {
      // Only insert if not already completed
      const { data: progressData, error: progressError } = await supabase
        .from('family_progress')
        .insert([{
          family_id: familyId,
          riddle_id: currentRiddle.id,
          points_earned: currentRiddle.points
        }])
        .select()

      if (progressError) {
        console.error('Error saving progress:', progressError)
        return // Don't continue if database save fails
      } else {
        console.log('Progress saved to database:', progressData)
      }
    } else {
      console.log('Riddle already completed, skipping database insert')
    }

    // Update local state (immediate UI updates only)
    const newPoints = currentPoints + currentRiddle.points
    const newAnimals = [...discoveredAnimals, {
      ...currentRiddle,
      discoveredAt: new Date().toISOString()
    }]

    setCurrentPoints(newPoints)
    setDiscoveredAnimals(newAnimals)

    // Remove these localStorage calls:
    // localStorage.setItem('zooSafariPoints', newPoints.toString())
    // localStorage.setItem('zooSafariAnimals', JSON.stringify(newAnimals))

transitionToScreen(() => {
  if (newAnimals.length >= filteredRiddles.length) {
    console.log('Triggering showLimitReached - completed all available riddles')
    setShowLimitReached(true)
  } else {
    console.log('Triggering showSuccess')
    setShowSuccess(true)
  }
})

  } catch (err) {
    console.error('Database error in foundAnimal:', err)
    alert('Unable to save progress. Please check your connection.')
  }
}, [currentPoints, currentRiddle, discoveredAnimals, transitionToScreen])


// Family database functions
const createFamily = async (familyName, difficulty) => {
  try {
    const { data, error } = await supabase
      .from('families')
      .insert([
        {
          family_name: familyName,
          selected_difficulty: difficulty,
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        }
      ])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating family:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error creating family:', error)
    return null
  }
}

const getFamilyById = async (familyId) => {
  try {
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single()
    
    if (error) {
      console.error('Error fetching family:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error fetching family:', error)
    return null
  }
}

const resetDemo = async () => {
  const familyId = localStorage.getItem('zooSafariFamilyId')
  
  // Delete family and their progress from database
  if (familyId) {
    try {
      // Delete family (cascade will handle family_progress)
      await supabase
        .from('families')
        .delete()
        .eq('id', familyId)
      console.log('Family deleted from database')
    } catch (err) {
      console.error('Error cleaning up family record:', err)
    }
  }
  
  // Only clear session-related localStorage
  localStorage.removeItem('zooSafariFamilyId')
  localStorage.removeItem('zooSafariFamilyName')
  localStorage.removeItem('zooSafariDifficulty')
  // Remove these - no longer needed:
  // localStorage.removeItem('zooSafariPoints')
  // localStorage.removeItem('zooSafariAnimals')
  // localStorage.removeItem('zooSafariCurrentRiddle')
  
  // Reset all state
  setFamilyName('')
  setGameStarted(false)
  setCurrentPoints(0)
  setDiscoveredAnimals([])
  setCurrentRiddleIndex(0)
  setShowHint(false)
  setShowSuccess(false)
  setShowLimitReached(false)
  setSelectedDifficulty('all')
  setShowScanner(false)
  setScanResult('')
  setScanError('')
}


  // QR Scanner functions
  const openScanner = () => {
    setShowScanner(true)
    setScanError('')
    setScanResult('')
  }

  const closeScanner = () => {
    setShowScanner(false)
    setScanResult('')
    setScanError('')
  }

  const handleScanSuccess = useCallback((decodedText) => {
  setScanResult(decodedText)
  
  // Check if scanned code matches current riddle
  if (currentRiddle && decodedText === currentRiddle.qrCode) {
    // Correct answer! 
    setShowScanner(false)
    foundAnimal()
  } else if (currentRiddle) {
    // Wrong code scanned (only show error if currentRiddle exists)
    setScanError(`That's not the right animal! You scanned: ${decodedText}`)
    // Auto-clear error after 3 seconds
    setTimeout(() => {
      setScanError('')
    }, 3000)
  }
}, [currentRiddle, foundAnimal])

  const handleScanError = useCallback((error) => {
    // Only log actual errors, not routine scanning messages
    if (error.includes('QR code parse error') || error.includes('No MultiFormat Readers')) {
      // These are normal "no QR code detected" messages, ignore them
      return
    }
    console.log('Scan error:', error)
    if (error.includes('NotAllowedError') || error.includes('Permission denied')) {
      setScanError('Camera permission denied. Please allow camera access and try again.')
    } else {
      setScanError('Having trouble scanning? Make sure the QR code is clear and well-lit.')
    }
  }, [])

  // Initialize QR scanner when modal opens
  useEffect(() => {
    if (showScanner && !scannerInitialized && scannerRef.current) {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        rememberLastUsedCamera: false
      }

      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        config,
        false
      )

      html5QrcodeScanner.render(
        (decodedText) => handleScanSuccess(decodedText),
        (error) => handleScanError(error)
      )

      html5QrcodeScannerRef.current = html5QrcodeScanner
      setScannerInitialized(true)
    }
  }, [showScanner, scannerInitialized, handleScanSuccess, handleScanError])

  // Cleanup scanner when modal closes
  useEffect(() => {
    if (!showScanner && html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear().catch(error => {
        console.log('Error clearing scanner:', error)
      })
      html5QrcodeScannerRef.current = null
      setScannerInitialized(false)
    }
  }, [showScanner])

  // Animal emoji mapping
  const animalEmojis = {
    'Lion': '🦁',
    'Elephant': '🐘', 
    'Giraffe': '🦒',
    'Penguin': '🐧',
    'Monkey': '🐵',
    'Tiger': '🐅',
    'Rhino': '🦏',
    'Orangutan': '🦧',
    'Snow Leopard': '🐆'
  }

    // Show loading screen while riddles are being fetched
if (riddles.length === 0) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 via-orange-300 to-red-400 p-4 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🦁</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Loading Safari...</h1>
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse animation-delay-300"></div>
          <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse animation-delay-600"></div>
        </div>
      </div>
    </div>
  )
}

// Welcome/Setup Screen
if (!gameStarted) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-amber-200 via-orange-300 to-red-400 p-4 relative overflow-hidden transition-all duration-300 ${
      isTransitioning 
        ? transitionDirection === 'forward' 
          ? 'opacity-0 transform -translate-x-8' 
          : 'opacity-0 transform translate-x-8'
        : 'opacity-100 transform translate-x-0'
    }`}>
      {/* Safari Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl">🌿</div>
        <div className="absolute top-32 right-8 text-4xl">🦋</div>
        <div className="absolute bottom-40 left-8 text-5xl">🌺</div>
        <div className="absolute bottom-20 right-16 text-3xl">🍃</div>
        <div className="absolute top-64 left-1/2 text-4xl">🌸</div>
      </div>
      
      <div className="max-w-md mx-auto pt-10 relative z-10">
        <div className="text-center mb-8">
          <div className="mb-6 animate-bounce">
            <div className="text-7xl mb-2">🦁</div>
            <div className="flex justify-center space-x-2 text-2xl">
              <span className="animate-pulse">🐘</span>
              <span className="animate-pulse animation-delay-200">🦒</span>
              <span className="animate-pulse animation-delay-400">🐧</span>
            </div>
          </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
          <h1 className="text-6xl font-black text-gray-700 mb-0 drop-shadow-lg leading-tight">
            Zoo Safari
          </h1>

            <h2 className="text-2x1 font-black text-gray-500-lg leading-tight mt-0 mb-4">
              Learn - Explore - Collect
            </h2>
          </div>
        </div>
        
        <div className="relative mb-8">
          {/* Card Shadow Layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl transform rotate-1 opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl transform -rotate-1 opacity-30"></div>
          
          {/* Main Card */}
          <div className="relative bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border-2 border-white/60 hover:shadow-3xl transition-all duration-500 hover:transform hover:scale-102">
            {/* Decorative Elements */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-3 shadow-lg">
                <span className="text-2xl">👥</span>
            </div>


            <div className="text-center mb-8">
              <div className="inline-flex items-center space-x-3 mb-4">
               
                <h3 className="text-2xl font-black text-gray-800">What's your team name?</h3>
            
              </div>
              <div className="w-42 h-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-full mx-auto"></div>
            </div>
            
            <div className="relative">
              {/* Input Container */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl transform scale-105 opacity-20"></div>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Enter team name..."
                  className="relative w-full p-5 border-3 border-gray-200 rounded-2xl text-xl font-semibold placeholder-gray-400 focus:border-emerald-500 focus:ring-6 focus:ring-emerald-200 transition-all duration-400 bg-gradient-to-br from-gray-50 to-white shadow-inner hover:shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="relative mb-8">
          {/* Card Shadow Layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-700 rounded-3xl transform rotate-2 opacity-15"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl transform -rotate-1 opacity-25"></div>
          
          {/* Main Adventure Selection Card */}
          <div className="relative bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border-2 border-white/60 hover:shadow-3xl transition-all duration-500">
            {/* Decorative Corner Elements */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-amber-300 to-orange-500 rounded-full p-4 shadow-xl">
              <span className="text-3xl">🎯</span>
            </div>

            <div className="text-center mb-10 pt-8">
              <div className="inline-flex items-center space-x-4 mb-6">

                <h3 className="text-3xl font-black text-gray-800">Choose Your Adventure Level</h3>

              </div>
              <div className="flex justify-center space-x-2 mb-4">
              <div className="w-42 h-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-full mx-auto"></div>
              </div>
              <p className="text-gray-600 font-medium">Select the perfect challenge for your group!</p>
            </div>
            
            <div className="space-y-5">
              {/* All Levels Button */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl transform scale-105 opacity-0 group-hover:opacity-30 transition-all duration-300"></div>
                <button
                  onClick={() => setSelectedDifficulty('all')}
                  className={`relative w-full p-6 rounded-2xl text-left transition-all duration-400 transform hover:scale-102 hover:shadow-2xl ${
                    selectedDifficulty === 'all' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-2xl border-3 border-blue-300 scale-102' 
                      : 'bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 hover:border-blue-300 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-full ${selectedDifficulty === 'all' ? 'bg-white/20' : 'bg-blue-100'}`}>
                          <span className="text-2xl">🌟</span>
                        </div>
                        <div className="font-black text-xl">All Levels Adventure</div>
                      </div>
                      <div className={`text-sm font-semibold ${selectedDifficulty === 'all' ? 'text-blue-100' : 'text-gray-600'}`}>
                        9 riddles • Perfect for mixed ages • Maximum fun!
                      </div>
                      <div className="mt-3 flex space-x-1">
                        <div className={`w-2 h-2 rounded-full ${selectedDifficulty === 'all' ? 'bg-white/60' : 'bg-blue-300'}`}></div>
                        <div className={`w-4 h-2 rounded-full ${selectedDifficulty === 'all' ? 'bg-white/80' : 'bg-blue-400'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${selectedDifficulty === 'all' ? 'bg-white/60' : 'bg-blue-300'}`}></div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className={`p-3 rounded-full ${selectedDifficulty === 'all' ? 'bg-white/20' : 'bg-blue-50'}`}>
                        <span className="text-3xl">🎯</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Easy Button */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl transform scale-105 opacity-0 group-hover:opacity-30 transition-all duration-300"></div>
                <button
                  onClick={() => setSelectedDifficulty('easy')}
                  className={`relative w-full p-6 rounded-2xl text-left transition-all duration-400 transform hover:scale-102 hover:shadow-2xl ${
                    selectedDifficulty === 'easy' 
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-2xl border-3 border-green-300 scale-102' 
                      : 'bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 hover:border-green-300 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-full ${selectedDifficulty === 'easy' ? 'bg-white/20' : 'bg-green-100'}`}>
                          <span className="text-2xl">🟢</span>
                        </div>
                        <div className="font-black text-xl">Easy Adventure</div>
                      </div>
                      <div className={`text-sm font-semibold ${selectedDifficulty === 'easy' ? 'text-green-100' : 'text-gray-600'}`}>
                        3 riddles • Ages 4-8 • Simple and fun words
                      </div>
                      <div className="mt-3 flex space-x-1">
                        <div className={`w-6 h-2 rounded-full ${selectedDifficulty === 'easy' ? 'bg-white/80' : 'bg-green-400'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${selectedDifficulty === 'easy' ? 'bg-white/60' : 'bg-green-300'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${selectedDifficulty === 'easy' ? 'bg-white/60' : 'bg-green-300'}`}></div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className={`p-3 rounded-full ${selectedDifficulty === 'easy' ? 'bg-white/20' : 'bg-green-50'}`}>
                        <span className="text-3xl">🐣</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Medium Button */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl transform scale-105 opacity-0 group-hover:opacity-30 transition-all duration-300"></div>
                <button
                  onClick={() => setSelectedDifficulty('medium')}
                  className={`relative w-full p-6 rounded-2xl text-left transition-all duration-400 transform hover:scale-102 hover:shadow-2xl ${
                    selectedDifficulty === 'medium' 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-2xl border-3 border-yellow-300 scale-102' 
                      : 'bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 hover:border-yellow-300 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-full ${selectedDifficulty === 'medium' ? 'bg-white/20' : 'bg-yellow-100'}`}>
                          <span className="text-2xl">🟡</span>
                        </div>
                        <div className="font-black text-xl">Medium Quest</div>
                      </div>
                      <div className={`text-sm font-semibold ${selectedDifficulty === 'medium' ? 'text-yellow-100' : 'text-gray-600'}`}>
                        3 riddles • Ages 8-12 • Science and discovery
                      </div>
                      <div className="mt-3 flex space-x-1">
                        <div className={`w-2 h-2 rounded-full ${selectedDifficulty === 'medium' ? 'bg-white/60' : 'bg-yellow-300'}`}></div>
                        <div className={`w-6 h-2 rounded-full ${selectedDifficulty === 'medium' ? 'bg-white/80' : 'bg-yellow-400'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${selectedDifficulty === 'medium' ? 'bg-white/60' : 'bg-yellow-300'}`}></div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className={`p-3 rounded-full ${selectedDifficulty === 'medium' ? 'bg-white/20' : 'bg-yellow-50'}`}>
                        <span className="text-3xl">🧪</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Hard Button */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl transform scale-105 opacity-0 group-hover:opacity-30 transition-all duration-300"></div>
                <button
                  onClick={() => setSelectedDifficulty('hard')}
                  className={`relative w-full p-6 rounded-2xl text-left transition-all duration-400 transform hover:scale-102 hover:shadow-2xl ${
                    selectedDifficulty === 'hard' 
                      ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-2xl border-3 border-red-300 scale-102' 
                      : 'bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 hover:border-red-300 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-full ${selectedDifficulty === 'hard' ? 'bg-white/20' : 'bg-red-100'}`}>
                          <span className="text-2xl">🔴</span>
                        </div>
                        <div className="font-black text-xl">Expert Challenge</div>
                      </div>
                      <div className={`text-sm font-semibold ${selectedDifficulty === 'hard' ? 'text-red-100' : 'text-gray-600'}`}>
                        3 riddles • Ages 12+ • Conservation heroes
                      </div>
                      <div className="mt-3 flex space-x-1">
                        <div className={`w-2 h-2 rounded-full ${selectedDifficulty === 'hard' ? 'bg-white/60' : 'bg-red-300'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${selectedDifficulty === 'hard' ? 'bg-white/60' : 'bg-red-300'}`}></div>
                        <div className={`w-6 h-2 rounded-full ${selectedDifficulty === 'hard' ? 'bg-white/80' : 'bg-red-400'}`}></div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className={`p-3 rounded-full ${selectedDifficulty === 'hard' ? 'bg-white/20' : 'bg-red-50'}`}>
                        <span className="text-3xl">🔬</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>


        <button
          onClick={startAdventure}
          disabled={!familyName.trim()}
          className="w-full bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-500 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-500 text-white font-bold py-5 px-8 rounded-2xl text-xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl disabled:hover:scale-100 disabled:hover:shadow-2xl border-2 border-white/30"
        >
          <div className="flex items-center justify-center space-x-3">
            <span>🚀</span>
            <span>Start Adventure!</span>
            <span>🌟</span>
          </div>
        </button>
      </div>
    </div>
  )
}


  // Success celebration screen
  if (showSuccess) {
    return (
    <div className={`min-h-screen bg-gradient-to-br from-amber-200 via-orange-300 to-pink-500 p-4 relative overflow-hidden transition-all duration-300 ${
      isTransitioning 
        ? transitionDirection === 'forward' 
          ? 'opacity-0 transform -translate-x-8' 
          : 'opacity-0 transform translate-x-8'
        : 'opacity-100 transform translate-x-0'
    }`}>
        {/* Celebration Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-8 text-4xl animate-spin">🌟</div>
          <div className="absolute top-20 right-10 text-3xl animate-bounce">🎉</div>
          <div className="absolute bottom-32 left-12 text-5xl animate-pulse">✨</div>
          <div className="absolute bottom-20 right-6 text-4xl animate-spin animation-delay-1000">🌟</div>
          <div className="absolute top-1/2 left-8 text-3xl animate-bounce animation-delay-500">🎈</div>
          <div className="absolute top-1/3 right-16 text-4xl animate-pulse animation-delay-2000">🎆</div>
        </div>

        <div className="max-w-md mx-auto pt-8 relative z-10">
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="text-8xl mb-4 animate-bounce">
                {animalEmojis[currentRiddle.animal]}
              </div>
              <div className="flex justify-center space-x-2 text-3xl">
                <span className="animate-pulse">🎉</span>
                <span className="animate-pulse animation-delay-300">🎊</span>
                <span className="animate-pulse animation-delay-600">✨</span>
              </div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 shadow-3xl border-2 border-white/50 mb-6">
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4 animate-pulse">
                AMAZING DISCOVERY!
              </h1>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                You found the {currentRiddle.animal}!
              </h2>
              
              <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-white rounded-2xl py-4 px-8 mb-6 shadow-xl animate-pulse">
                <div className="flex items-center justify-center space-x-3">
                  <span className="text-3xl">🏆</span>
                  <div>
                    <p className="text-2xl font-black">
                      +{currentRiddle.points} POINTS!
                    </p>
                    <p className="text-sm font-semibold opacity-90">
                      Outstanding work!
                    </p>
                  </div>
                  <span className="text-3xl">🌟</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 border-4 border-blue-300 rounded-3xl p-8 mb-6 shadow-2xl">
              <div className="flex items-start space-x-4">
                <div className="text-4xl">🤓</div>
                <div className="text-left">
                  <h3 className="text-2xl font-black text-blue-800 mb-3">
                    Did You Know?
                  </h3>
                  <p className="text-blue-700 leading-relaxed text-lg font-medium">
                    {currentRiddle.fact}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 mb-6 border border-white/50">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600 mb-2">
                    {currentPoints}
                  </div>
                  <div className="text-sm font-bold text-gray-700">
                    🏆 Total Points
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-600 mb-2">
                    {discoveredAnimals.length}
                  </div>
                  <div className="text-sm font-bold text-gray-700">
                    🦁 Animals Found
                  </div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4 mt-6 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 h-4 rounded-full transition-all duration-2000 shadow-lg"
                  style={{width: `${(discoveredAnimals.length / filteredRiddles.length) * 100}%`}}
                ></div>
              </div>
              <p className="text-sm font-semibold text-gray-600 mt-3">
                {discoveredAnimals.length} of {filteredRiddles.length} animals discovered
              </p>
            </div>
          </div>

          {!isLastRiddle && (
            <button
              onClick={nextRiddle}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 hover:from-blue-600 hover:via-purple-700 hover:to-pink-700 text-white font-black py-5 px-8 rounded-2xl text-2xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-2 border-white/40"
            >
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">🚀</span>
                <span>Next Adventure!</span>
                <span className="text-2xl">🎯</span>
              </div>
            </button>
          )}
          
          {isLastRiddle && (
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white rounded-3xl p-8 mb-6 shadow-2xl border-2 border-white/40">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-3xl font-black mb-3">SAFARI COMPLETE!</h3>
                <p className="text-xl font-semibold">You're an amazing animal explorer!</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 hover:from-green-600 hover:via-emerald-700 hover:to-teal-700 text-white font-black py-5 px-8 rounded-2xl text-xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-2 border-white/40"
              >
                <div className="flex items-center justify-center space-x-3">
                  <span className="text-xl">🎯</span>
                  <span>Start New Adventure</span>
                  <span className="text-xl">🌟</span>
                </div>
              </button>
            </div>
          )}
          {/* Add this notification link */}
<div className="text-center mt-6">
  <a 
    href="https://zoosafari.app" 
    target="_blank" 
    rel="noopener noreferrer"
    className="text-sm text-gray-600 hover:text-gray-800 underline transition-colors duration-200"
  >
    Get notified when the full game is released
  </a>
</div>
        </div>
      </div>
    )
  }

  // Limit reached screen
  if (showLimitReached) {
    return (
    <div className={`min-h-screen bg-gradient-to-br from-indigo-400 via-blue-300 to-sky-200 p-4 relative overflow-hidden transition-all duration-300 ${
      isTransitioning 
        ? transitionDirection === 'forward' 
          ? 'opacity-0 transform -translate-x-8' 
          : 'opacity-0 transform translate-x-8'
        : 'opacity-100 transform translate-x-0'
    }`}>        {/* Celebration Background Elements */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-12 left-10 text-5xl animate-spin">🎊</div>
          <div className="absolute top-24 right-8 text-4xl animate-bounce">🎉</div>
          <div className="absolute bottom-40 left-6 text-6xl animate-pulse">✨</div>
          <div className="absolute bottom-24 right-12 text-5xl animate-spin animation-delay-1000">🌟</div>
          <div className="absolute top-1/2 left-1/4 text-4xl animate-bounce animation-delay-500">🎈</div>
          <div className="absolute top-1/3 right-1/4 text-5xl animate-pulse animation-delay-2000">🎆</div>
        </div>

        <div className="max-w-md mx-auto pt-8 relative z-10">
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="text-8xl mb-4 animate-bounce">🎯</div>
              <div className="flex justify-center space-x-2 text-4xl">
                <span className="animate-pulse">🏆</span>
                <span className="animate-pulse animation-delay-300">👑</span>
                <span className="animate-pulse animation-delay-600">🌟</span>
              </div>
            </div>
            
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 shadow-3xl border-2 border-white/50 mb-8">
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-3">
                Demo Complete!
              </h1>
              <p className="text-xl font-semibold text-gray-700 leading-relaxed">
                You've completed the demo! Sign up to be notified when the full Zoo Safari launches with 
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> 50+ riddles</span>
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 mb-8 border border-white/50">
              <div className="grid grid-cols-2 gap-6 text-center mb-6">
                <div>
                  <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600 mb-2">
                    {currentPoints}
                  </div>
                  <div className="text-sm font-bold text-gray-700">
                    🏆 Final Score
                  </div>
                </div>
                <div>
                  <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-600 mb-2">
                    {discoveredAnimals.length}
                  </div>
                  <div className="text-sm font-bold text-gray-700">
                    🦁 Animals Discovered
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-center space-x-2">
                  <span>🏛️</span>
                  <span>Your Digital Zoo</span>
                  <span>🦒</span>
                </h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {discoveredAnimals.map((animal, index) => (
                    <div key={index} className="bg-gradient-to-br from-yellow-200 via-orange-200 to-red-200 rounded-2xl p-4 shadow-lg border-2 border-yellow-300 transform hover:scale-110 transition-all duration-300">
                      <span className="text-4xl">
                        {animalEmojis[animal.animal]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <a 
              href="https://zoosafari.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-yellow-500 via-amber-600 to-orange-600 hover:from-pink-700 hover:via-rose-700 hover:to-red-700 text-white font-black py-5 px-8 rounded-2xl text-xl text-center shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-white/40"
            >
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">🚀</span>
                <span>Get Notified When Full Game Launches!</span>
                <span className="text-2xl">📧</span>
              </div>
            </a>
            
<button
  onClick={resetDemo}
  className="w-full bg-gradient-to-r from-gray-400 to-gray-600 hover:from-gray-500 hover:to-gray-700 text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-xl transform hover:scale-105 transition-all duration-300"
>
              <div className="flex items-center justify-center space-x-3">
                <span className="text-xl">🔄</span>
                <span>Try Demo Again</span>
                <span className="text-xl">🎮</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

// Main game interface
  return (
    <div className={`min-h-screen bg-gradient-to-br from-amber-200 via-orange-200 to-red-400 p-4 relative overflow-hidden transition-all duration-300 ${
      isTransitioning 
        ? transitionDirection === 'forward' 
          ? 'opacity-0 transform -translate-x-8' 
          : 'opacity-0 transform translate-x-8'
        : 'opacity-100 transform translate-x-0'
    }`}>      {/* Safari Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-16 left-6 text-4xl animate-pulse">🌴</div>
        <div className="absolute top-8 right-12 text-3xl animate-pulse animation-delay-1000">🦎</div>
        <div className="absolute bottom-32 left-4 text-5xl animate-pulse animation-delay-2000">🌊</div>
        <div className="absolute bottom-16 right-8 text-4xl animate-pulse animation-delay-1500">🗻</div>
        <div className="absolute top-40 left-1/3 text-3xl animate-pulse animation-delay-500">☀️</div>
      </div>

      <div className="max-w-md mx-auto relative z-10">
{/* Enhanced Header */}
        <div className="relative mb-12 mt-10">
          {/* Header Shadow Layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-red-700 rounded-3xl transform rotate-1 opacity-15"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl transform -rotate-1 opacity-25"></div>
          
          {/* Main Header Card */}
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border-10 border-white/60 hover:shadow-3xl transition-all duration-500">
            
            {/* Decorative Corner Elements */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-4 shadow-xl">
              <span className="text-3xl">🧭</span>
            </div>

            <div className="flex justify-between items-center">
              {/* Family Info Section */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">

                  <h1 className="text-2xl font-black justify-center text-gray-800">
                    {familyName} <br></br>Expedition
                  </h1>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className={`px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md ${
                    selectedDifficulty === 'all' ? 'bg-gradient-to-r from-blue-500 to-purple-600' :
                    selectedDifficulty === 'easy' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                    selectedDifficulty === 'medium' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                    'bg-gradient-to-r from-red-500 to-pink-600'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span>
                        {selectedDifficulty === 'all' ? '🌟' :
                         selectedDifficulty === 'easy' ? '🟢' :
                         selectedDifficulty === 'medium' ? '🟡' : '🔴'}
                      </span>
                      <span>
                        {selectedDifficulty === 'all' ? 'Mixed Adventure' : 
                         selectedDifficulty === 'easy' ? 'Easy Adventure' :
                         selectedDifficulty === 'medium' ? 'Medium Quest' : 'Expert Challenge'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Points Display */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-red-500 rounded-3xl transform scale-110 opacity-20"></div>
                <div className="relative bg-gradient-to-br from-yellow-400 to-red-500 rounded-3xl p-6 shadow-xl border-2 border-white/50">
                  <div className="text-center">
                    <div className="bg-white/20 rounded-full p-2 mb-2 inline-block">
                      <span className="text-3xl">🏆</span>
                    </div>
                    <div className="text-xs font-bold text-white mb-1 opacity-90">Points</div>
                    <div className="text-3xl font-black text-white">{currentPoints}</div>
                    <div className="w-8 h-1 bg-white/40 rounded-full mx-auto mt-2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

{/* Current Riddle */}
        <div className="relative mb-12">
          {/* Multi-layered Shadow Effects */}

          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl transform -rotate-1 opacity-15"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl transform rotate-1 opacity-10"></div>
          
          {/* Main Riddle Card */}
          <div className="relative bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border-2 border-white/70 hover:shadow-4xl transition-all duration-500">
            
            {/* Decorative Corner Elements */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-4 shadow-xl">
              <span className="text-3xl">🔍</span>
            </div>


            {/* Header Section */}
            <div className="text-center mb-8 pt-8">
              <div className="inline-flex items-center justify-center space-x-4 mb-6">

                <h2 className="text-3xl font-black text-gray-800">
                  Riddle #{currentRiddleIndex + 1}
                </h2>
  
              </div>
              
              {/* Enhanced Difficulty Badge */}
              <div className="relative inline-block mb-6">
                <div className={`absolute inset-0 rounded-2xl transform scale-110 opacity-30 ${
                  currentRiddle.difficulty === 'easy' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                  currentRiddle.difficulty === 'medium' ? 'bg-gradient-to-r from-yellow-400 to-orange-600' :
                  'bg-gradient-to-r from-red-500 to-pink-600'
                }`}></div>
                <div className={`relative px-6 py-3 rounded-2xl text-sm font-black text-white shadow-xl border-2 border-white/50 ${
                  currentRiddle.difficulty === 'easy' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                  currentRiddle.difficulty === 'medium' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                  'bg-gradient-to-r from-red-500 to-pink-600'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {currentRiddle.difficulty === 'easy' ? '🟢' :
                       currentRiddle.difficulty === 'medium' ? '🟡' : '🔴'}
                    </span>
                    <span>
                      {currentRiddle.difficulty === 'easy' ? 'Easy Adventure' :
                       currentRiddle.difficulty === 'medium' ? 'Medium Quest' : 'Expert Challenge'}
                    </span>
                    <span className="text-lg">
                      {currentRiddle.difficulty === 'easy' ? '🐣' :
                       currentRiddle.difficulty === 'medium' ? '🧪' : '🔬'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="flex justify-center space-x-2 mb-8">
                {filteredRiddles.map((_, index) => (
                  <div key={index} className={`h-2 rounded-full transition-all duration-500 ${
                    index === currentRiddleIndex ? 'w-8 bg-gradient-to-r from-blue-400 to-indigo-500 shadow-lg' :
                    index < currentRiddleIndex ? 'w-4 bg-gradient-to-r from-green-400 to-emerald-500' :
                    'w-2 bg-gray-300'
                  }`}></div>
                ))}
              </div>
            </div>

            {/* Riddle Content Container */}
            <div className="relative mb-8">

              {/* Main Riddle Container */}
              <div className="relative bg-gradient-to-br from-neutral-50/90 via-zinc-50/90 to-stone-50/90 border-3 border-indigo-200 rounded-3xl p-8 shadow-inner backdrop-blur-sm">
                
                {/* Scroll Decoration */}
                <div className="flex justify-center mb-6">
                  <div className="bg-gradient-to-r from-amber-200 to-yellow-300 rounded-full p-3 shadow-lg">
                    <span className="text-4xl">📜</span>
                  </div>
                </div>

                {/* Riddle Text */}
                <div className="relative">
                  <p className="text-gray-800 leading-relaxed text-xl font-semibold text-center px-4" style={{whiteSpace: 'pre-line'}}>
  {currentRiddle.riddle.replace(/\\n/g, '\n')}
</p>
                  
                  {/* Decorative Lines */}
                  <div className="flex justify-center mt-6 space-x-2">
                    <div className="w-40 h-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hint Section */}
            {!showHint && (
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-600 rounded-2xl transform scale-105 opacity-20"></div>
                <button
                  onClick={() => setShowHint(true)}
                  className="relative w-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 hover:from-yellow-500 hover:via-orange-500 hover:to-red-500 text-white font-bold py-5 px-8 rounded-2xl shadow-xl transform transition-all duration-300 hover:scale-102 hover:shadow-2xl border-2 border-white/40"
                >
                  <div className="flex items-center justify-center space-x-4">
                    <div className="bg-white/20 rounded-full p-2">
                      <span className="text-2xl">💡</span>
                    </div>
                    <span className="text-xl font-black">Need a Hint?</span>
                    <div className="bg-white/20 rounded-full p-2">
                      <span className="text-2xl">🤔</span>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Hint Display */}
            {showHint && (
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 to-orange-300 rounded-3xl transform rotate-1 opacity-40"></div>
                <div className="relative bg-gradient-to-br from-yellow-100/95 via-yellow-50/95 to-orange-100/95 border-3 border-yellow-400 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
                  
                  {/* Hint Icon */}
                  <div className="flex justify-center mb-4">
                    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-3 shadow-lg">
                      <span className="text-3xl">💡</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="font-black text-yellow-800 mb-4 text-xl">Helpful Hint</div>
                    <p className="text-yellow-700 font-bold leading-relaxed text-lg">
                      {currentRiddle.hint}
                    </p>
                    
                    {/* Decorative Elements */}
                    <div className="flex justify-center mt-6 space-x-3">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse animation-delay-300"></div>
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse animation-delay-600"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons Container */}
            <div className="space-y-4">
              
              {/* QR Scanner Button */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl transform scale-105 opacity-30"></div>
                <button
                  onClick={openScanner}
                  className="relative w-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white font-black py-6 px-10 rounded-2xl text-xl shadow-2xl transform transition-all duration-300 hover:scale-102 hover:shadow-3xl border-3 border-white/40"
                >
                  <div className="flex items-center justify-center space-x-4">
                    <div className="bg-white/20 rounded-full p-3">
                      <span className="text-3xl">📱</span>
                    </div>
                    <div className="text-center">
                      <div className="font-black text-xl">Scan QR Code</div>
                      <div className="text-sm opacity-90 font-semibold">Find the animal!</div>
                    </div>
                    <div className="bg-white/20 rounded-full p-3">
                      <span className="text-3xl">🎯</span>
                    </div>
                  </div>
                </button>
              </div>

              {/* Manual Entry for Testing */}
              <button
                onClick={foundAnimal}
                className="w-full bg-gradient-to-r from-gray-400 to-gray-600 hover:from-gray-500 hover:to-gray-700 text-white font-semibold py-3 px-6 rounded-xl text-sm shadow-lg transform transition-all duration-200 hover:scale-101 opacity-75 hover:opacity-90"
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>🔧</span>
                  <span>Manual Complete (Testing Only)</span>
                </div>
              </button>
            </div>
          </div>
        </div>

{/* Enhanced QR Scanner Modal */}
        {showScanner && (
          <div className="fixed inset-0 bg-gradient-to-br from-black/80 via-gray-900/70 to-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-4">
            <div className="relative max-w-sm w-full">
              {/* Modal Shadow Layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl transform rotate-2 opacity-20"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl transform -rotate-1 opacity-30"></div>
              
              {/* Main Modal */}
              <div className="relative bg-amber-50/98 backdrop-blur-xl rounded-3xl shadow-3xl p-8 border-2 border-white/60">
                
                {/* Decorative Elements */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full p-4 shadow-xl">
                  <span className="text-3xl">📱</span>
                </div>


                {/* Header */}
                <div className="text-center mb-8 pt-8">
                  <div className="flex justify-between items-center">
                    <div className="flex-1"></div>
                    <h3 className="text-2xl font-black text-gray-800 flex items-center space-x-3">
                      <span>🔍</span>
                      <span>Find & Scan QR Code</span>
                    </h3>
                    <button
                      onClick={closeScanner}
                      className="text-gray-500 hover:text-gray-700 text-3xl font-bold hover:bg-red-100 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 transform hover:scale-110"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="flex justify-center space-x-2 mt-4">
                    <div className="w-22 h-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"></div>

                  </div>
                </div>



                {/* Scanner Component Container */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl transform rotate-1 opacity-30"></div>                  <div className="relative bg-gradient-to-br from-gray-100 to-white rounded-2xl p-4 border-2 border-gray-200 shadow-inner">
                    <div 
                      id="qr-reader" 
                      ref={scannerRef}
                      className="w-full rounded-xl overflow-hidden"
                      style={{ minHeight: '250px' }}
                    ></div>
                  </div>
                </div>

                {/* Success feedback */}
                {scanResult && !scanError && (
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-200 to-emerald-300 rounded-2xl transform rotate-1 opacity-40"></div>
                    <div className="relative bg-gradient-to-r from-green-100/95 to-emerald-100/95 border-2 border-green-400 text-green-800 px-6 py-4 rounded-2xl text-sm font-bold shadow-inner">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-1 shadow-md">
                          <span className="text-white text-sm">✅</span>
                        </div>
                        <span>Code scanned: {scanResult}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error feedback */}
                {scanError && (
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-200 to-pink-300 rounded-2xl transform rotate-1 opacity-40"></div>
                    <div className="relative bg-gradient-to-r from-red-100/95 to-pink-100/95 border-2 border-red-400 text-red-700 px-6 py-4 rounded-2xl text-sm font-bold shadow-inner">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-full p-1 shadow-md">
                          <span className="text-white text-sm">⚠️</span>
                        </div>
                        <span>{scanError}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Instructions */}
                <div className="text-center mb-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl transform rotate-1 opacity-50"></div>
                    <div className="relative bg-gradient-to-br from-gray-50/95 to-white/95 rounded-2xl p-6 border border-gray-200 shadow-inner">
                      <div className="mb-3">
                        <p className="text-sm font-black text-gray-700 mb-2">
                          🔍 Find the correct exhibit and scan its QR code!
                        </p>
                        <p className="text-xs text-gray-500 font-semibold">
                          Make sure the code is well-lit and centered.
                        </p>
                      </div>
                      
                      <div className="flex justify-center space-x-1 mt-4">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        <div className="w-4 h-2 bg-gray-500 rounded-full animate-pulse animation-delay-300"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse animation-delay-600"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl transform scale-105 opacity-20"></div>
                    <button
                      onClick={closeScanner}
                      className="relative w-full bg-gradient-to-r from-gray-300 to-gray-500 hover:from-gray-400 hover:to-gray-600 text-gray-800 font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-102 shadow-xl border-2 border-white/40"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <div className="bg-white/20 rounded-full p-2">
                          <span className="text-lg">📖</span>
                        </div>
                        <span>Read Riddle Again</span>
                      </div>
                    </button>
                  </div>
                  
                  {/* Emergency manual entry */}
                  <details className="text-center">
                    <summary className="text-xs text-gray-500 cursor-pointer font-semibold hover:text-gray-700 transition-colors">
                      Having trouble scanning?
                    </summary>
                    <div className="mt-4 relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl transform scale-105 opacity-20"></div>
                      <button
                        onClick={() => { closeScanner(); foundAnimal(); }}
                        className="relative text-xs bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg transform hover:scale-105 border border-white/40"
                      >
                        <span>Skip Scanning (Testing)</span>
                      </button>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        )}

{/* Enhanced Digital Zoo Collection */}
        <div className="relative">
          
          {/* Main Collection Card */}
          <div className="relative bg-white/20 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border-2 border-white/60 hover:shadow-3xl transition-all duration-500">
            
            {/* Decorative Corner Elements */}
        <div className="text-center mb-0 pt-8">
          <div className="mb-6 animate-bounce">
            <div className="text-7xl mb-2">🦁</div>
            <div className="flex justify-center space-x-2 text-2xl">
              <span className="animate-pulse">🐘</span>
              <span className="animate-pulse animation-delay-200">🦒</span>
              <span className="animate-pulse animation-delay-400">🐧</span>
            </div>
          </div>
        </div>

            {/* Header */}
            <div className="text-center mb-2">
              <div className="inline-flex items-center space-x-4 mb-6">

                <h3 className="text-4xl font-black text-gray-800">My Digital Zoo</h3>

              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl transform scale-110 opacity-20"></div>
                  <div className="relative bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-2xl p-4 shadow-xl">
                    <div className="text-3xl font-black">{discoveredAnimals.length}</div>
                    <div className="text-sm font-semibold opacity-90">Animals Found</div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-2xl transform scale-110 opacity-20"></div>
                  <div className="relative bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl p-4 shadow-xl">
                    <div className="text-3xl font-black">{filteredRiddles.length}</div>
                    <div className="text-sm font-semibold opacity-90">Total Available</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="mb-16">
              <div className="relative w-full bg-gray-200 rounded-full h-4 shadow-inner overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
                <div 
                  className="relative bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-500 h-4 rounded-full transition-all duration-2000 shadow-lg"
                  style={{width: `${(discoveredAnimals.length / filteredRiddles.length) * 100}%`}}
                >
            
                </div>
              </div>
              
              
            </div>

            {/* Animal Collection Display */}
            {discoveredAnimals.length > 0 ? (
              <div>
                <div className="text-center mb-6">
                  <div className="inline-block bg-gradient-to-r from-amber-400 to-orange-500 text-white text-2xl rounded-2xl px-6 py-3 shadow-2x1 font-black">
                    <span className="text-lg">🎖️</span> My Collection <span className="text-lg">🎖️</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {discoveredAnimals.map((animal, index) => (
                    <div key={index} className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 to-orange-300 rounded-2xl transform rotate-3 opacity-0 group-hover:opacity-40 transition-all duration-300"></div>
                      <div className="relative bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 rounded-2xl p-4 shadow-xl border-2 border-yellow-200 transform hover:scale-110 hover:rotate-2 transition-all duration-300 cursor-pointer">
                        <div className="text-center">
                          <div className="text-4xl mb-2">
                            {animalEmojis[animal.animal]}
                          </div>
                          <div className="text-xs font-bold text-gray-700">
                            {animal.animal}
                          </div>
                          <div className="w-6 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto mt-2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-8 border-2 border-dashed border-gray-300">
                  <div className="text-4xl mb-4 opacity-50">🔍</div>
                  <p className="text-gray-500 font-semibold">Start solving riddles to build your collection!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}