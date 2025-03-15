-- CreateTable
CREATE TABLE "PlaylistUpdate" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaylistUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlaylistUpdate_playlistId_timestamp_idx" ON "PlaylistUpdate"("playlistId", "timestamp");

-- AddForeignKey
ALTER TABLE "PlaylistUpdate" ADD CONSTRAINT "PlaylistUpdate_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistUpdate" ADD CONSTRAINT "PlaylistUpdate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
