'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

// Expanded riddles with QR codes for comprehensive testing
const sampleRiddles = [
  // EASY RIDDLES (Ages 4-8)
  {
    id: 1,
    animal: 'Lion',
    riddle: "I&apos;m big and yellow with a fluffy mane.\nI roar really loud - can you hear my refrain?\nI&apos;m called the king, but I live on the ground.\nCan you find where my roar can be found?",
    hint: "Look for the biggest, loudest cat!",
    difficulty: 'easy',
    points: 50,
    fact: "Lions live in groups called prides, like big families!",
    qrCode: "LION_KING_SAFARI"
  },
  {
    id: 2,
    animal: 'Elephant',
    riddle: "I&apos;m really big and colored gray.\nMy nose is long - I use it all day!\nI flap my ears to stay nice and cool.\nFinding me would be really cool!",
    hint: "Look for the biggest animal with a long nose!",
    difficulty: 'easy',
    points: 50,
    fact: "Elephants use their trunks like we use our hands!",
    qrCode: "ELEPHANT_TRUNK_SAFARI"
  },
  {
    id: 3,
    animal: 'Monkey',
    riddle: "I love bananas, they&apos;re my favorite treat!\nI swing on branches with hands and feet.\nI&apos;m playful and silly, I love to have fun.\nCan you find me before the day is done?",
    hint: "Look for the animal that swings and plays!",
    difficulty: 'easy',
    points: 50,
    fact: "Monkeys can hang upside down by their tails!",
    qrCode: "MONKEY_SWING_SAFARI"
  },
  // MEDIUM RIDDLES (Ages 8-12)
  {
    id: 4,
    animal: 'Giraffe',
    riddle: "I&apos;m the tallest animal, reaching up so high,\nMy long neck helps me eat leaves in the sky.\nMy spots are unique, like a fingerprint true,\nI&apos;m gentle and peaceful - I&apos;d love to meet you!",
    hint: "Look up! I&apos;m the tallest animal in the world!",
    difficulty: 'medium',
    points: 100,
    fact: "A giraffe&apos;s tongue is 18-20 inches long and dark purple!",
    qrCode: "GIRAFFE_TALL_SAFARI"
  },
  {
    id: 5,
    animal: 'Penguin',
    riddle: "I wear a tuxedo but can&apos;t fly through air,\nI waddle on land and swim without care.\nIn icy cold water, I&apos;m graceful and quick,\nFinding my colony would be quite a trick!",
    hint: "Look for the bird that swims better than it flies!",
    difficulty: 'medium',
    points: 100,
    fact: "Penguins can swim up to 22 mph and dive 500 feet deep!",
    qrCode: "PENGUIN_SWIM_SAFARI"
  },
  {
    id: 6,
    animal: 'Tiger',
    riddle: "Orange and black stripes make me unique,\nI&apos;m a powerful hunter, strong and sleek.\nUnlike other cats, I love to swim,\nFinding me might test you to the rim!",
    hint: "Look for the striped cat that loves water!",
    difficulty: 'medium',
    points: 100,
    fact: "Tigers are the only big cats that truly love swimming!",
    qrCode: "TIGER_STRIPE_SAFARI"
  },
  // HARD RIDDLES (Ages 12+)
  {
    id: 7,
    animal: 'Rhino',
    riddle: "My horn is not bone, but compressed hair so tight,\nI&apos;m a herbivore giant with poor eyesight.\nThough I look prehistoric, I&apos;m gentle at heart,\nConservation efforts give me a fresh start.",
    hint: "Look for the armored giant with a horn!",
    difficulty: 'hard',
    points: 150,
    fact: "Rhino horns are made of keratin, the same stuff as your fingernails!",
    qrCode: "RHINO_HORN_SAFARI"
  },
  {
    id: 8,
    animal: 'Orangutan',
    riddle: "I share 97% of DNA with you,\nMy intelligence and tool use are certainly true.\nIn Borneo&apos;s canopy, I make my bed,\nDeforestation fills my species with dread.",
    hint: "Look for our closest relative in the trees!",
    difficulty: 'hard',
    points: 150,
    fact: "Orangutans are so smart they&apos;ve been observed using tools and learning sign language!",
    qrCode: "ORANGUTAN_SMART_SAFARI"
  },
  {
    id: 9,
    animal: 'Snow Leopard',
    riddle: "In mountains so high where the air is thin,\nMy spotted coat helps my survival begin.\nMy tail&apos;s like a scarf, thick and so long,\nClimate change makes my future less strong.",
    hint: "Look for the ghost of the mountains!",
    difficulty: 'hard',
    points: 150,
    fact: "Snow leopards can&apos;t roar - they chuff, growl, and purr instead!",
    qrCode: "SNOW_LEOPARD_GHOST_SAFARI"
  }
]

