/**
 * Audotics ML Recommendation Testing Script
 * 
 * This script helps evaluate the accuracy and performance of the ML recommendation
 * system by simulating users with different preference profiles and measuring
 * the relevance of their recommendations.
 */

const testUserProfiles = {
  // User 1: Pop and Electronic music fan
  'pop_electronic_user': {
    name: 'Alex',
    preferences: {
      genres: ['Pop', 'Electronic', 'Dance'],
      artists: ['Dua Lipa', 'The Weeknd', 'Calvin Harris', 'Ariana Grande'],
      avoid_genres: ['Metal', 'Classical', 'Jazz'],
      mood: 'energetic',
      activity: 'workout',
      decades: ['2010s', '2020s']
    }
  },
  
  // User 2: Rock and Alternative fan
  'rock_alternative_user': {
    name: 'Jamie',
    preferences: {
      genres: ['Rock', 'Alternative', 'Indie'],
      artists: ['Foo Fighters', 'Arctic Monkeys', 'Tame Impala', 'The Strokes'],
      avoid_genres: ['Country', 'EDM'],
      mood: 'reflective',
      activity: 'driving',
      decades: ['1990s', '2000s', '2010s']
    }
  },
  
  // User 3: Hip-Hop and R&B fan
  'hiphop_rnb_user': {
    name: 'Morgan',
    preferences: {
      genres: ['Hip Hop', 'R&B', 'Trap'],
      artists: ['Kendrick Lamar', 'Drake', 'The Weeknd', 'SZA'],
      avoid_genres: ['Country', 'Metal'],
      mood: 'confident',
      activity: 'social',
      decades: ['2000s', '2010s', '2020s']
    }
  },
  
  // User 4: Classical and Jazz enthusiast
  'classical_jazz_user': {
    name: 'Jordan',
    preferences: {
      genres: ['Classical', 'Jazz', 'Instrumental'],
      artists: ['Miles Davis', 'John Coltrane', 'Yo-Yo Ma', 'Mozart'],
      avoid_genres: ['EDM', 'Trap', 'Metal'],
      mood: 'focused',
      activity: 'reading',
      decades: ['1950s', '1960s', '1970s', '1980s']
    }
  },
  
  // User 5: Eclectic listener with diverse taste
  'eclectic_user': {
    name: 'Sam',
    preferences: {
      genres: ['Indie', 'Electronic', 'Folk', 'World', 'Jazz'],
      artists: ['Radiohead', 'Arcade Fire', 'Bonobo', 'Nils Frahm', 'Four Tet'],
      avoid_genres: [],
      mood: 'curious',
      activity: 'exploring',
      decades: ['1970s', '1980s', '1990s', '2000s', '2010s', '2020s']
    }
  }
};

/**
 * Group configurations for testing group recommendation accuracy
 */
const testGroups = {
  // Similar tastes group
  'similar_tastes': {
    name: 'Similar Tastes Group',
    members: ['pop_electronic_user', 'hiphop_rnb_user'],
    description: 'Users with somewhat overlapping music preferences'
  },
  
  // Diverse tastes group
  'diverse_tastes': {
    name: 'Diverse Tastes Group',
    members: ['rock_alternative_user', 'classical_jazz_user', 'pop_electronic_user'],
    description: 'Users with very different music preferences'
  },
  
  // Mixed group
  'mixed_group': {
    name: 'Mixed Group',
    members: ['eclectic_user', 'hiphop_rnb_user', 'rock_alternative_user', 'pop_electronic_user'],
    description: 'Group with one eclectic listener and various other preferences'
  }
};

/**
 * Setup a test user with the specified profile
 * @param {string} profileId - ID of the user profile to use
 * @returns {Object} User object with profile data
 */
function setupTestUser(profileId) {
  const profile = testUserProfiles[profileId];
  if (!profile) {
    throw new Error(`Profile "${profileId}" not found`);
  }
  
  // Create a test user with profile data
  const user = {
    id: `test_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    name: profile.name,
    profile: {
      ...profile.preferences
    },
    testProfileId: profileId
  };
  
  return user;
}

/**
 * Create a test group with the specified configuration
 * @param {string} groupId - ID of the group configuration to use
 * @returns {Object} Group object with member data
 */
function setupTestGroup(groupId) {
  const groupConfig = testGroups[groupId];
  if (!groupConfig) {
    throw new Error(`Group "${groupId}" not found`);
  }
  
  // Create test users for each member
  const members = groupConfig.members.map(profileId => setupTestUser(profileId));
  
  // Create a test group
  const group = {
    id: `test_group_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    name: groupConfig.name,
    members,
    description: groupConfig.description
  };
  
  return group;
}

