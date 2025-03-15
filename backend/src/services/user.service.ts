import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private db: DatabaseService) {}

  async findById(id: string) {
    return this.db.user.findUnique({
      where: { id }
    });
  }

  async findByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email }
    });
  }

  async findBySpotifyId(spotifyId: string) {
    return this.db.user.findFirst({
      where: { spotifyId }
    });
  }

  async create(data: {
    email: string;
    name: string;
    password?: string;
    avatar?: string;
    spotifyId?: string;
    spotifyAccessToken?: string;
    spotifyRefreshToken?: string;
    spotifyTokenExpiry?: Date;
  }) {
    // If password is provided, hash it
    let hashedPassword = undefined;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    // For spotifyId, ensure it's not undefined
    const spotifyId = data.spotifyId || '';

    return this.db.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        avatar: data.avatar,
        spotifyId,
        spotifyAccessToken: data.spotifyAccessToken,
        spotifyRefreshToken: data.spotifyRefreshToken,
        spotifyTokenExpiry: data.spotifyTokenExpiry,
      }
    });
  }

  async update(id: string, data: {
    name?: string;
    email?: string;
    avatar?: string;
    password?: string;
    spotifyId?: string;
    spotifyAccessToken?: string;
    spotifyRefreshToken?: string;
    spotifyTokenExpiry?: Date;
  }) {
    // If password is provided, hash it
    let hashedPassword = undefined;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    return this.db.user.update({
      where: { id },
      data: {
        ...data,
        ...(data.password && { password: hashedPassword }),
      }
    });
  }

  async delete(id: string) {
    return this.db.user.delete({
      where: { id }
    });
  }

  async validateCredentials(email: string, password: string) {
    const user = await this.findByEmail(email);
    
    // Check if user exists and has password field
    const userWithPassword = await this.db.user.findUnique({
      where: { email },
      select: { id: true, password: true }
    });
    
    if (!user || !userWithPassword?.password) return null;

    const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);
    if (!isPasswordValid) return null;

    return user;
  }

  async getSpotifyToken(userId: string): Promise<string | null> {
    const userWithToken = await this.db.user.findUnique({
      where: { id: userId },
      select: { spotifyAccessToken: true, spotifyTokenExpiry: true }
    });
    
    if (!userWithToken || !userWithToken.spotifyAccessToken) return null;

    // Check if token is expired
    const now = new Date();
    const tokenExpiry = userWithToken.spotifyTokenExpiry;

    if (tokenExpiry && tokenExpiry > now) {
      return userWithToken.spotifyAccessToken;
    }

    // Token is expired, should handle refresh
    return null;
  }

  async hasSpotifyConnected(userId: string): Promise<boolean> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { spotifyId: true }
    });
    return !!user?.spotifyId;
  }
} 