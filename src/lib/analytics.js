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


// ==========================================
// SURVEY RESPONSE TRACKING
// ==========================================

/**
 * Submit post-adventure survey response
 * @param {Object} surveyData - Survey response data
 * @returns {Promise<boolean>} Success status
 */
export async function submitSurveyResponse(surveyData) {
  try {
    const { data, error } = await supabase
      .from('survey_responses')
      .insert([{
        session_id: surveyData.session_id,
        nps_score: surveyData.nps_score,
        enjoyment_level: surveyData.enjoyment_level,
        learning_value: surveyData.learning_value,
        difficulty_rating: surveyData.difficulty_rating,
        favorite_aspects: surveyData.favorite_aspects || [],
        improvements: surveyData.improvements || null,
        would_recommend: surveyData.would_recommend || null,
        age_group: surveyData.age_group || null,
        completed_at: surveyData.completed_at || new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Failed to submit survey:', error)
      return false
    }

    console.log('✅ Survey submitted successfully:', data.id)
    return true
  } catch (err) {
    console.error('Error submitting survey:', err)
    return false
  }
}

/**
 * Check if a session has an associated survey response
 * @param {string} sessionId - UUID of the session
 * @returns {Promise<boolean>} True if survey exists
 */
export async function hasSurveyResponse(sessionId) {
  try {
    const { data, error } = await supabase
      .from('survey_responses')
      .select('id')
      .eq('session_id', sessionId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking survey response:', error)
      return false
    }

    return !!data
  } catch (err) {
    console.error('Error checking survey response:', err)
    return false
  }
}

/**
 * Get survey analytics summary
 * @returns {Promise<Object|null>} Survey summary statistics
 */
export async function getSurveySummary() {
  try {
    const { data, error } = await supabase
      .from('survey_summary')
      .select('*')
      .single()

    if (error) {
      console.error('Failed to get survey summary:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Error getting survey summary:', err)
    return null
  }
}

/**
 * Get favorite aspects breakdown
 * @returns {Promise<Array|null>} Array of favorite aspects with counts
 */
export async function getFavoriteAspects() {
  try {
    const { data, error } = await supabase
      .from('favorite_aspects_breakdown')
      .select('*')
      .order('count', { ascending: false })

    if (error) {
      console.error('Failed to get favorite aspects:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Error getting favorite aspects:', err)
    return null
  }
}

/**
 * Calculate NPS (Net Promoter Score)
 * @returns {Promise<Object|null>} NPS calculation with promoters/passives/detractors
 */
export async function calculateNPS() {
  try {
    const { data, error } = await supabase
      .rpc('calculate_nps')

    if (error) {
      console.error('Failed to calculate NPS:', error)
      return null
    }

    return data[0] || null
  } catch (err) {
    console.error('Error calculating NPS:', err)
    return null
  }
}

/**
 * Get survey responses with session context for detailed analysis
 * @param {Object} filters - Optional filters (difficulty, age_group, date_range)
 * @returns {Promise<Array|null>} Array of survey responses with session data
 */
export async function getSurveyResponsesWithContext(filters = {}) {
  try {
    let query = supabase
      .from('survey_with_session_context')
      .select('*')
      .order('completed_at', { ascending: false })

    // Apply filters if provided
    if (filters.difficulty) {
      query = query.eq('session_difficulty', filters.difficulty)
    }
    if (filters.age_group) {
      query = query.eq('age_group', filters.age_group)
    }
    if (filters.start_date) {
      query = query.gte('completed_at', filters.start_date)
    }
    if (filters.end_date) {
      query = query.lte('completed_at', filters.end_date)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to get survey responses with context:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Error getting survey responses with context:', err)
    return null
  }
}