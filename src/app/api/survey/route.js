import { submitSurveyResponse } from '@/lib/analytics'

/**
 * POST /api/survey
 * Handles survey response submissions
 */
export async function POST(request) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['session_id', 'nps_score', 'enjoyment_level', 'learning_value', 'difficulty_rating']
    const missingFields = requiredFields.filter(field => body[field] === undefined || body[field] === null)
    
    if (missingFields.length > 0) {
      return Response.json(
        { 
          error: 'Missing required fields', 
          missing: missingFields 
        },
        { status: 400 }
      )
    }

    // Validate score ranges
    if (body.nps_score < 0 || body.nps_score > 10) {
      return Response.json(
        { error: 'NPS score must be between 0 and 10' },
        { status: 400 }
      )
    }

    if (body.enjoyment_level < 1 || body.enjoyment_level > 5) {
      return Response.json(
        { error: 'Enjoyment level must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (body.learning_value < 1 || body.learning_value > 5) {
      return Response.json(
        { error: 'Learning value must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (body.difficulty_rating < 1 || body.difficulty_rating > 5) {
      return Response.json(
        { error: 'Difficulty rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Submit survey response
    const success = await submitSurveyResponse(body)

    if (!success) {
      return Response.json(
        { error: 'Failed to submit survey response' },
        { status: 500 }
      )
    }

    return Response.json(
      { 
        success: true,
        message: 'Survey response submitted successfully' 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in survey API route:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}