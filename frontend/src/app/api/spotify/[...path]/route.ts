import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spotify/${path}${
    searchParams ? `?${searchParams}` : ''
  }`;

  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Missing authorization token' },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying to Spotify API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to proxy request to Spotify API' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spotify/${path}`;

  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Missing authorization token' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying to Spotify API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to proxy request to Spotify API' },
      { status: 500 }
    );
  }
} 