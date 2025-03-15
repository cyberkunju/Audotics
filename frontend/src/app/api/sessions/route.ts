import { NextRequest, NextResponse } from 'next/server'

// Temporary mock database for sessions (would be replaced by real API calls to backend)
let sessions: any[] = []

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const isPublic = searchParams.get('isPublic')
    const type = searchParams.get('type') // 'my', 'recent', etc.
    
    // Filter sessions based on parameters
    let filteredSessions = [...sessions]
    
    if (type === 'my' && userId) {
      filteredSessions = sessions.filter(session => 
        session.createdBy === userId || session.participants.some((p: any) => p.id === userId)
      )
    } else if (type === 'recent') {
      // Sort by created date descending
      filteredSessions = sessions
        .filter(session => session.isPublic)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10) // Return only 10 most recent
    } else if (isPublic === 'true') {
      filteredSessions = sessions.filter(session => session.isPublic)
    }
    
    return NextResponse.json({ sessions: filteredSessions })
  } catch (error: any) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication token is required' },
        { status: 401 }
      )
    }
    
    // Extract token
    const token = authHeader.split(' ')[1]
    
    // Verify token (mock implementation)
    // In a real app, this would validate the token with the backend
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid authentication token' },
        { status: 401 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { name, isPublic, genres, maxParticipants, createdBy } = body
    
    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Session name is required' },
        { status: 400 }
      )
    }
    
    // Create session in the real backend
    // This would be a real API call in production
    // For now, we'll use the mock database
    
    // Create a new session
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const newSession = {
      id: sessionId,
      name,
      isPublic: isPublic === undefined ? true : isPublic,
      genres: genres || [],
      maxParticipants: maxParticipants || 5,
      createdBy,
      createdAt: new Date().toISOString(),
      participants: [{ id: createdBy, name: 'You' }], // Add creator as first participant
      playlist: [],
      recommendations: []
    }
    
    // Add to mock database
    sessions.push(newSession)
    
    // In a real app, we would make an API call to the backend here:
    // const response = await fetch('https://api.audotics.com/sessions', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': authHeader
    //   },
    //   body: JSON.stringify(newSession)
    // })
    // const data = await response.json()
    
    return NextResponse.json({ 
      message: 'Session created successfully',
      sessionId 
    })
  } catch (error: any) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Failed to create session', message: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication token is required' },
        { status: 401 }
      )
    }
    
    // Extract session ID
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('id')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Session ID is required' },
        { status: 400 }
      )
    }
    
    // Find the session index
    const sessionIndex = sessions.findIndex(session => session.id === sessionId)
    if (sessionIndex === -1) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Session not found' },
        { status: 404 }
      )
    }
    
    // Remove the session
    sessions.splice(sessionIndex, 1)
    
    // In a real app, we would make an API call to the backend here
    
    return NextResponse.json({ 
      message: 'Session deleted successfully' 
    })
  } catch (error: any) {
    console.error('Error deleting session:', error)
    return NextResponse.json(
      { error: 'Failed to delete session', message: error.message },
      { status: 500 }
    )
  }
} 