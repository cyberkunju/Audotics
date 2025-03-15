-- AlterTable
ALTER TABLE "UserPreference" ALTER COLUMN "genres" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "features" DROP NOT NULL;