/**
 * Evaluate recommendations for relevance to user preferences
 * @param {Array} recommendations - Array of recommended tracks
 * @param {Object} user - User with preferences
 * @returns {Object} Evaluation metrics
 */
function evaluateRecommendationsForUser(recommendations, user) {
  if (!recommendations || recommendations.length === 0) {
    return {
      relevanceScore: 0,
      matchingGenres: 0,
      matchingArtists: 0,
      avoidedGenres: 0,
      diversityScore: 0,
      noveltyScore: 0
    };
  }
  
  const userPreferences = user.profile;
  
  // Count matches between recommendations and user preferences
  let genreMatches = 0;
  let artistMatches = 0;
  let avoidedGenreMatches = 0;
  
  // Track unique genres and artists for diversity calculation
  const uniqueGenres = new Set();
  const uniqueArtists = new Set();
  
  recommendations.forEach(track => {
    // Check genre matches
    if (track.genre && userPreferences.genres.some(g => 
      track.genre.toLowerCase().includes(g.toLowerCase()))) {
      genreMatches++;
    }
    
    // Check artist matches
    if (track.artist && userPreferences.artists.some(a => 
      track.artist.toLowerCase().includes(a.toLowerCase()))) {
      artistMatches++;
    }
    
    // Check avoided genres
    if (track.genre && userPreferences.avoid_genres && userPreferences.avoid_genres.some(g => 
      track.genre.toLowerCase().includes(g.toLowerCase()))) {
      avoidedGenreMatches++;
    }
    
    // Add to unique sets for diversity calculation
    if (track.genre) uniqueGenres.add(track.genre.toLowerCase());
    if (track.artist) uniqueArtists.add(track.artist.toLowerCase());
  });
  
  // Calculate relevance score (0-1)
  // 60% weight to genre, 40% to artist matches
  const genreRelevance = genreMatches / recommendations.length;
  const artistRelevance = artistMatches / recommendations.length;
  const relevanceScore = (genreRelevance * 0.6) + (artistRelevance * 0.4);
  
  // Calculate diversity score (0-1)
  // Based on unique genres and artists as a proportion of total
  const genreDiversity = uniqueGenres.size / recommendations.length;
  const artistDiversity = uniqueArtists.size / recommendations.length;
  const diversityScore = (genreDiversity + artistDiversity) / 2;
  
  // For novelty, we'd need the user's history, but for test we'll estimate based on
  // inverse of artist matches (novelty = not matching known preferences)
  const noveltyScore = 1 - (artistMatches / recommendations.length);
  
  return {
    relevanceScore,
    genreMatchPercentage: (genreMatches / recommendations.length) * 100,
    artistMatchPercentage: (artistMatches / recommendations.length) * 100,
    avoidedGenresPercentage: (avoidedGenreMatches / recommendations.length) * 100,
    diversityScore,
    noveltyScore,
    uniqueGenresCount: uniqueGenres.size,
    uniqueArtistsCount: uniqueArtists.size
  };
}

/**
 * Evaluate group recommendations for relevance to all members
 * @param {Array} recommendations - Array of recommended tracks
 * @param {Object} group - Group with members and their preferences
 * @returns {Object} Evaluation metrics for the group
 */
function evaluateRecommendationsForGroup(recommendations, group) {
  if (!recommendations || recommendations.length === 0 || !group.members || group.members.length === 0) {
    return {
      groupRelevanceScore: 0,
      memberScores: {},
      fairnessScore: 0
    };
  }
  
  // Evaluate for each member
  const memberEvaluations = {};
  let totalRelevance = 0;
  
  group.members.forEach(member => {
    const evaluation = evaluateRecommendationsForUser(recommendations, member);
    memberEvaluations[member.testProfileId] = evaluation;
    totalRelevance += evaluation.relevanceScore;
  });
  
  // Calculate average relevance
  const avgRelevance = totalRelevance / group.members.length;
  
  // Calculate fairness score (how evenly recommendations satisfy each member)
  const relevanceScores = Object.values(memberEvaluations).map(e => e.relevanceScore);
  const minRelevance = Math.min(...relevanceScores);
  const maxRelevance = Math.max(...relevanceScores);
  
  // Fairness: ratio of min to max relevance (higher = more fair)
  const fairnessScore = minRelevance / maxRelevance;
  
  return {
    groupRelevanceScore: avgRelevance,
    memberScores: memberEvaluations,
    fairnessScore,
    minMemberRelevance: minRelevance,
    maxMemberRelevance: maxRelevance
  };
}

/**
 * Format the evaluation results as a detailed markdown report
 * @param {Object} userResults - Individual user evaluation results
 * @param {Object} groupResults - Group evaluation results
 * @returns {string} Markdown formatted report
 */
