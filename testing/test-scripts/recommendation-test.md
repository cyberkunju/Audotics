# ML Recommendation Test Script

## Test Information
- **Test ID**: REC-001
- **Priority**: Critical
- **Feature**: ML Recommendation System
- **Test Type**: Manual & Automated
- **Test Environment**: Test Server (https://test.audotics.com)

## Description
This test script verifies the accuracy, relevance, and performance of the Audotics ML recommendation system, including personal recommendations, group recommendations, and recommendation quality metrics.

## Preconditions
1. Test environment is accessible
2. Test user accounts with different preference profiles are available:
   - Rock Profile: rockfan@audotics.com / Test123!
   - Pop Profile: popfan@audotics.com / Test123!
   - Mixed Profile: mixedfan@audotics.com / Test123!
3. Each test account has a history of at least 50 song interactions
4. ML model is properly deployed and operational
5. Test data for controlled recommendation testing is available

## Test Steps - Personal Recommendations

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Log in as Rock Profile user | Login succeeds, user is directed to dashboard | | |
| 2 | Navigate to "Recommendations" section | Recommendation page loads with personalized recommendations | | |
| 3 | Verify recommendations genre distribution | At least 60% of recommendations should be rock or related genres | | |
| 4 | Check for recently played artists | Recommendations should include songs from similar artists but not identical to recently played | | |
| 5 | Verify recommendation diversity | Recommendations should span at least 3 sub-genres of rock | | |
| 6 | Rate 3 non-rock songs positively | Ratings are recorded | | |
| 7 | Refresh recommendations | New recommendations should include more non-rock content (at least 20%) | | |
| 8 | Log out and log in as Pop Profile user | Login succeeds, dashboard shows pop-oriented recommendations | | |
| 9 | Verify recommendations genre distribution | At least 60% of recommendations should be pop or related genres | | |
| 10 | Check recommendation freshness | At least 30% of recommendations should be from the last 2 years | | |

## Test Steps - Recommendation Response Time

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Log in as Mixed Profile user | Login succeeds, user is directed to dashboard | | |
| 2 | Measure time to load initial recommendations | Recommendations load in < 500ms | | |
| 3 | Apply genre filter for "Electronic" | Filtered recommendations appear in < 300ms | | |
| 4 | Apply decade filter for "2010s" | Filtered recommendations appear in < 300ms | | |
| 5 | Remove all filters | Unfiltered recommendations appear in < 300ms | | |
| 6 | Rate 5 songs positively in quick succession | All ratings are recorded without performance degradation | | |
| 7 | Request new recommendations | New recommendations load in < 500ms | | |
| 8 | Switch between recommendation categories (Discover, Based on History, Trending) | Category switch occurs in < 300ms | | |

## Test Steps - Group Recommendations

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Create a new group with Rock Profile as host | Group is created successfully | | |
| 2 | Add Pop Profile user to the group | User is added successfully | | |
| 3 | Request group recommendations | Recommendations load in < 1000ms | | |
| 4 | Verify genre distribution | Recommendations should show a balanced mix of rock and pop (40-60% each) | | |
| 5 | Add Mixed Profile user to the group | User is added successfully | | |
| 6 | Request group recommendations again | New recommendations load with adjusted distribution | | |
| 7 | Verify genre distribution with 3 users | Recommendations should reflect all three profiles with no single genre exceeding 50% | | |
| 8 | Rate several recommendations as a group | Ratings are recorded for the group | | |
| 9 | Request recommendations again | New recommendations reflect group ratings | | |

## Test Steps - Recommendation Accuracy Metrics

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Access the ML metrics dashboard (admin account) | Dashboard loads with accuracy metrics | | |
| 2 | Check precision score for personal recommendations | Precision score should be > 0.7 | | |
| 3 | Check recall score for personal recommendations | Recall score should be > 0.65 | | |
| 4 | Check Mean Average Precision (MAP) | MAP should be > 0.8 | | |
| 5 | Check group recommendation satisfaction score | Score should be > 0.75 | | |
| 6 | Check recommendation diversity score | Score should be > 0.7 | | |
| 7 | Check cold start performance | Accuracy for new users should be > 0.6 | | |
| 8 | Check time-sensitivity score | Score should be > 0.75 | | |

## Test Steps - Edge Cases

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1 | Create a new user with no history | Account is created successfully | | |
| 2 | Check initial recommendations | Cold start recommendations should be based on basic profile information and trending content | | |
| 3 | Test with extremely niche genre preferences | System still provides relevant recommendations, possibly including similar genres | | |
| 4 | Create a group with completely opposing tastes | Group recommendations find common ground or alternate between different styles | | |
| 5 | Test with a high-activity user (1000+ interactions) | System performs efficiently with no degradation | | |
| 6 | Test with rapidly changing preferences | System adapts recommendations within 2-3 recommendation refresh cycles | | |

## ML System Performance Tests

| # | Check | Expected Result | Status | Notes |
|---|-------|-----------------|--------|-------|
| 1 | Measure response time under load (100 concurrent requests) | Average response time < 1s, 95th percentile < 2s | | |
| 2 | Check CPU utilization on ML servers during peak | CPU utilization < 80% | | |
| 3 | Verify memory consumption | Memory usage stable, no leaks | | |
| 4 | Test recommendation caching | Cached recommendations serve in < 100ms | | |
| 5 | Check model retraining impact on availability | No service interruption during model updates | | |

## Test Data

- Rock Profile: rockfan@audotics.com / Test123! (likes rock, metal, alternative)
- Pop Profile: popfan@audotics.com / Test123! (likes pop, dance, R&B)
- Mixed Profile: mixedfan@audotics.com / Test123! (likes diverse genres)
- Admin account: admin@audotics.com / [From password manager]

## Pass/Fail Criteria
- Personal recommendation genre accuracy > 60% match to user profile
- Group recommendation satisfaction score > 75%
- Recommendation response time < 500ms for individuals, < 1000ms for groups
- ML system handles all test cases without errors
- Recommendation diversity meets threshold (at least 3 genres, no single artist > 30%)
- System adapts to preference changes within 3 recommendation cycles

## Notes
- Accuracy percentages should be measured using the ML metrics dashboard
- For subjective quality, a panel of testers should evaluate a sample of recommendations
- Response times may vary based on network conditions and should be averaged over 3 attempts
- Take screenshots of any unexpected behavior or error messages

## Test Results

**Tester Name**: ___________________________

**Date Tested**: ___________________________

**Overall Result**: □ PASS  □ FAIL

**Issues Found**:
___________________________
___________________________
___________________________

**Additional Comments**:
___________________________
___________________________
___________________________ 