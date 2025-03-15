# Development Environment Setup

## Prerequisites

### Required Software
1. **Node.js** (v18.x or later)
2. **Python** (v3.9 or later)
3. **Docker** (latest stable)
4. **Git** (latest version)
5. **VS Code** (recommended IDE)

### Database Systems
1. **PostgreSQL** (v14 or later)
2. **MongoDB** (v6.0 or later)
3. **Redis** (v7.0 or later)

### Cloud Services Access
1. AWS Account (for cloud development)
2. Docker Hub account
3. GitHub account

## Installation Steps

### 1. Core Dependencies

#### Node.js Setup
```bash
# Windows (using chocolatey)
choco install nodejs

# Verify installation
node --version
npm --version
```

#### Python Setup
```bash
# Windows (using chocolatey)
choco install python

# Verify installation
python --version
pip --version
```

#### Docker Setup
```bash
# Windows
choco install docker-desktop

# Verify installation
docker --version
docker-compose --version
```

### 2. Database Setup

#### PostgreSQL
```bash
# Windows
choco install postgresql

# Verify installation
psql --version

# Create development database
createdb audotics_dev
```

#### MongoDB
```bash
# Windows
choco install mongodb

# Verify installation
mongo --version

# Start MongoDB service
net start MongoDB
```

#### Redis
```bash
# Windows
choco install redis-64

# Verify installation
redis-cli --version

# Start Redis service
net start Redis
```

### 3. Project Setup

#### Clone Repository
```bash
git clone https://github.com/audotics/audotics.git
cd audotics
```

#### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Configure environment variables
```

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure environment variables
```

#### ML Environment Setup
```bash
cd ml
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

### 4. Environment Configuration

#### Frontend Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=development
```

#### Backend Environment Variables
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://localhost:5432/audotics_dev
MONGODB_URI=mongodb://localhost:27017/audotics
REDIS_URL=redis://localhost:6379
```

#### ML Environment Variables
```env
PYTHONPATH=./src
MODEL_PATH=./models
DATA_PATH=./data
```

### 5. IDE Setup

#### VS Code Extensions
1. ESLint
2. Prettier
3. Python
4. Docker
5. GitLens
6. REST Client

#### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "python.linting.enabled": true,
  "python.formatting.provider": "black"
}
```

## Running the Application

### Start Development Servers

#### Frontend
```bash
cd frontend
npm run dev
```

#### Backend
```bash
cd backend
npm run dev
```

#### ML Services
```bash
cd ml
python -m src.main
```

### Docker Development Environment
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Development Workflow

### 1. Branch Management
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Push changes
git push origin feature/your-feature-name
```

### 2. Code Quality
```bash
# Frontend
npm run lint
npm run test

# Backend
npm run lint
npm run test

# ML
pytest
black .
```

### 3. Database Migrations
```bash
# Run migrations
npm run migrate

# Create new migration
npm run migrate:create
```

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check ports in use
netstat -ano | findstr "3000"

# Kill process
taskkill /PID <process_id> /F
```

#### Database Connection
```bash
# Test PostgreSQL connection
psql -h localhost -U postgres audotics_dev

# Test MongoDB connection
mongo mongodb://localhost:27017/audotics
```

#### Cache Issues
```bash
# Clear Redis cache
redis-cli FLUSHALL
```

## Additional Resources
- [Architecture Overview](system_architecture.md)
- [API Documentation](../api/README.md)
- [Testing Guide](testing_guide.md)
- [Deployment Guide](../deployment/guide.md)
