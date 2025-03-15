# Audotics Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the Audotics platform, covering all aspects of testing from unit tests to end-to-end integration tests.

## Testing Levels

### 1. Unit Testing

#### Backend Unit Tests
```typescript
// User Service Tests
describe('UserService', () => {
  let service: UserService;
  let mockRepo: MockRepository<User>;
  
  beforeEach(() => {
    mockRepo = new MockRepository<User>();
    service = new UserService(mockRepo);
  });
  
  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };
      
      const user = await service.createUser(userData);
      
      expect(user).toBeDefined();
      expect(user.username).toBe(userData.username);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });
    
    it('should throw on duplicate email', async () => {
      const userData = {
        username: 'testuser',
        email: 'existing@example.com',
        password: 'password123'
      };
      
      mockRepo.findOne.mockResolvedValue({ email: userData.email });
      
      await expect(service.createUser(userData))
        .rejects
        .toThrow('Email already exists');
    });
  });
});
```

#### Frontend Unit Tests
```typescript
// Playlist Component Tests
describe('PlaylistComponent', () => {
  it('should render playlist tracks', () => {
    const playlist = {
      id: '1',
      name: 'Test Playlist',
      tracks: [
        { id: '1', title: 'Track 1', artist: 'Artist 1' },
        { id: '2', title: 'Track 2', artist: 'Artist 2' }
      ]
    };
    
    const { getByText, getAllByTestId } = render(
      <PlaylistComponent playlist={playlist} />
    );
    
    expect(getByText(playlist.name)).toBeInTheDocument();
    expect(getAllByTestId('track-item')).toHaveLength(2);
  });
  
  it('should handle empty playlist', () => {
    const playlist = {
      id: '1',
      name: 'Empty Playlist',
      tracks: []
    };
    
    const { getByText } = render(
      <PlaylistComponent playlist={playlist} />
    );
    
    expect(getByText('No tracks in playlist')).toBeInTheDocument();
  });
});
```

### 2. Integration Testing

#### API Integration Tests
```typescript
describe('Playlist API', () => {
  let app: Express;
  let testUser: User;
  let authToken: string;
  
  beforeAll(async () => {
    app = await createTestApp();
    testUser = await createTestUser();
    authToken = generateTestToken(testUser);
  });
  
  describe('POST /api/playlists', () => {
    it('should create new playlist', async () => {
      const playlistData = {
        name: 'Test Playlist',
        isCollaborative: true
      };
      
      const response = await request(app)
        .post('/api/playlists')
        .set('Authorization', `Bearer ${authToken}`)
        .send(playlistData);
      
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: playlistData.name,
        isCollaborative: playlistData.isCollaborative,
        userId: testUser.id
      });
    });
  });
  
  describe('GET /api/playlists/:id', () => {
    it('should return playlist with tracks', async () => {
      const playlist = await createTestPlaylist(testUser.id);
      
      const response = await request(app)
        .get(`/api/playlists/${playlist.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: playlist.id,
        name: playlist.name,
        tracks: expect.any(Array)
      });
    });
  });
});
```

### 3. End-to-End Testing

#### Cypress Tests
```typescript
describe('Playlist Management', () => {
  beforeEach(() => {
    cy.login();
  });
  
  it('should create and manage playlist', () => {
    // Create playlist
    cy.get('[data-testid="create-playlist-btn"]').click();
    cy.get('[data-testid="playlist-name-input"]')
      .type('My Test Playlist');
    cy.get('[data-testid="save-playlist-btn"]').click();
    
    // Verify playlist creation
    cy.get('[data-testid="playlist-list"]')
      .should('contain', 'My Test Playlist');
    
    // Add track to playlist
    cy.get('[data-testid="search-input"]')
      .type('Test Track');
    cy.get('[data-testid="search-result"]')
      .first()
      .drag('[data-testid="playlist-dropzone"]');
    
    // Verify track addition
    cy.get('[data-testid="track-list"]')
      .should('contain', 'Test Track');
  });
});
```

### 4. Performance Testing

#### Load Testing
```typescript
import { check } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 }    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01']    // Less than 1% of requests should fail
  }
};

