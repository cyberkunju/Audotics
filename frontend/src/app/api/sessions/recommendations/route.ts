import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId');
  
  if (!sessionId) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Session ID is required' },
      { status: 400 }
    );
  }
  
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Missing authorization token' },
      { status: 401 }
    );
  }
  
  try {
    // Call our backend API for group recommendations
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/sessions/${sessionId}/recommendations`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      
      // Check if this is a Spotify authentication error
      if (errorData.error === 'Spotify authentication required') {
        return NextResponse.json(
          { 
            needsAuth: true, 
            error: errorData.error,
            aggregatedPreferences: errorData.aggregatedPreferences 
          }, 
          { status: 401 }
        );
      }
      
      return NextResponse.json(errorData, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching group recommendations:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch group recommendations' },
      { status: 500 }
    );
  }
} 