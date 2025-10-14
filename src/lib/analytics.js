import { supabase } from './supabase'

// ==========================================
// SESSION MANAGEMENT
// ==========================================

/**
 * Create a new session when family starts adventure
 * @param {string} familyId - UUID of the family
 * @param {string} difficulty - Selected difficulty level
 * @returns {Promise<string|null>} Session ID or null if failed
 */
export async function createSession(familyId, difficulty) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert([{
        family_id: familyId,
        difficulty: difficulty,
        started_at: new Date().toISOString(),
        completion_status: 'active'
      }])
      .select()
      .single()

    if (error) {
      console.error('Failed to create session:', error)
      return null
    }

    return data.id
  } catch {
    console.error('Error creating session:', err)
    return null
  }
}

/**
 * Update session when family completes a riddle
 * @param {string} sessionId - UUID of the session
 * @param {number} riddlesCompleted - Total riddles completed
 * @param {number} totalPoints - Total points earned
 */
export async function updateSessionProgress(sessionId, riddlesCompleted, totalPoints) {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({
        riddles_completed: riddlesCompleted,
        total_points: totalPoints
      })
      .eq('id', sessionId)

    if (error) {
      console.error('Failed to update session progress:', error)
    }
  } catch {
    console.error('Error updating session:', err)
  }
}

/**
 * Mark session as completed
 * @param {string} sessionId - UUID of the session
 */
export async function completeSession(sessionId) {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({
        ended_at: new Date().toISOString(),
        completion_status: 'completed'
      })
      .eq('id', sessionId)

    if (error) {
      console.error('Failed to complete session:', error)
    }
  } catch {
    console.error('Error completing session:', err)
  }
}

/**
 * Mark session as abandoned (when family leaves without finishing)
 * @param {string} sessionId - UUID of the session
 */
export async function abandonSession(sessionId) {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({
        ended_at: new Date().toISOString(),
        completion_status: 'abandoned'
      })
      .eq('id', sessionId)

    if (error) {
      console.error('Failed to abandon session:', error)
    }
  } catch {
    console.error('Error abandoning session:', err)
  }
}

// ==========================================
// RIDDLE EVENT TRACKING
// ==========================================

/**
 * Track when a riddle is viewed
 * @param {string} sessionId - UUID of the session
 * @param {number} riddleId - ID of the riddle
 */
export async function trackRiddleViewed(sessionId, riddleId) {
  try {
    const { error } = await supabase
      .from('riddle_events')
      .insert([{
        session_id: sessionId,
        riddle_id: riddleId,
        event_type: 'viewed',
        event_timestamp: new Date().toISOString()
      }])

    if (error) {
      console.error('Failed to track riddle viewed:', error)
    }
  } catch {
    console.error('Error tracking riddle viewed:', err)
  }
}

/**
 * Track when a hint is used
 * @param {string} sessionId - UUID of the session
 * @param {number} riddleId - ID of the riddle
 */
export async function trackHintUsed(sessionId, riddleId) {
  try {
    const { error } = await supabase
      .from('riddle_events')
      .insert([{
        session_id: sessionId,
        riddle_id: riddleId,
        event_type: 'hint_used',
        event_timestamp: new Date().toISOString()
      }])

    if (error) {
      console.error('Failed to track hint used:', error)
    }
  } catch {
    console.error('Error tracking hint used:', err)
  }
}

/**
 * Track when wrong QR code is scanned
 * @param {string} sessionId - UUID of the session
 * @param {number} riddleId - ID of the riddle
 */
export async function trackWrongScan(sessionId, riddleId) {
  try {
    const { error } = await supabase
      .from('riddle_events')
      .insert([{
        session_id: sessionId,
        riddle_id: riddleId,
        event_type: 'wrong_scan',
        event_timestamp: new Date().toISOString()
      }])

    if (error) {
      console.error('Failed to track wrong scan:', error)
    }
  } catch {
    console.error('Error tracking wrong scan:', err)
  }
}

/**
 * Track when correct QR code is scanned
 * @param {string} sessionId - UUID of the session
 * @param {number} riddleId - ID of the riddle
 * @param {number} timeSpentSeconds - Time spent on this riddle
 */
export async function trackCorrectScan(sessionId, riddleId, timeSpentSeconds) {
  try {
    const { error } = await supabase
      .from('riddle_events')
      .insert([{
        session_id: sessionId,
        riddle_id: riddleId,
        event_type: 'correct_scan',
        event_timestamp: new Date().toISOString(),
        time_spent_seconds: timeSpentSeconds
      }])

    if (error) {
      console.error('Failed to track correct scan:', error)
    }
  } catch {
    console.error('Error tracking correct scan:', err)
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Calculate time spent on current riddle
 * @param {string} riddleStartTime - ISO timestamp when riddle was first viewed
 * @returns {number} Seconds spent on riddle
 */
export function calculateTimeSpent(riddleStartTime) {
  if (!riddleStartTime) return 0
  
  const startTime = new Date(riddleStartTime)
  const endTime = new Date()
  const diffMs = endTime - startTime
  const diffSeconds = Math.floor(diffMs / 1000)
  
  return Math.max(0, diffSeconds) // Ensure non-negative
}