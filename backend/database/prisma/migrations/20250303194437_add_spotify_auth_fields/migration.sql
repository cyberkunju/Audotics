/*
  Warnings:

  - You are about to drop the column `displayName` on the `User` table. All the data in the column will be lost.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_spotifyId_key";

-- AlterTable
ALTER TABLE "User" 
    DROP COLUMN "displayName",
    ADD COLUMN "name" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "password" TEXT,
    ADD COLUMN "avatar" TEXT,
    ALTER COLUMN "spotifyId" DROP NOT NULL,
    ADD COLUMN "spotifyAccessToken" TEXT,
    ADD COLUMN "spotifyRefreshToken" TEXT,
    ADD COLUMN "spotifyTokenExpiry" TIMESTAMP(3);

-- Update existing users
UPDATE "User" SET "name" = email WHERE "name" = '';

-- CreateIndex
CREATE INDEX "GroupSession_active_idx" ON "GroupSession"("active");

-- CreateIndex
CREATE INDEX "GroupSession_createdAt_idx" ON "GroupSession"("createdAt");

-- CreateIndex
CREATE INDEX "GroupSession_updatedAt_idx" ON "GroupSession"("updatedAt");

-- CreateIndex
CREATE INDEX "Playlist_creatorId_idx" ON "Playlist"("creatorId");

-- CreateIndex
CREATE INDEX "Playlist_sessionId_idx" ON "Playlist"("sessionId");

-- CreateIndex
CREATE INDEX "Playlist_createdAt_idx" ON "Playlist"("createdAt");

-- CreateIndex
CREATE INDEX "Track_spotifyId_idx" ON "Track"("spotifyId");

-- CreateIndex
CREATE INDEX "Track_artists_idx" ON "Track"("artists");

-- CreateIndex
CREATE INDEX "TrackFeatures_trackId_idx" ON "TrackFeatures"("trackId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_name_idx" ON "User"("name");

-- CreateIndex
CREATE INDEX "User_spotifyId_idx" ON "User"("spotifyId");

-- CreateIndex
CREATE INDEX "UserPreference_userId_idx" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "UserPreference_topArtists_idx" ON "UserPreference"("topArtists");

-- CreateIndex
CREATE INDEX "UserPreference_genres_idx" ON "UserPreference"("genres");