function generateMLEvaluationReport(userResults, groupResults) {
  let report = '# ML Recommendation Testing Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  // Individual User Recommendations
  report += '## Individual User Recommendations\n\n';
  
  for (const [userId, result] of Object.entries(userResults)) {
    const profile = testUserProfiles[userId];
    report += `### User: ${profile.name} (${userId})\n\n`;
    report += `**Preferences**: ${profile.preferences.genres.join(', ')}\n\n`;
    
    report += `**Evaluation Metrics**:\n`;
    report += `- Relevance Score: ${(result.relevanceScore * 100).toFixed(1)}%\n`;
    report += `- Genre Match: ${result.genreMatchPercentage.toFixed(1)}%\n`;
    report += `- Artist Match: ${result.artistMatchPercentage.toFixed(1)}%\n`;
    report += `- Avoided Genres: ${result.avoidedGenresPercentage.toFixed(1)}%\n`;
    report += `- Diversity Score: ${(result.diversityScore * 100).toFixed(1)}%\n`;
    report += `- Novelty Score: ${(result.noveltyScore * 100).toFixed(1)}%\n`;
    
    // Verdict based on target metrics
    const passRelevance = result.relevanceScore >= 0.7; // Target: 70%+
    const passAvoidance = result.avoidedGenresPercentage <= 10; // Target: <10%
    const passDiversity = result.diversityScore >= 0.6; // Target: 60%+
    
    report += `\n**Assessment**:\n`;
    report += `- Relevance: ${passRelevance ? '✅ Pass' : '❌ Fail'} (Target: 70%+)\n`;
    report += `- Avoided Genre Filtering: ${passAvoidance ? '✅ Pass' : '❌ Fail'} (Target: <10%)\n`;
    report += `- Diversity: ${passDiversity ? '✅ Pass' : '❌ Fail'} (Target: 60%+)\n`;
    
    report += '\n';
  }
  
  // Group Recommendations
  report += '## Group Recommendations\n\n';
  
  for (const [groupId, result] of Object.entries(groupResults)) {
    const groupConfig = testGroups[groupId];
    report += `### Group: ${groupConfig.name} (${groupId})\n\n`;
    report += `**Description**: ${groupConfig.description}\n`;
    report += `**Members**: ${groupConfig.members.length}\n\n`;
    
    report += `**Group Evaluation Metrics**:\n`;
    report += `- Group Relevance Score: ${(result.groupRelevanceScore * 100).toFixed(1)}%\n`;
    report += `- Fairness Score: ${(result.fairnessScore * 100).toFixed(1)}%\n`;
    report += `- Lowest Member Relevance: ${(result.minMemberRelevance * 100).toFixed(1)}%\n`;
    report += `- Highest Member Relevance: ${(result.maxMemberRelevance * 100).toFixed(1)}%\n\n`;
    
    // Member breakdown
    report += `**Member Breakdown**:\n`;
    for (const [memberId, memberResult] of Object.entries(result.memberScores)) {
      const profile = testUserProfiles[memberId];
      report += `- ${profile.name}: ${(memberResult.relevanceScore * 100).toFixed(1)}% relevance\n`;
    }
    
    // Verdict based on target metrics
    const passGroupRelevance = result.groupRelevanceScore >= 0.6; // Target: 60%+
    const passFairness = result.fairnessScore >= 0.7; // Target: 70%+
    const passMinRelevance = result.minMemberRelevance >= 0.5; // Target: 50%+
    
    report += `\n**Assessment**:\n`;
    report += `- Group Relevance: ${passGroupRelevance ? '✅ Pass' : '❌ Fail'} (Target: 60%+)\n`;
    report += `- Fairness: ${passFairness ? '✅ Pass' : '❌ Fail'} (Target: 70%+)\n`;
    report += `- Minimum Member Satisfaction: ${passMinRelevance ? '✅ Pass' : '❌ Fail'} (Target: 50%+)\n`;
    
    report += '\n';
  }
  
  // Overall Assessment
  report += '## Overall ML System Assessment\n\n';
  
  const userResults1dArray = Object.values(userResults);
  const groupResults1dArray = Object.values(groupResults);
  
  const avgUserRelevance = userResults1dArray.reduce((acc, r) => acc + r.relevanceScore, 0) / userResults1dArray.length;
  const avgGroupRelevance = groupResults1dArray.reduce((acc, r) => acc + r.groupRelevanceScore, 0) / groupResults1dArray.length;
  const avgFairness = groupResults1dArray.reduce((acc, r) => acc + r.fairnessScore, 0) / groupResults1dArray.length;
  
  report += `**Average Metrics**:\n`;
  report += `- Individual User Relevance: ${(avgUserRelevance * 100).toFixed(1)}%\n`;
  report += `- Group Relevance: ${(avgGroupRelevance * 100).toFixed(1)}%\n`;
  report += `- Group Fairness: ${(avgFairness * 100).toFixed(1)}%\n\n`;
  
  // Final assessment
  const passUserRelevance = avgUserRelevance >= 0.7;
  const passGroupRelevance = avgGroupRelevance >= 0.6;
  const passFairness = avgFairness >= 0.7;
  
  const overallPassScore = 
    (passUserRelevance ? 1 : 0) + 
    (passGroupRelevance ? 1 : 0) + 
    (passFairness ? 1 : 0);
  
  let finalVerdict = '';
  if (overallPassScore === 3) {
    finalVerdict = '✅ PASS - ML recommendation system meets all performance targets';
  } else if (overallPassScore === 2) {
    finalVerdict = '⚠️ CONDITIONAL PASS - ML recommendation system meets most performance targets';
  } else {
    finalVerdict = '❌ FAIL - ML recommendation system does not meet performance targets';
  }
  
  report += `**Final Verdict**: ${finalVerdict}\n\n`;
  
  // Improvement suggestions
  report += '## Improvement Suggestions\n\n';
  
  if (!passUserRelevance) {
    report += '- Individual recommendations need improvement in relevance to user preferences\n';
  }
  
  if (!passGroupRelevance) {
    report += '- Group recommendation algorithm needs refinement to better match group preferences\n';
  }
  
  if (!passFairness) {
    report += '- Group fairness needs improvement to ensure balanced recommendations across members\n';
  }
  
  const userWithWorstAvoidance = Object.entries(userResults)
    .sort((a, b) => b[1].avoidedGenresPercentage - a[1].avoidedGenresPercentage)[0];
    
  if (userWithWorstAvoidance[1].avoidedGenresPercentage > 10) {
    report += `- Improve filtering of avoided genres, especially for user profile: ${userWithWorstAvoidance[0]}\n`;
  }
  
  const userWithWorstDiversity = Object.entries(userResults)
    .sort((a, b) => a[1].diversityScore - b[1].diversityScore)[0];
    
  if (userWithWorstDiversity[1].diversityScore < 0.6) {
    report += `- Increase recommendation diversity, especially for user profile: ${userWithWorstDiversity[0]}\n`;
  }
  
  return report;
}

