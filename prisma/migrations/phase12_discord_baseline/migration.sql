-- Phase 12: Discord integration, project admins, and enum baseline
-- Idempotent — safe when objects already exist from prior db push.

-- Enums ------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "ProjectAdminRole" AS ENUM ('owner', 'manager');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProjectDiscordIntegrationStatus" AS ENUM ('draft', 'active', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DiscordRoleRuleStatus" AS ENUM ('draft', 'active', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DiscordRoleGrantStatus" AS ENUM (
    'pending',
    'granted',
    'skipped_discord_not_linked',
    'failed_user_not_in_server',
    'failed_missing_bot_permission',
    'failed_role_hierarchy',
    'failed_rate_limited',
    'failed_unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "PartnerIntakeReviewStatus" ADD VALUE IF NOT EXISTS 'rejected';

-- DiscordAccount ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS "DiscordAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "discordUserId" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "globalName" TEXT,
  "avatar" TEXT,
  "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DiscordAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DiscordAccount_userId_key" ON "DiscordAccount"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "DiscordAccount_discordUserId_key" ON "DiscordAccount"("discordUserId");
CREATE INDEX IF NOT EXISTS "DiscordAccount_discordUserId_idx" ON "DiscordAccount"("discordUserId");

DO $$ BEGIN
  ALTER TABLE "DiscordAccount"
    ADD CONSTRAINT "DiscordAccount_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ProjectAdmin -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS "ProjectAdmin" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "ProjectAdminRole" NOT NULL DEFAULT 'manager',
  "invitedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectAdmin_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProjectAdmin_productId_userId_key" ON "ProjectAdmin"("productId", "userId");
CREATE INDEX IF NOT EXISTS "ProjectAdmin_userId_idx" ON "ProjectAdmin"("userId");

DO $$ BEGIN
  ALTER TABLE "ProjectAdmin"
    ADD CONSTRAINT "ProjectAdmin_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProjectAdmin"
    ADD CONSTRAINT "ProjectAdmin_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProjectAdmin"
    ADD CONSTRAINT "ProjectAdmin_invitedByUserId_fkey"
    FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ProjectDiscordIntegration ----------------------------------------------

CREATE TABLE IF NOT EXISTS "ProjectDiscordIntegration" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "guildId" TEXT NOT NULL,
  "guildName" TEXT NOT NULL,
  "status" "ProjectDiscordIntegrationStatus" NOT NULL DEFAULT 'draft',
  "botInstalled" BOOLEAN NOT NULL DEFAULT false,
  "lastPermissionCheckStatus" TEXT,
  "lastPermissionCheckAt" TIMESTAMP(3),
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectDiscordIntegration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProjectDiscordIntegration_productId_key" ON "ProjectDiscordIntegration"("productId");
CREATE INDEX IF NOT EXISTS "ProjectDiscordIntegration_guildId_idx" ON "ProjectDiscordIntegration"("guildId");

DO $$ BEGIN
  ALTER TABLE "ProjectDiscordIntegration"
    ADD CONSTRAINT "ProjectDiscordIntegration_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProjectDiscordIntegration"
    ADD CONSTRAINT "ProjectDiscordIntegration_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- DiscordRoleRule --------------------------------------------------------

CREATE TABLE IF NOT EXISTS "DiscordRoleRule" (
  "id" TEXT NOT NULL,
  "productDiscordIntegrationId" TEXT NOT NULL,
  "badgeId" TEXT NOT NULL,
  "discordRoleId" TEXT NOT NULL,
  "discordRoleName" TEXT NOT NULL,
  "unlockLabel" TEXT,
  "status" "DiscordRoleRuleStatus" NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DiscordRoleRule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DiscordRoleRule_productDiscordIntegrationId_badgeId_key"
  ON "DiscordRoleRule"("productDiscordIntegrationId", "badgeId");
CREATE UNIQUE INDEX IF NOT EXISTS "DiscordRoleRule_productDiscordIntegrationId_discordRoleId_key"
  ON "DiscordRoleRule"("productDiscordIntegrationId", "discordRoleId");
CREATE INDEX IF NOT EXISTS "DiscordRoleRule_badgeId_idx" ON "DiscordRoleRule"("badgeId");

DO $$ BEGIN
  ALTER TABLE "DiscordRoleRule"
    ADD CONSTRAINT "DiscordRoleRule_productDiscordIntegrationId_fkey"
    FOREIGN KEY ("productDiscordIntegrationId") REFERENCES "ProjectDiscordIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DiscordRoleRule"
    ADD CONSTRAINT "DiscordRoleRule_badgeId_fkey"
    FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- DiscordRoleGrant -------------------------------------------------------

CREATE TABLE IF NOT EXISTS "DiscordRoleGrant" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "discordAccountId" TEXT,
  "badgeAwardId" TEXT NOT NULL,
  "discordRoleRuleId" TEXT NOT NULL,
  "guildId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "status" "DiscordRoleGrantStatus" NOT NULL DEFAULT 'pending',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "grantedAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "lastErrorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DiscordRoleGrant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DiscordRoleGrant_badgeAwardId_discordRoleRuleId_key"
  ON "DiscordRoleGrant"("badgeAwardId", "discordRoleRuleId");
CREATE INDEX IF NOT EXISTS "DiscordRoleGrant_status_idx" ON "DiscordRoleGrant"("status");
CREATE INDEX IF NOT EXISTS "DiscordRoleGrant_userId_idx" ON "DiscordRoleGrant"("userId");

DO $$ BEGIN
  ALTER TABLE "DiscordRoleGrant"
    ADD CONSTRAINT "DiscordRoleGrant_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DiscordRoleGrant"
    ADD CONSTRAINT "DiscordRoleGrant_discordAccountId_fkey"
    FOREIGN KEY ("discordAccountId") REFERENCES "DiscordAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DiscordRoleGrant"
    ADD CONSTRAINT "DiscordRoleGrant_badgeAwardId_fkey"
    FOREIGN KEY ("badgeAwardId") REFERENCES "BadgeAward"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DiscordRoleGrant"
    ADD CONSTRAINT "DiscordRoleGrant_discordRoleRuleId_fkey"
    FOREIGN KEY ("discordRoleRuleId") REFERENCES "DiscordRoleRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
