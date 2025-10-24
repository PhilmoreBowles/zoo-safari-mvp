'use client'
import { supabase } from '../lib/supabase'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import SurveyModal from '../components/SurveyModal'
import { 
  createSession, 
  updateSessionProgress, 
  completeSession,
  trackRiddleViewed,
  trackHintUsed,
  trackWrongScan,
  trackCorrectScan,
  calculateTimeSpent
} from '../lib/analytics'

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
const RIDDLE_LIMIT = 9  // Keep this as is


export default function Home() {
  // State variables
  const [familyName, setFamilyName] = useState('')
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [riddleStartTime, setRiddleStartTime] = useState(null)
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
  const [showLimitReached, setShowLimitReached] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState('forward')
  const [riddles, setRiddles] = useState([])
  const [completedRiddle, setCompletedRiddle] = useState(null)
  const [shuffledRiddles, setShuffledRiddles] = useState([])
  const [showWrongCodeScreen, setShowWrongCodeScreen] = useState(false)
  const [wrongCodeScanned, setWrongCodeScanned] = useState('')
  const [wrongCodeMessage, setWrongCodeMessage] = useState('')
  const [showSurvey, setShowSurvey] = useState(false)
  const [surveyCompleted, setSurveyCompleted] = useState(false)

  const transitionToScreen = (callback, direction = 'forward') => {
  setIsTransitioning(true)
  setTransitionDirection(direction)
  
  setTimeout(() => {
    callback()
    window.scrollTo(0, 0) 
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
    const savedSessionId = localStorage.getItem('zooSafariSessionId') 


    
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
           

            
            // Calculate total points from database
            const totalPoints = progressData.reduce((sum, record) => sum + record.points_earned, 0)
            setCurrentPoints(totalPoints)
            
            // Reconstruct discovered animals array
            const discoveredAnimals = progressData.map(record => ({
              ...record.riddles,
              discoveredAt: record.completed_at
            }))
            setDiscoveredAnimals(discoveredAnimals)
            

          }
          
          // Restore family session

          setFamilyName(savedFamily)
          
          setGameStarted(true)
          if (savedDifficulty) setSelectedDifficulty(savedDifficulty)

            // ✨ NEW: Restore session for continued analytics tracking
          if (savedSessionId) {
            setCurrentSessionId(savedSessionId)

            // ✨ NEW: Restore riddle position
          if (savedRiddleIndex) {
            setCurrentRiddleIndex(parseInt(savedRiddleIndex))
          }
          }
        } else {
          // Family doesn't exist, clear localStorage
          localStorage.removeItem('zooSafariFamilyId')
          localStorage.removeItem('zooSafariFamilyName')
        }
      } catch {
      
      }
    }

    
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
     
    } else {
      setRiddles(data)
    }
  }
  
  fetchRiddles()
}, [])





// Shuffle riddles when riddles load or difficulty changes
useEffect(() => {
  if (riddles && riddles.length > 0) {
    let filtered
    if (selectedDifficulty === 'all') {
      filtered = riddles
    } else {
      filtered = riddles.filter(riddle => riddle.difficulty === selectedDifficulty)
    }
    
    // Define fixed zone order for linear zoo path
    const zoneOrder = [
      'Africa',
      'Harmony Hill',
      'Tropical Discovery',
      'The Edge',
      'Asia',
      'Down Under',
      'Primate Panorama',
    ]
    
    // Group riddles by zone
    const riddlesByZone = filtered.reduce((acc, riddle) => {
      const zone = riddle.zone || 'unassigned'
      if (!acc[zone]) acc[zone] = []
      acc[zone].push(riddle)
      return acc
    }, {})
    
    // Shuffle riddles within each zone
    Object.keys(riddlesByZone).forEach(zone => {
      riddlesByZone[zone] = shuffleArray(riddlesByZone[zone])
    })
    
    // Use fixed zone order, filtering out zones with no riddles
    const orderedZones = zoneOrder.filter(zone => riddlesByZone[zone])
    
    // Add any unassigned or unlisted zones at the end
    Object.keys(riddlesByZone).forEach(zone => {
      if (!zoneOrder.includes(zone)) {
        orderedZones.push(zone)
      }
    })
    
    // Flatten back into single array, maintaining zone order
    const zonedRiddles = orderedZones.flatMap(zone => riddlesByZone[zone] || [])
    
    setShuffledRiddles(zonedRiddles)
  }
}, [riddles, selectedDifficulty])


