import { Injectable } from '@nestjs/common';
import { Track } from '@prisma/client';

/**
 * Provides evaluation metrics for recommendation models
 */
@Injectable()
export class ModelEvaluator {
  /**
   * Calculate precision@k metric
   * 
   * @param recommendedItems Array of recommended items
   * @param relevantItems Array of items known to be relevant
   * @param k Number of top recommendations to consider
   * @returns Precision score (0-1)
   */
  calculatePrecision(recommendedItems: string[], relevantItems: string[], k?: number): number {
    if (recommendedItems.length === 0) return 0;
    
    const topK = k ? recommendedItems.slice(0, k) : recommendedItems;
    const truePositives = topK.filter(item => relevantItems.includes(item)).length;
    
    return truePositives / topK.length;
  }

  /**
   * Calculate recall@k metric
   * 
   * @param recommendedItems Array of recommended items
   * @param relevantItems Array of items known to be relevant
   * @param k Number of top recommendations to consider
   * @returns Recall score (0-1)
   */
  calculateRecall(recommendedItems: string[], relevantItems: string[], k?: number): number {
    if (relevantItems.length === 0) return 0;
    
    const topK = k ? recommendedItems.slice(0, k) : recommendedItems;
    const truePositives = topK.filter(item => relevantItems.includes(item)).length;
    
    return truePositives / relevantItems.length;
  }

  /**
   * Calculate F1 score, the harmonic mean of precision and recall
   * 
   * @param recommendedItems Array of recommended items
   * @param relevantItems Array of items known to be relevant
   * @param k Number of top recommendations to consider
   * @returns F1 score (0-1)
   */
  calculateF1Score(recommendedItems: string[], relevantItems: string[], k?: number): number {
    const precision = this.calculatePrecision(recommendedItems, relevantItems, k);
    const recall = this.calculateRecall(recommendedItems, relevantItems, k);
    
    // Avoid division by zero
    if (precision + recall === 0) return 0;
    
    return 2 * (precision * recall) / (precision + recall);
  }

  /**
   * Calculate Mean Average Precision
   * 
   * @param recommendedItems Array of recommended items
   * @param relevantItems Array of items known to be relevant
   * @returns MAP score (0-1)
   */
  calculateMAP(recommendedItems: string[], relevantItems: string[]): number {
    if (recommendedItems.length === 0 || relevantItems.length === 0) return 0;
    
    let relevantCount = 0;
    let sumPrecision = 0;
    
    for (let i = 0; i < recommendedItems.length; i++) {
      const item = recommendedItems[i];
      if (relevantItems.includes(item)) {
        relevantCount++;
        // Calculate precision at this point
        const precision = relevantCount / (i + 1);
        sumPrecision += precision;
      }
    }
    
    return relevantCount > 0 ? sumPrecision / relevantCount : 0;
  }

  /**
   * Calculate Normalized Discounted Cumulative Gain (NDCG)
   * 
   * @param recommendedItems Array of recommended items
   * @param relevantItems Array of items known to be relevant (with relevance scores)
   * @param k Number of top recommendations to consider
   * @returns NDCG score (0-1)
   */
  calculateNDCG(
    recommendedItems: string[], 
    relevantItemsWithScores: Record<string, number>,
    k?: number
  ): number {
    const topK = k ? recommendedItems.slice(0, k) : recommendedItems;
    if (topK.length === 0) return 0;
    
    // Calculate DCG
    let dcg = 0;
    for (let i = 0; i < topK.length; i++) {
      const item = topK[i];
      const relevance = relevantItemsWithScores[item] || 0;
      // DCG formula: relevance / log2(i+2)
      dcg += relevance / Math.log2(i + 2);
    }
    
    // Calculate ideal DCG (IDCG)
    const relevanceScores = Object.values(relevantItemsWithScores).sort((a, b) => b - a);
    const relevantItemCount = Math.min(topK.length, relevanceScores.length);
    
    let idcg = 0;
    for (let i = 0; i < relevantItemCount; i++) {
      idcg += relevanceScores[i] / Math.log2(i + 2);
    }
    
    return idcg > 0 ? dcg / idcg : 0;
  }

  /**
   * Calculate diversity score based on attributes like genre, artist, etc.
   * 
   * @param recommendations Array of tracks
   * @param attributeExtractor Function to extract the attribute to measure diversity on
   * @returns Diversity score (0-1)
   */
  calculateDiversity<T extends Track>(
    recommendations: T[],
    attributeExtractor: (track: T) => string | string[]
  ): number {
    if (recommendations.length <= 1) return 0;
    
    const uniqueAttributes = new Set<string>();
    
    recommendations.forEach(track => {
      const attributes = attributeExtractor(track);
      if (Array.isArray(attributes)) {
        attributes.forEach(attr => uniqueAttributes.add(attr));
      } else if (attributes) {
        uniqueAttributes.add(attributes);
      }
    });
    
    // Normalize by total number of recommendations
    return uniqueAttributes.size / recommendations.length;
  }

  /**
   * Evaluate a recommendation model using all metrics
   * 
   * @param recommendedItems Array of recommended item IDs
   * @param relevantItems Array of relevant item IDs
   * @param recommendations Full track objects for diversity calculation
   * @param k Number of top recommendations to consider
   * @returns Object containing all evaluation metrics
   */
  evaluateRecommendations<T extends Track>(
    recommendedItems: string[],
    relevantItems: string[],
    relevanceScores: Record<string, number>,
    recommendations: T[],
    genreExtractor: (track: T) => string[],
    artistExtractor: (track: T) => string[],
    k: number = 10
  ): RecommendationEvaluation {
    return {
      precisionAtK: this.calculatePrecision(recommendedItems, relevantItems, k),
      recallAtK: this.calculateRecall(recommendedItems, relevantItems, k),
      f1Score: this.calculateF1Score(recommendedItems, relevantItems, k),
      meanAveragePrecision: this.calculateMAP(recommendedItems, relevantItems),
      ndcg: this.calculateNDCG(recommendedItems, relevanceScores, k),
      diversityByGenre: this.calculateDiversity(recommendations, genreExtractor),
      diversityByArtist: this.calculateDiversity(recommendations, artistExtractor)
    };
  }
}

export interface RecommendationEvaluation {
  precisionAtK: number;
  recallAtK: number;
  f1Score: number;
  meanAveragePrecision: number;
  ndcg: number;
  diversityByGenre: number;
  diversityByArtist: number;
} 