/**
 * Main function for browser use
 */
function runMLRecommendationTest() {
  // Check if we have access to the recommendation data
  if (!window.__TEST_RECOMMENDATIONS__) {
    console.error('No recommendation data available. Please load test recommendations first.');
    return;
  }
  
  const { individualRecommendations, groupRecommendations } = window.__TEST_RECOMMENDATIONS__;
  
  // Evaluate individual recommendations
  const userResults = {};
  for (const userId in individualRecommendations) {
    const recommendations = individualRecommendations[userId];
    const user = setupTestUser(userId);
    userResults[userId] = evaluateRecommendationsForUser(recommendations, user);
  }
  
  // Evaluate group recommendations
  const groupResults = {};
  for (const groupId in groupRecommendations) {
    const recommendations = groupRecommendations[groupId];
    const group = setupTestGroup(groupId);
    groupResults[groupId] = evaluateRecommendationsForGroup(recommendations, group);
  }
  
  // Generate and log the report
  const report = generateMLEvaluationReport(userResults, groupResults);
  console.log(report);
  
  return {
    report,
    userResults,
    groupResults
  };
}

/**
 * For Node.js environment - export functions to be used in testing scripts
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testUserProfiles,
    testGroups,
    setupTestUser,
    setupTestGroup,
    evaluateRecommendationsForUser,
    evaluateRecommendationsForGroup,
    generateMLEvaluationReport,
    getBrowserTestCode: () => `(${runMLRecommendationTest.toString()})()`,
    mockRecommendationsTemplate: `
    window.__TEST_RECOMMENDATIONS__ = {
      individualRecommendations: {
        pop_electronic_user: [
          // Array of track objects with at least: id, title, artist, genre properties
        ],
        rock_alternative_user: [
          // Array of track objects with at least: id, title, artist, genre properties
        ],
        // Add more user profiles...
      },
      groupRecommendations: {
        similar_tastes: [
          // Array of track objects
        ],
        diverse_tastes: [
          // Array of track objects
        ],
        // Add more group configurations...
      }
    };
    `
  };
} else {
  // For browser environment, expose functions globally
  window.runMLRecommendationTest = runMLRecommendationTest;
  window.setupTestUser = setupTestUser;
  window.setupTestGroup = setupTestGroup;
  window.testUserProfiles = testUserProfiles;
  window.testGroups = testGroups;
} 