-- AlterEnum
ALTER TYPE "DirectoryNetworkStatus" ADD VALUE IF NOT EXISTS 'deprecated';

-- AlterEnum
ALTER TYPE "DirectoryNetworkStatus" ADD VALUE IF NOT EXISTS 'experimental';
