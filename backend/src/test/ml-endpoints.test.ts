import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:3001/api';
const TEST_USER_ID = process.env.TEST_USER_ID;
const SPOTIFY_TOKEN = process.env.SPOTIFY_TEST_TOKEN;

// Skip this test suite if environment variables are not set
const skipTest = !TEST_USER_ID || !SPOTIFY_TOKEN;

describe.skip('ML Endpoints', () => {
  it('should collect user data', async () => {
    if (skipTest) {
      console.log('Skipping test: TEST_USER_ID or SPOTIFY_TEST_TOKEN not set');
      return;
    }
    
    const collectionResponse = await axios.post(
      `${API_URL}/ml/users/${TEST_USER_ID}/collect`,
      { access_token: SPOTIFY_TOKEN }
    );
    
    expect(collectionResponse.status).toBe(200);
    expect(collectionResponse.data).toBeDefined();
  });

  it('should return recommendations', async () => {
    if (skipTest) {
      console.log('Skipping test: TEST_USER_ID or SPOTIFY_TEST_TOKEN not set');
      return;
    }
    
    const recommendationsResponse = await axios.post(
      `${API_URL}/ml/users/${TEST_USER_ID}/recommendations`,
      { access_token: SPOTIFY_TOKEN }
    );
    
    expect(recommendationsResponse.status).toBe(200);
    expect(recommendationsResponse.data).toBeDefined();
    expect(recommendationsResponse.data.tracks).toBeDefined();
  });
}); 