// Wrong Code sound effect
useEffect(() => {
  if (wrongCodeMessage) {
    const audio = new Audio('/sounds/wrong-code.mp3')
    audio.play().catch(() => {})
  }
}, [wrongCodeMessage])


// Success screen sound effect
useEffect(() => {
  if (showSuccess) {
    const audio = new Audio('/sounds/celebration.mp3')
    audio.play().catch(() => {})
  }
}, [showSuccess])

// Demo Complete sound effect
useEffect(() => {
  if (showLimitReached) {
    const audio = new Audio('/sounds/demo-complete.mp3')
    audio.volume = 0.4 // Slightly louder for celebration
    audio.play().catch(() => {})
  }
}, [showLimitReached])


// Wrong code screen state
useEffect(() => {
  
}, [showWrongCodeScreen])

// Show survey 30 seconds after reaching Demo Complete screen
useEffect(() => {
  if (showLimitReached && !surveyCompleted) {
    const timer = setTimeout(() => {
      setShowSurvey(true)
    }, 30000) // 30 seconds = 30000 milliseconds
    
    return () => clearTimeout(timer) // Cleanup if component unmounts
  }
}, [showLimitReached, surveyCompleted])



// Add shuffle function
const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

  const filteredRiddles = shuffledRiddles
  // Calculate riddle counts by difficulty
const getRiddleCounts = () => {
  if (!riddles || riddles.length === 0) {
    return { easy: 0, medium: 0, hard: 0, all: 0 }
  }
  
  const counts = riddles.reduce((acc, riddle) => {
    acc[riddle.difficulty] = (acc[riddle.difficulty] || 0) + 1
    return acc
  }, {})
  
  return {
    easy: counts.easy || 0,
    medium: counts.medium || 0,
    hard: counts.hard || 0,
    all: riddles.length
  }
}

const riddleCounts = getRiddleCounts()
  const currentRiddle = filteredRiddles[currentRiddleIndex]

// Track when a new riddle is viewed
useEffect(() => {
  if (currentRiddle && currentSessionId && gameStarted) {
    trackRiddleViewed(currentSessionId, currentRiddle.id)
    setRiddleStartTime(new Date().toISOString())
  }
}, [currentRiddle, currentSessionId, gameStarted])


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
        alert('Error starting adventure. Please try again.')
        return
      }

      const familyId = data.id
      localStorage.setItem('zooSafariFamilyId', familyId)
      localStorage.setItem('zooSafariFamilyName', familyName)
      localStorage.setItem('zooSafariDifficulty', selectedDifficulty)
      
      // ✨ NEW: Create analytics session
      const sessionId = await createSession(familyId, selectedDifficulty)
      if (sessionId) {
        setCurrentSessionId(sessionId)
        localStorage.setItem('zooSafariSessionId', sessionId)
      }
      
      transitionToScreen(() => {
        setGameStarted(true)
      })
      
    } catch {
      alert('Error connecting to database. Please try again.')
    }
  }
}

const nextRiddle = () => {
  transitionToScreen(() => {
    setShowSuccess(false)
    setShowHint(false)
   
    if (currentRiddleIndex < filteredRiddles.length - 1) {
      // More riddles left - go to next one
      const newIndex = currentRiddleIndex + 1
      setCurrentRiddleIndex(newIndex)
      localStorage.setItem('zooSafariCurrentRiddle', newIndex.toString())
    } else {
      // All riddles complete - show Demo Complete screen
      setShowLimitReached(true)
    }
  })
}