export default function() {
  const BASE_URL = 'https://api.audotics.com';
  
  // Get recommendations
  const recommendationsRes = http.get(`${BASE_URL}/recommendations`);
  check(recommendationsRes, {
    'recommendations status is 200': (r) => r.status === 200,
    'recommendations response time OK': (r) => r.timings.duration < 500
  });
  
  // Create playlist
  const playlistRes = http.post(`${BASE_URL}/playlists`, {
    name: 'Test Playlist',
    isCollaborative: true
  });
  check(playlistRes, {
    'playlist creation status is 201': (r) => r.status === 201,
    'playlist creation time OK': (r) => r.timings.duration < 1000
  });
}
```

### 5. Security Testing

#### Security Test Cases
```typescript
describe('Security Tests', () => {
  describe('Authentication', () => {
    it('should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/api/protected-route')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(401);
    });
    
    it('should prevent brute force attacks', async () => {
      const attempts = Array(10).fill(null).map(() => 
        request(app)
          .post('/api/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          })
      );
      
      const responses = await Promise.all(attempts);
      const lastResponse = responses[responses.length - 1];
      
      expect(lastResponse.status).toBe(429); // Too Many Requests
    });
  });
  
  describe('Data Protection', () => {
    it('should encrypt sensitive data', async () => {
      const user = await createTestUser();
      const credentials = {
        spotifyToken: 'sensitive-token'
      };
      
      await storeUserCredentials(user.id, credentials);
      
      const storedData = await db.credentials.findOne({
        userId: user.id
      });
      
      expect(storedData.encryptedData).not.toContain(credentials.spotifyToken);
    });
  });
});
```

## Test Coverage Requirements

### Minimum Coverage Thresholds
```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    },
    './src/core/': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    },
    './src/utils/': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85
    }
  }
};
```

## Continuous Integration Testing

### GitHub Actions Workflow
```yaml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: audotics_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:6
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install Dependencies
      run: npm ci
      
    - name: Run Linter
      run: npm run lint
      
    - name: Run Unit Tests
      run: npm run test:unit
      
    - name: Run Integration Tests
      run: npm run test:integration
      
    - name: Run E2E Tests
      run: npm run test:e2e
      
    - name: Upload Coverage
      uses: codecov/codecov-action@v2
```

## Test Data Management

### Test Data Generation
```typescript
// Test data factory
class TestDataFactory {
  static async createUser(overrides = {}): Promise<User> {
    return await db.users.create({
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: await bcrypt.hash('password123', 10),
      ...overrides
    });
  }
  
  static async createPlaylist(userId: string, overrides = {}): Promise<Playlist> {
    return await db.playlists.create({
      name: faker.music.genre(),
      userId,
      isCollaborative: faker.datatype.boolean(),
      ...overrides
    });
  }
  
  static async createTrack(overrides = {}): Promise<Track> {
    return await db.tracks.create({
      title: faker.music.songName(),
      artist: faker.name.findName(),
      album: faker.music.songName(),
      duration_ms: faker.datatype.number({ min: 30000, max: 300000 }),
      ...overrides
    });
  }
}
```

## Test Reporting

### Test Report Configuration
```javascript
// jest.config.js
module.exports = {
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'reports/junit',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › '
    }],
    ['jest-html-reporters', {
      publicPath: './reports/html',
      filename: 'test-report.html',
      expand: true
    }]
  ]
};
```

## Test Automation

### Automated Test Suite
```bash
#!/bin/bash

# Run all tests
function run_all_tests() {
  echo "Running all tests..."
  
  echo "1. Running unit tests..."
  npm run test:unit
  
  echo "2. Running integration tests..."
  npm run test:integration
  
  echo "3. Running E2E tests..."
  npm run test:e2e
  
  echo "4. Running performance tests..."
  npm run test:performance
  
  echo "5. Running security tests..."
  npm run test:security
  
  echo "Generating test reports..."
  npm run test:report
}

# Run specific test suite
function run_test_suite() {
  local suite=$1
  echo "Running $suite tests..."
  npm run test:$suite
}

# Main execution
if [ "$1" ]; then
  run_test_suite $1
else
  run_all_tests
fi
```
