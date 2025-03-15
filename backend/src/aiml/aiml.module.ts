import { Module } from '@nestjs/common';
import { MLDataService } from './services/ml-data.service';
import { NLPRecommendationService } from './services/nlp-recommendation.service';
import { DatabaseService } from '../services/database.service';
import { SpotifyService } from '../services/spotify.service';

@Module({
  imports: [],
  providers: [
    MLDataService,
    NLPRecommendationService,
    DatabaseService,
    SpotifyService
  ],
  exports: [
    MLDataService,
    NLPRecommendationService
  ]
})
export class AimlModule {} 