const foundAnimal = useCallback(async () => {
  if (!currentRiddle) return;
 
  // Store the completed riddle for the celebration screen
  setCompletedRiddle(currentRiddle)

  // ✨ NEW: Track correct scan with time spent
if (currentSessionId && riddleStartTime) {
  const timeSpent = calculateTimeSpent(riddleStartTime)
  trackCorrectScan(currentSessionId, currentRiddle.id, timeSpent)
}
 
  const familyId = localStorage.getItem('zooSafariFamilyId')
  if (!familyId) {
    return
  }

  try {
    // Check if this riddle was already completed by this family
const { data: existingProgress } = await supabase
  .from('family_progress')
  .select('id')
  .eq('family_id', familyId)
  .eq('riddle_id', currentRiddle.id)
  .maybeSingle()

    if (!existingProgress) {
      // Only insert if not already completed
      const { error: progressError } = await supabase
        .from('family_progress')
        .insert([{
          family_id: familyId,
          riddle_id: currentRiddle.id,
          points_earned: currentRiddle.points
        }])
        .select()

      if (progressError) {
       
        return // Don't continue if database save fails
      } else {
       
      }
    } else {
      
    }

    // Update local state (immediate UI updates only)
    const newPoints = currentPoints + currentRiddle.points
    const newAnimals = [...discoveredAnimals, {
      ...currentRiddle,
      discoveredAt: new Date().toISOString()
    }]

    setCurrentPoints(newPoints)
    setDiscoveredAnimals(newAnimals)

    // ✨ NEW: Update session progress
if (currentSessionId) {
  updateSessionProgress(currentSessionId, newAnimals.length, newPoints)
}

   transitionToScreen(() => {
      if (newAnimals.length >= filteredRiddles.length) {
        // ✨ Mark session as completed
        if (currentSessionId) {
          completeSession(currentSessionId)
        }
        // Always show success/celebration first
        setShowSuccess(true)
      } else {
        setShowSuccess(true)
      }
    })

  } catch {
    
    alert('Unable to save progress. Please check your connection.')
  }
}, [currentPoints, currentRiddle, discoveredAnimals, filteredRiddles.length, transitionToScreen])


// Family database functions

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
     
    } catch {
    
    }
  }
  
  // Only clear session-related localStorage
  localStorage.removeItem('zooSafariFamilyId')
  localStorage.removeItem('zooSafariFamilyName')
  localStorage.removeItem('zooSafariDifficulty')
  localStorage.removeItem('zooSafariSessionId')

  
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
  window.scrollTo(0, 0) 
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

const handleScanSuccess = useCallback((result) => {
  
  if (result && result.length > 0) {

    const audio = new Audio('/sounds/scan.mp3')
    audio.play().catch(() => {})

    const decodedText = result[0].rawValue
    
    if (currentRiddle && decodedText === currentRiddle.qr_code) {
      setShowScanner(false)
      foundAnimal()
    } else if (currentRiddle) {
      setShowScanner(false)
      setWrongCodeMessage(`Oops! You scanned "${decodedText}" but you need to find a different exhibit.`)
      
      // ✨ NEW: Track wrong scan
      if (currentSessionId) {
        trackWrongScan(currentSessionId, currentRiddle.id)
      }
      
      window.scrollTo(0, 0)
    }
  }
}, [currentRiddle, foundAnimal, currentSessionId])


const handleScanError = useCallback((error) => {
  if (error?.message?.includes('Permission denied')) {
    setScanError('Camera permission denied. Please allow camera access and try again.')
  }
}, [])



