# Audotics

A modern music recommendation and group listening platform that combines AI-powered recommendations with real-time collaborative music experiences.

## Features

- **Spotify Integration**: Connect with Spotify to access your music library and control playback
- **Group Sessions**: Create and join collaborative listening rooms with friends
- **AI-Powered Recommendations**: Get personalized music suggestions based on your preferences
- **Real-time Collaboration**: Vote on songs, add tracks to queue, and chat in real-time
- **NLP Music Search**: Find songs using natural language descriptions
- **Analytics Dashboard**: Track listening habits and preferences

## Tech Stack

### Frontend
- Next.js
- React
- TailwindCSS
- Socket.io Client
- Chart.js

### Backend
- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- Socket.io
- TensorFlow

## Installation

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL
- Redis (optional, in-memory fallback available)
- Spotify Developer Account

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file with database and Spotify credentials
npm run prisma:migrate
npm run start:dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Configure your .env file
npm run dev
```

### Python Tools Setup

```bash
cd backend
pip install -r requirements.txt
```

## Environment Variables

Create a `.env` file in both the frontend and backend directories with the following variables:

### Backend (.env)
```
DATABASE_URL=postgresql://username:password@localhost:5432/audotics
REDIS_URL=redis://localhost:6379
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
PORT=4000
```

### Frontend (.env)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

## Development

```bash
# Run backend in development mode
cd backend
npm run start:dev

# Run frontend in development mode
cd frontend
npm run dev
```

## API Documentation

API documentation is available at `http://localhost:4000/api` when the backend server is running.

## License

[MIT](LICENSE)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 