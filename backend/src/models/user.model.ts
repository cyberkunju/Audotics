import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  spotifyId?: string;
  
  @Field({ nullable: true })
  spotifyAccessToken?: string;
  
  @Field({ nullable: true })
  spotifyRefreshToken?: string;
  
  @Field({ nullable: true })
  spotifyTokenExpiry?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
} 