// Wrong code screen - replaces entire interface
if (wrongCodeMessage) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-400 via-pink-500 to-orange-600 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-16 left-8 text-4xl animate-pulse">⚠️</div>
        <div className="absolute top-32 right-12 text-3xl animate-bounce">❌</div>
        <div className="absolute bottom-40 left-12 text-5xl animate-pulse animation-delay-1000">🔍</div>
        <div className="absolute bottom-24 right-8 text-4xl animate-bounce animation-delay-500">❓</div>
        <div className="absolute top-1/2 left-1/4 text-3xl animate-pulse animation-delay-2000">⭐</div>
      </div>

      <div className="max-w-md mx-auto pt-16 relative z-10 flex items-center justify-center min-h-screen">
        <div className="relative w-full">
          {/* Multi-layered Shadow Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-red-700 rounded-3xl transform rotate-2 opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-red-600 rounded-3xl transform -rotate-1 opacity-25"></div>
          
          {/* Main Card */}
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-3xl p-6 sm:p-8 lg:p-10 border-2 border-white/60">
            
            {/* Decorative Corner Element */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-red-500 to-pink-600 rounded-full p-4 shadow-xl">
              <span className="text-3xl">❌</span>
            </div>

            <div className="text-center pt-8">
              {/* Large Icon */}
              <div className="mb-6">
                <div className="text-8xl mb-4 animate-pulse">❌</div>
                <div className="flex justify-center space-x-2 text-3xl">
                  <span className="animate-pulse">⚠️</span>
                  <span className="animate-pulse animation-delay-300">❓</span>
                  <span className="animate-pulse animation-delay-600">🔍</span>
                </div>
              </div>
              
              {/* Title */}
              <div className="bg-gradient-to-br from-red-100/90 via-pink-100/90 to-orange-100/90 rounded-3xl p-6 mb-6 border-2 border-red-200 shadow-inner">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600 mb-4">
                  Wrong Animal!
                </h1>
                <p className="text-lg font-semibold text-red-700 leading-relaxed">
                  {wrongCodeMessage}
                </p>
              </div>

              {/* Helpful Message */}
              <div className="bg-gradient-to-br from-blue-100/90 via-indigo-100/90 to-purple-100/90 rounded-2xl p-6 mb-8 border-2 border-blue-200 shadow-inner">
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <span className="text-2xl">💡</span>
                  <h3 className="text-lg sm:text-xl font-black text-blue-800">Keep Exploring!</h3>
                </div>
                <p className="text-blue-700 font-semibold text-sm">
                  Look around for the correct animal exhibit and try scanning again.
                </p>
              </div>

              {/* Enhanced Button */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl transform scale-105 opacity-30"></div>
                <button
                  onClick={() => setWrongCodeMessage('')}
                  className="relative w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-black py-3 sm:py-5 px-4 sm:px-8 rounded-2xl text-xl shadow-2xl transform transition-all duration-300 hover:scale-102 hover:shadow-3xl border-2 border-white/40"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <div className="bg-white/20 rounded-full p-2">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <span>Try Again!</span>
                    <div className="bg-white/20 rounded-full p-2">
                      <span className="text-2xl">🔍</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
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
          <div className="relative bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 border-2 border-white/60 hover:shadow-3xl transition-all duration-500 hover:transform hover:scale-102">
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
                  placeholder="Enter team name"
                  className="relative w-full p-3 sm:p-5 border-3 border-gray-200 rounded-2xl text-xl font-semibold placeholder-gray-400 focus:border-emerald-500 focus:ring-6 focus:ring-emerald-200 transition-all duration-400 bg-gradient-to-br from-gray-50 to-white shadow-inner hover:shadow-lg"
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
          <div className="relative bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 border-2 border-white/60 hover:shadow-3xl transition-all duration-500">
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
                        {riddleCounts.all} riddles • Perfect for mixed ages • Maximum fun!
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
                        {riddleCounts.easy} riddles • Ages 4-8 • Simple and fun words
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
                        {riddleCounts.medium} riddles • Ages 8-12 • Science and discovery
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
                        {riddleCounts.hard} riddles • Ages 12+ • Conservation heroes
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
          className="w-full bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-500 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-500 text-white font-bold py-3 sm:py-5 px-4 sm:px-8rounded-2xl text-xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl disabled:hover:scale-100 disabled:hover:shadow-2xl border-2 border-white/30"
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
  {completedRiddle?.icon || '🐾'}
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
                You found the {completedRiddle.animal}!
              </h2>
              
              <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-white rounded-2xl py-4 px-8 mb-6 shadow-xl animate-pulse">
                <div className="flex items-center justify-center space-x-3">
                  <span className="text-3xl">🏆</span>
                  <div>
                    <p className="text-2xl font-black">
                      +{completedRiddle.points} POINTS!
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
                    {completedRiddle.fact}
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


            <button
              onClick={nextRiddle}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 hover:from-blue-600 hover:via-purple-700 hover:to-pink-700 text-white font-black py-3 sm:py-5 px-4 sm:px-8 rounded-2xl text-2xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-2 border-white/40"
            >
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">🚀</span>
                <span>Next Adventure!</span>
                <span className="text-2xl">🎯</span>
              </div>
            </button>



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
                        {animal.icon || '🐾'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-gray-600 text-sm font-semibold mb-4 animate-pulse">
  📊 Quick survey coming in 30 seconds...
</div>

          <div className="space-y-4">
            <a 
              href="https://zoosafari.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-yellow-500 via-amber-600 to-orange-600 hover:from-pink-700 hover:via-rose-700 hover:to-red-700 text-white font-black py-3 sm:py-5 px-4 sm:px-8 rounded-2xl text-xl text-center shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-white/40"
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
                {/* Survey overlays after 30 seconds on Demo Complete screen */}
      {showSurvey && !surveyCompleted && (
        <SurveyModal
          sessionId={currentSessionId}
          familyName={familyName}
          totalPoints={currentPoints}
          animalsDiscovered={discoveredAnimals.length}
          onComplete={() => {
            setSurveyCompleted(true)
            setShowSurvey(false)
          }}
          onSkip={() => {
            setSurveyCompleted(true)
            setShowSurvey(false)
          }}
        />
      )}
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
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10p-10 border-10 border-white/60 hover:shadow-3xl transition-all duration-500">
            
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
                <div className="relative bg-gradient-to-br from-yellow-400 to-red-500 rounded-3xl p-4 sm:p-6 shadow-xl border-2 border-white/50">
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
          <div className="relative bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 border-2 border-white/70 hover:shadow-4xl transition-all duration-500">
            
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

              {/* Add zone indicator in riddle header */}
<div className="text-center mb-4">
  <div className="inline-block bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">
    📍 {currentRiddle.zone || 'Zoo Exploration'}
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
                  onClick={() => {
                  setShowHint(true)
                  if (currentSessionId && currentRiddle) {
                   trackHintUsed(currentSessionId, currentRiddle.id)
                    }
                   }}
  className="relative w-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 hover:from-yellow-500 hover:via-orange-500 hover:to-red-500 text-white font-bold py-3 sm:py-5 px-4 sm:px-8 rounded-2xl shadow-xl transform transition-all duration-300 hover:scale-102 hover:shadow-2xl border-2 border-white/40"
>
                  <div className="flex items-center justify-center space-x-4">
                    <div className="bg-white/20 rounded-full p-2">
                      <span className="text-2xl">💡</span>
                    </div>
                    <span className="text-lg sm:text-xl font-black">Need a Hint?</span>
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
<div className="relative bg-gradient-to-br from-gray-100 to-white rounded-2xl p-4 border-2 border-gray-200 shadow-inner">
  <Scanner
  onScan={handleScanSuccess}
  onError={handleScanError}
  sound={false}
  allowMultiple={false}
  scanDelay={500}
  constraints={{
    video: { 
      facingMode: 'environment',
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  }}
  styles={{
    container: { width: '100%', minHeight: '15rem' },
    video: { width: '100%', height: '100%', objectFit: 'cover' }
  }}
/>
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
          <div className="relative bg-white/20 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 border-2 border-white/60 hover:shadow-3xl transition-all duration-500">
            
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
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                  {discoveredAnimals.map((animal, index) => (
                    <div key={index} className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 to-orange-300 rounded-2xl transform rotate-3 opacity-0 group-hover:opacity-40 transition-all duration-300"></div>
                      <div className="relative bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 rounded-2xl p-4 shadow-xl border-2 border-yellow-200 transform hover:scale-110 hover:rotate-2 transition-all duration-300 cursor-pointer">
                        <div className="text-center">
                          <div className="text-4xl mb-2">
  {animal.icon || '🐾'}
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