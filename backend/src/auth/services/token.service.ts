import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { TokenFamily } from '../interfaces/auth.interface';
import * as crypto from 'crypto';

@Injectable()
export class TokenService {
  private readonly tokenFamilyPrefix = 'token_family:';
  private readonly usedTokensPrefix = 'used_tokens:';
  private readonly TOKEN_FAMILY_TTL = 30 * 24 * 60 * 60; // 30 days

  constructor(private readonly redisService: RedisService) {}

  async createTokenFamily(userId: string, refreshToken: string): Promise<TokenFamily> {
    const family: TokenFamily = {
      id: crypto.randomUUID(),
      userId,
      refreshToken,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    };

    await this.redisService.set(
      `${this.tokenFamilyPrefix}${refreshToken}`,
      JSON.stringify(family),
      this.TOKEN_FAMILY_TTL
    );

    return family;
  }

  async getTokenFamily(refreshToken: string): Promise<TokenFamily | null> {
    const familyStr = await this.redisService.get(`${this.tokenFamilyPrefix}${refreshToken}`);
    return familyStr ? JSON.parse(familyStr) : null;
  }

  async updateTokenFamily(family: TokenFamily, newRefreshToken: string): Promise<void> {
    // Mark old token as used
    await this.redisService.set(
      `${this.usedTokensPrefix}${family.refreshToken}`,
      'true',
      this.TOKEN_FAMILY_TTL
    );

    // Update family with new token
    family.refreshToken = newRefreshToken;
    family.lastUsed = Date.now();

    await this.redisService.set(
      `${this.tokenFamilyPrefix}${newRefreshToken}`,
      JSON.stringify(family),
      this.TOKEN_FAMILY_TTL
    );
  }

  async isTokenUsed(refreshToken: string): Promise<boolean> {
    return !!(await this.redisService.get(`${this.usedTokensPrefix}${refreshToken}`));
  }

  async invalidateFamily(family: TokenFamily): Promise<void> {
    // Get all tokens in the family
    const keys = await this.redisService.keys(`${this.tokenFamilyPrefix}*`);
    for (const key of keys) {
      const storedFamily = await this.getTokenFamily(key.replace(this.tokenFamilyPrefix, ''));
      if (storedFamily?.id === family.id) {
        await this.redisService.del(key);
      }
    }
  }
} 