/*
  Warnings:

  - You are about to drop the column `features` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `artists` on the `UserPreference` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `UserPreference` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[spotifyId]` on the table `Track` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Track` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastUpdated` to the `UserPreference` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Track" DROP COLUMN "features",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "popularity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "UserPreference" DROP COLUMN "artists",
DROP COLUMN "updatedAt",
ADD COLUMN     "lastUpdated" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "topArtists" TEXT[],
ADD COLUMN     "topTracks" TEXT[];

-- CreateTable
CREATE TABLE "TrackFeatures" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "danceability" DOUBLE PRECISION NOT NULL,
    "energy" DOUBLE PRECISION NOT NULL,
    "key" INTEGER NOT NULL,
    "loudness" DOUBLE PRECISION NOT NULL,
    "mode" INTEGER NOT NULL,
    "speechiness" DOUBLE PRECISION NOT NULL,
    "acousticness" DOUBLE PRECISION NOT NULL,
    "instrumentalness" DOUBLE PRECISION NOT NULL,
    "liveness" DOUBLE PRECISION NOT NULL,
    "valence" DOUBLE PRECISION NOT NULL,
    "tempo" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackFeatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackFeatures_trackId_key" ON "TrackFeatures"("trackId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackInteraction_userId_trackId_type_timestamp_key" ON "TrackInteraction"("userId", "trackId", "type", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Track_spotifyId_key" ON "Track"("spotifyId");

-- AddForeignKey
ALTER TABLE "TrackFeatures" ADD CONSTRAINT "TrackFeatures_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackInteraction" ADD CONSTRAINT "TrackInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackInteraction" ADD CONSTRAINT "TrackInteraction_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