const RIDDLE_LIMIT = 6

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

  // QR Scanner ref
  const scannerRef = useRef(null)
  const html5QrcodeScannerRef = useRef(null)

  // Load saved data when app starts
  useEffect(() => {
    const savedFamily = localStorage.getItem('zooSafariFamilyName')
    const savedPoints = localStorage.getItem('zooSafariPoints')
    const savedAnimals = localStorage.getItem('zooSafariAnimals')
    
    if (savedFamily) {
      setFamilyName(savedFamily)
      setGameStarted(true)
    }
    if (savedPoints) {
      setCurrentPoints(parseInt(savedPoints))
    }
    if (savedAnimals) {
      setDiscoveredAnimals(JSON.parse(savedAnimals))
    }
  }, [])

  // Filter riddles by difficulty
  const getFilteredRiddles = () => {
    if (selectedDifficulty === 'all') return sampleRiddles
    return sampleRiddles.filter(riddle => riddle.difficulty === selectedDifficulty)
  }

  const filteredRiddles = getFilteredRiddles()
  const currentRiddle = filteredRiddles[currentRiddleIndex]
  const isLastRiddle = currentRiddleIndex >= filteredRiddles.length - 1

  // Game functions
  const startAdventure = () => {
    if (familyName.trim()) {
      setGameStarted(true)
      localStorage.setItem('zooSafariFamilyName', familyName)
    }
  }

  const foundAnimal = useCallback(() => {
    const newPoints = currentPoints + currentRiddle.points
    const newAnimals = [...discoveredAnimals, {
      ...currentRiddle,
      discoveredAt: new Date().toISOString()
    }]

    setCurrentPoints(newPoints)
    setDiscoveredAnimals(newAnimals)

    // Check if limit reached
    if (newAnimals.length >= RIDDLE_LIMIT) {
      setShowLimitReached(true)
    } else {
      setShowSuccess(true)
    }

    // Save to browser storage
    localStorage.setItem('zooSafariPoints', newPoints.toString())
    localStorage.setItem('zooSafariAnimals', JSON.stringify(newAnimals))
  }, [currentPoints, currentRiddle, discoveredAnimals])

  const nextRiddle = () => {
    setShowSuccess(false)
    setShowHint(false)
    if (currentRiddleIndex < filteredRiddles.length - 1) {
      setCurrentRiddleIndex(currentRiddleIndex + 1)
    }
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
    if (decodedText === currentRiddle.qrCode) {
      // Correct answer! 
      setShowScanner(false)
      foundAnimal()
    } else {
      // Wrong code scanned
      setScanError(`That&apos;s not the right animal! You scanned: ${decodedText}`)
      // Auto-clear error after 3 seconds
      setTimeout(() => {
        setScanError('')
      }, 3000)
    }
  }, [currentRiddle.qrCode, foundAnimal])

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

  // Welcome/Setup Screen
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-green-50 p-4">
        <div className="max-w-md mx-auto pt-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-green-800 mb-4">
              🦁 Zoo Safari
            </h1>
            <p className="text-lg text-gray-700 mb-8">
              Ready for an amazing animal adventure?
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              What&apos;s your family name?
            </h2>
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="Enter family name..."
              className="w-full p-3 border border-gray-300 rounded-lg text-lg mb-4"
            />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Choose Your Adventure Level:
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => setSelectedDifficulty('all')}
                className={`w-full p-3 rounded-lg text-left ${selectedDifficulty === 'all' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50 border border-gray-300'}`}
              >
                <div className="font-semibold">🌟 All Levels (9 riddles)</div>
                <div className="text-sm text-gray-600">Perfect for mixed ages</div>
              </button>
              
              <button
                onClick={() => setSelectedDifficulty('easy')}
                className={`w-full p-3 rounded-lg text-left ${selectedDifficulty === 'easy' ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-50 border border-gray-300'}`}
              >
                <div className="font-semibold">🟢 Easy (3 riddles)</div>
                <div className="text-sm text-gray-600">Ages 4-8 • Simple words</div>
              </button>
              
              <button
                onClick={() => setSelectedDifficulty('medium')}
                className={`w-full p-3 rounded-lg text-left ${selectedDifficulty === 'medium' ? 'bg-yellow-100 border-2 border-yellow-500' : 'bg-gray-50 border border-gray-300'}`}
              >
                <div className="font-semibold">🟡 Medium (3 riddles)</div>
                <div className="text-sm text-gray-600">Ages 8-12 • Some science</div>
              </button>
              
              <button
                onClick={() => setSelectedDifficulty('hard')}
                className={`w-full p-3 rounded-lg text-left ${selectedDifficulty === 'hard' ? 'bg-red-100 border-2 border-red-500' : 'bg-gray-50 border border-gray-300'}`}
              >
                <div className="font-semibold">🔴 Hard (3 riddles)</div>
                <div className="text-sm text-gray-600">Ages 12+ • Conservation focus</div>
              </button>
            </div>
          </div>

          <button
            onClick={startAdventure}
            disabled={!familyName.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg text-lg"
          >
            🚀 Start Adventure!
          </button>
        </div>
      </div>
    )
  }

  // Limit reached screen
  if (showLimitReached) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-blue-100 p-4">
        <div className="max-w-md mx-auto pt-10">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="text-3xl font-bold text-purple-800 mb-2">
              Demo Complete!
            </h1>
            <p className="text-lg text-gray-700">
              You&apos;ve completed the demo! Sign up to be notified when the full Zoo Safari launches with 50+ riddles
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 mb-2">
                Final Score: {currentPoints} Points!
              </p>
              <p className="text-gray-600 mb-4">
                🏆 Animals Discovered: {discoveredAnimals.length}
              </p>
              
              <div className="mt-4">
                <h3 className="font-semibold text-gray-800 mb-2">Your Digital Zoo</h3>
                <div className="flex flex-wrap justify-center">
                  {discoveredAnimals.map((animal, index) => (
                    <span key={index} className="inline-block mr-2 mb-2 text-3xl">
                      {animalEmojis[animal.animal]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <a 
              href="https://your-signup-page.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl text-lg text-center shadow-lg transform hover:scale-105 transition-all"
            >
              🚀 Get Notified When Full Game Launches!
            </a>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-xl text-lg"
            >
              🔄 Try Demo Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Success celebration screen
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-green-100 p-4">
        <div className="max-w-md mx-auto pt-10">
          <div className="text-center mb-8">
            <div className="animate-bounce text-8xl mb-4">
              {animalEmojis[currentRiddle.animal]}
            </div>
            <h1 className="text-3xl font-bold text-green-800 mb-2 animate-pulse">
              🎉 AMAZING DISCOVERY! 🎉
            </h1>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              You found the {currentRiddle.animal}!
            </h2>
            
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full py-3 px-6 mb-4 animate-pulse">
              <p className="text-xl font-bold">
                +{currentRiddle.points} POINTS! 🌟
              </p>
            </div>
          </div>

          <div className="bg-white border-4 border-blue-200 rounded-xl p-6 mb-6 shadow-lg">
            <h3 className="text-lg font-bold text-blue-800 mb-2">
              🤔 Did You Know?
            </h3>
            <p className="text-blue-700 leading-relaxed">
              {currentRiddle.fact}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 mb-2">
                {currentPoints} Total Points!
              </p>
              <p className="text-gray-600 mb-4">
                🏆 Animals Discovered: {discoveredAnimals.length}
              </p>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-1000"
                  style={{width: `${(discoveredAnimals.length / filteredRiddles.length) * 100}%`}}
                ></div>
              </div>
              <p className="text-sm text-gray-500">
                {discoveredAnimals.length} of {filteredRiddles.length} animals found
              </p>
            </div>
          </div>

          {!isLastRiddle && (
            <button
              onClick={nextRiddle}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl text-xl shadow-lg transform hover:scale-105 transition-all"
            >
              🚀 Next Adventure!
            </button>
          )}
          
          {isLastRiddle && (
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-6 mb-4">
                <h3 className="text-2xl font-bold mb-2">🏆 SAFARI COMPLETE!</h3>
                <p className="text-lg">You&apos;re an amazing animal explorer!</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-all"
              >
                🎯 Start New Adventure
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Main game interface
  return (
    <div className="min-h-screen bg-green-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-green-800">
            {familyName} Family
          </h1>
          <div className="text-right">
            <p className="text-sm text-gray-600">Points</p>
            <p className="text-lg font-bold text-green-600">{currentPoints}</p>
          </div>
        </div>

        {/* Current Riddle */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              🔍 Riddle #{currentRiddleIndex + 1} ({currentRiddle.difficulty})
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-gray-800 whitespace-pre-line leading-relaxed">
                {currentRiddle.riddle}
              </p>
            </div>
          </div>

          {/* Hint Button */}
          {!showHint && (
            <button
              onClick={() => setShowHint(true)}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg mb-4"
            >
              💡 Need a Hint?
            </button>
          )}

          {/* Hint Display */}
          {showHint && (
            <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Hint:</strong> {currentRiddle.hint}
              </p>
            </div>
          )}

          {/* QR Scanner Button */}
          <button
            onClick={openScanner}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg mb-2"
          >
            📱 Scan QR Code
          </button>

          {/* Manual Entry for Testing */}
          <button
            onClick={foundAnimal}
            className="w-full bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg text-sm"
          >
            🔧 Manual Complete (Testing Only)
          </button>
        </div>

        {/* QR Scanner Modal */}
        {showScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  📱 Find & Scan QR Code
                </h3>
                <button
                  onClick={closeScanner}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Current riddle reminder */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
               <strong>Did you solve the riddle?</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Find the correct exhibit and scan its QR code!
                </p>
              </div>

              {/* Scanner Component */}
              <div className="mb-4">
                <div 
                  id="qr-reader" 
                  ref={scannerRef}
                  className="w-full"
                  style={{ minHeight: '250px' }}
                ></div>
              </div>

              {/* Success feedback */}
              {scanResult && !scanError && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded mb-4 text-sm">
                  ✅ Code scanned: {scanResult}
                </div>
              )}

              {/* Error feedback */}
              {scanError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                  ⚠ {scanError}
                </div>
              )}

              {/* Instructions */}
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  🔍 Find the exhibit for your riddle answer and scan its QR code
                </p>
                <p className="text-xs text-gray-500">
                  Make sure the code is well-lit and centered
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={closeScanner}
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg"
                >
                  📖 Read Riddle Again
                </button>
                
                {/* Emergency manual entry */}
                <details className="text-center">
                  <summary className="text-xs text-gray-500 cursor-pointer">Having trouble scanning?</summary>
                  <button
                    onClick={() => { closeScanner(); foundAnimal(); }}
                    className="mt-2 text-xs bg-yellow-400 hover:bg-yellow-500 text-yellow-800 px-3 py-1 rounded"
                  >
                    Skip Scanning (Testing)
                  </button>
                </details>
              </div>
            </div>
          </div>
        )}

        {/* Digital Zoo Collection */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Your Digital Zoo</h3>
          <p className="text-sm text-gray-600">
            Discovered: {discoveredAnimals.length} animals
          </p>
          <div className="mt-2">
            {discoveredAnimals.map((animal, index) => (
              <span key={index} className="inline-block mr-2 text-2xl">
                {animalEmojis[animal.animal]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}