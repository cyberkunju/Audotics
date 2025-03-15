# Audotics Setup Guide

This guide provides detailed instructions for setting up the Audotics platform for development, testing, and production environments.

## Prerequisites

Before setting up Audotics, ensure you have the following installed:

- Node.js (v18 or higher)
- Python (v3.9 or higher)
- PostgreSQL (v14 or higher)
- Redis (v6 or higher)
- Spotify Developer Account
- Docker and Docker Compose (for containerized deployment)

## Development Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/audotics.git
cd audotics
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your specific configuration
```

### 3. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your specific configuration
```

### 4. Database Setup

```bash
# Create PostgreSQL database
createdb audotics_dev

# Run migrations
cd backend
npm run migrate:up
```

### 5. Machine Learning Environment

```bash
cd backend/src/aiml
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 6. Redis Setup

Ensure Redis is running locally or update the configuration to point to your Redis instance.

### 7. Spotify API Configuration

1. Create a Spotify Developer account at [developer.spotify.com](https://developer.spotify.com)
2. Create a new application
3. Add `http://localhost:3000/api/auth/callback/spotify` as a redirect URI
4. Copy your Client ID and Client Secret to the appropriate environment variables

## Running the Application

### Start the Frontend

```bash
cd frontend
npm run dev
```

### Start the Backend

```bash
cd backend
npm run dev
```

### Start ML Services (if needed)

```bash
cd backend/src/aiml
source venv/bin/activate  # On Windows: venv\Scripts\activate
python train_models.py
```

## Testing Environment Setup

For setting up the testing environment, refer to our [Testing Documentation](../testing/README.md).

## Production Environment Setup

For production deployment, refer to our [Deployment Guide](../deployment/README.md).

## Troubleshooting

If you encounter issues during setup, check our [Troubleshooting Guide](../troubleshooting/errors.md) or open an issue on the repository.

## Next Steps

Once your environment is set up, you can:

1. Explore the [Project Overview](../project/todo.md)
2. Review the [Architecture Documentation](../architecture/tech-stack.md)
3. Check the [Developer Guidelines](../contributing/README.md) 