'use client'
import { useState, useEffect, useRef } from 'react'


/**
 * Post-Adventure Survey Modal
 * Captures valuable user feedback after completing the Zoo Safari demo
 * Non-disruptive design that maintains the celebratory mood
 */
export default function SurveyModal({ 
  sessionId, 
  familyName, 
  totalPoints, 
  animalsDiscovered,
  onComplete, 
  onSkip 
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  
  // Survey responses
  const [npsScore, setNpsScore] = useState(null)
  const [enjoymentLevel, setEnjoymentLevel] = useState(null)
  const [learningValue, setLearningValue] = useState(null)
  const [difficulty, setDifficulty] = useState(null)
  const [favoriteAspect, setFavoriteAspect] = useState([])
  const [improvements, setImprovements] = useState('')
  const [wouldRecommend, setWouldRecommend] = useState(null)
  const [ageGroup, setAgeGroup] = useState(null)

  const modalRef = useRef(null)
  
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.scrollTop = 0
    }
  }, [])

  const toggleFavoriteAspect = (aspect) => {
    setFavoriteAspect(prev => 
      prev.includes(aspect) 
        ? prev.filter(a => a !== aspect)
        : [...prev, aspect]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          nps_score: npsScore,
          enjoyment_level: enjoymentLevel,
          learning_value: learningValue,
          difficulty_rating: difficulty,
          favorite_aspects: favoriteAspect,
          improvements: improvements.trim() || null,
          would_recommend: wouldRecommend,
          age_group: ageGroup,
          completed_at: new Date().toISOString()
        })
      })

      if (response.ok) {
        setShowThankYou(true)
        setTimeout(() => {
          onComplete()
        }, 2000)
      } else {
        throw new Error('Survey submission failed')
      }
    } catch (error) {
      console.error('Error submitting survey:', error)
      alert('Oops! Something went wrong. Your feedback is important - please try again!')
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    if (confirm('Are you sure you want to skip the survey? Your feedback helps us make Zoo Safari even better!')) {
      onSkip()
    }
  }

  // Thank you screen after submission
  if (showThankYou) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-3xl p-8 max-w-md w-full shadow-3xl transform animate-scaleIn">
          <div className="text-center">
            <div className="text-7xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-3xl font-black text-white mb-3">
              Thank You!
            </h2>
            <p className="text-white text-lg font-semibold">
              Your feedback helps us create better zoo adventures for families like yours! 🦁
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto animate-fadeIn"
    >
      <div className="min-h-screen flex items-start justify-center p-4 py-8">
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-3xl max-w-2xl w-full">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-t-3xl p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-2 left-4 text-3xl animate-pulse">⭐</div>
              <div className="absolute bottom-2 right-6 text-3xl animate-pulse animation-delay-500">✨</div>
            </div>
            <div className="relative z-10 text-center">
              <div className="text-5xl mb-3 animate-bounce">🎯</div>
              <h2 className="text-3xl font-black mb-2">
                Help Us Improve!
              </h2>
              <p className="text-white/90 font-semibold">
                Quick 2-minute survey to make Zoo Safari even better
              </p>
            </div>
          </div>

          {/* Survey Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* NPS Score - How likely to recommend */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-200">
              <label className="block text-lg font-bold text-gray-800 mb-3">
                How likely are you to recommend Zoo Safari to other families? *
              </label>
              <div className="flex flex-wrap gap-2 justify-center">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setNpsScore(score)}
                    className={`w-12 h-12 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-110 ${
                      npsScore === score
                        ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-xl scale-110'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-600 font-semibold mt-2 px-2">
                <span>Not likely</span>
                <span>Very likely</span>
              </div>
            </div>

            {/* Enjoyment Level */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-5 border-2 border-yellow-200">
              <label className="block text-lg font-bold text-gray-800 mb-3">
                How much did your family enjoy the experience? *
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { value: 1, emoji: '😢', label: 'Not fun' },
                  { value: 2, emoji: '😕', label: 'Okay' },
                  { value: 3, emoji: '😊', label: 'Good' },
                  { value: 4, emoji: '😄', label: 'Great' },
                  { value: 5, emoji: '🤩', label: 'Amazing!' }
                ].map(({ value, emoji, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setEnjoymentLevel(value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                      enjoymentLevel === value
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-xl scale-105'
                        : 'bg-white border-2 border-gray-300 hover:border-yellow-400'
                    }`}
                  >
                    <span className="text-3xl mb-1">{emoji}</span>
                    <span className={`text-xs font-bold ${
                      enjoymentLevel === value ? 'text-white' : 'text-gray-700'
                    }`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Learning Value */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-200">
              <label className="block text-lg font-bold text-gray-800 mb-3">
                Did you learn something new about animals? *
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { value: 1, emoji: '📚', label: 'Nothing' },
                  { value: 2, emoji: '📖', label: 'A little' },
                  { value: 3, emoji: '🧠', label: 'Some' },
                  { value: 4, emoji: '🎓', label: 'A lot' },
                  { value: 5, emoji: '🤓', label: 'Tons!' }
                ].map(({ value, emoji, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLearningValue(value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                      learningValue === value
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-xl scale-105'
                        : 'bg-white border-2 border-gray-300 hover:border-green-400'
                    }`}
                  >
                    <span className="text-3xl mb-1">{emoji}</span>
                    <span className={`text-xs font-bold ${
                      learningValue === value ? 'text-white' : 'text-gray-700'
                    }`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Rating */}
            <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-2xl p-5 border-2 border-pink-200">
              <label className="block text-lg font-bold text-gray-800 mb-3">
                How was the difficulty level of the riddles? *
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { value: 1, label: 'Too easy', emoji: '😴' },
                  { value: 2, label: 'Bit easy', emoji: '😊' },
                  { value: 3, label: 'Perfect!', emoji: '👌' },
                  { value: 4, label: 'Bit hard', emoji: '🤔' },
                  { value: 5, label: 'Too hard', emoji: '😰' }
                ].map(({ value, label, emoji }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDifficulty(value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                      difficulty === value
                        ? 'bg-gradient-to-br from-pink-400 to-red-500 shadow-xl scale-105'
                        : 'bg-white border-2 border-gray-300 hover:border-pink-400'
                    }`}
                  >
                    <span className="text-3xl mb-1">{emoji}</span>
                    <span className={`text-xs font-bold ${
                      difficulty === value ? 'text-white' : 'text-gray-700'
                    }`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Favorite Aspects - Multi-select */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 border-2 border-purple-200">
              <label className="block text-lg font-bold text-gray-800 mb-3">
                What did you like most? (Select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'riddles', label: 'Animal Riddles', emoji: '🧩' },
                  { value: 'learning', label: 'Learning Facts', emoji: '📚' },
                  { value: 'scanning', label: 'QR Scanning', emoji: '📱' },
                  { value: 'collection', label: 'Digital Collection', emoji: '🦁' },
                  { value: 'points', label: 'Points & Badges', emoji: '🏆' },
                  { value: 'exploration', label: 'Zoo Exploration', emoji: '🗺️' }
                ].map(({ value, label, emoji }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleFavoriteAspect(value)}
                    className={`flex items-center space-x-2 p-3 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                      favoriteAspect.includes(value)
                        ? 'bg-gradient-to-br from-purple-400 to-indigo-500 text-white shadow-xl scale-105'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400'
                    }`}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span className="font-bold text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Age Group */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 border-2 border-amber-200">
              <label className="block text-lg font-bold text-gray-800 mb-3">
                Age of children in your family? (Optional)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: '0-4', label: '0-4' },
                  { value: '5-8', label: '5-8' },
                  { value: '9-12', label: '9-12' },
                  { value: '13+', label: '13+' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAgeGroup(value)}
                    className={`p-3 rounded-xl font-bold transition-all duration-200 transform hover:scale-105 ${
                      ageGroup === value
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl scale-105'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-amber-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Open-ended Improvements */}
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-5 border-2 border-gray-200">
              <label className="block text-lg font-bold text-gray-800 mb-3">
                How can we make Zoo Safari better? (Optional)
              </label>
              <textarea
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                placeholder="Share any suggestions or ideas..."
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 min-h-[100px] font-medium text-gray-700"
                maxLength={500}
              />
              <div className="text-xs text-gray-500 text-right mt-1 font-semibold">
                {improvements.length}/500 characters
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-800 font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Skip Survey
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !npsScore || !enjoymentLevel || !learningValue || !difficulty}
                className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-black py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-xl disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>Submit Feedback</span>
                    <span className="text-xl">🚀</span>
                  </div>
                )}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 text-center font-semibold">
              * Required questions
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}