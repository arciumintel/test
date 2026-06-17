# Discord Integration Design

Date: 2026-06-17
Status: Approved for implementation planning

## Summary

Arcademy will add bot-managed Discord role grants so project communities can unlock Discord roles and channels when learners complete Arcademy courses. Arcademy remains the source of truth for learning progress, quiz results, badge awards, and eligibility. Discord receives role changes after Arcademy awards a badge.

The primary learner flow is "Connect Discord on Arcademy." Learners connect a Solana wallet as they do today, then optionally link Discord from Arcademy. If a learner has not linked Discord, the top navigation shows a reminder next to the wallet connection control so they understand that connected Discord accounts can receive project-server roles from earned badges.

## Goals

- Let learners earn Discord roles in project servers by completing Arcademy courses and earning badges.
- Let projects configure their own Discord server and course-to-role mappings.
- Keep Arcademy completion and badge logic authoritative.
- Make Discord sync state visible and auditable for learners, project admins, and Arcademy staff.
- Backfill eligible Discord role grants when a learner links Discord after earning badges.
- Preserve the plain-language, trustworthy UX tone of Arcademy.

## Non-Goals

- Discord-first verification commands are not part of the initial flow.
- Discord Linked Roles are not used for course-specific unlocks in this version.
- Arcademy will not create or manage Discord channels; projects configure channel visibility in Discord using roles.
- Arcademy will not revoke course badges based on Discord state.
- Arcademy will not require Discord linking to complete courses or receive Arcademy badges.

## Product Model

Projects configure a Discord integration from Arcademy. A project can connect one Discord server and define any number of role rules. Each role rule maps one published Arcademy badge to one Discord role in that server.

The rule is badge-based rather than quiz-attempt-based. This matches the existing completion rule: required lessons complete, final quiz passed, and wallet connected. A learner who only passes a quiz without completing the course does not receive the Discord role.

Role rules have a lifecycle:

- `draft`: visible to admins, not used for grants.
- `active`: used for new and backfilled grants.
- `paused`: retained for audit, but no new grants are created.

## Learner Experience

The top navigation adds Discord account state next to the wallet connection control.

When the wallet is disconnected, the current wallet connection CTA remains primary. Discord linking is not emphasized because Arcademy identity is wallet anchored.

When the wallet is connected and Discord is not linked, show a compact `Connect Discord` CTA. The supporting copy should explain that linking Discord lets earned badges unlock roles in eligible project servers. The copy should avoid crypto jargon and avoid implying Discord is required for learning.

When Discord is linked, show a compact connected state, such as the Discord username or a connected indicator. The profile page should include a manage/disconnect action.

When a learner earns a badge while Discord is not linked, the badge result, profile badge list, and badge verification-adjacent learner UI should prompt them to connect Discord so eligible role grants can sync. Public verification pages should not require Discord state.

When a learner links Discord after previous badge awards, Arcademy evaluates active role rules for their earned badges and queues any missing role grants.

## Project Admin Experience

Project admins can:

- Add the Arcademy Discord bot to their Discord server.
- Register the server ID in Arcademy.
- View bot installation and permission status.
- Select Discord roles from the configured server when permissions allow role discovery.
- Map Arcademy badges to Discord roles.
- Label each unlock in learner-friendly language, such as "The Basics".
- Activate, pause, and edit role mappings.
- Trigger a test check that reports whether the bot can grant the selected role.
- View recent grant attempts and failure reasons.

Arcademy staff can see and manage all project Discord configurations. Project admins can manage configurations only for projects they own. Partner self-service requires a project ownership model so Arcademy can invite and remove project admins without granting global staff access.

## Architecture

Arcademy adds four integration areas:

1. Discord OAuth account linking for learners.
2. Project Discord server and role mapping configuration.
3. Async role grant jobs triggered by badge awards and Discord linking.
4. Audit and status views for grant attempts.

The role grant path is asynchronous. Course completion creates the badge award first. After the badge award exists, Arcademy finds active Discord role rules for the badge and creates role grant jobs. A worker or server-side job processor calls Discord's API using the Arcademy bot token to add the role to the linked Discord user in the configured guild.

Discord API usage:

- OAuth2 authorization-code flow with `identify` for account linking.
- Bot authorization for project server installation.
- Bot role assignment through Discord's add guild member role endpoint.
- The bot must have `MANAGE_ROLES`, must be in the guild, and must be above the target role in Discord's role hierarchy.

## Proposed Data Model

`DiscordAccount`

- `id`
- `userId`
- `discordUserId`
- `username`
- `globalName`
- `avatar`
- `linkedAt`
- `updatedAt`

Unique constraints:

- one Discord account per Arcademy user
- one Arcademy user per Discord user

OAuth access tokens are exchanged only long enough to read the Discord user profile. Arcademy does not retain Discord OAuth tokens for bot-managed role grants because subsequent role assignment uses the Arcademy bot token and the stored Discord user ID.

`ProjectAdmin`

- `id`
- `productId`
- `userId`
- `role`
- `invitedByUserId`
- `createdAt`
- `updatedAt`

Role values:

- `owner`
- `manager`

Unique constraint:

- one project admin record per product and user

`ProjectDiscordIntegration`

- `id`
- `productId`
- `guildId`
- `guildName`
- `status`
- `botInstalled`
- `lastPermissionCheckStatus`
- `lastPermissionCheckAt`
- `createdByUserId`
- `createdAt`
- `updatedAt`

Unique constraint:

- one active Discord integration per product

Status values:

- `draft`
- `active`
- `paused`

`DiscordRoleRule`

- `id`
- `productDiscordIntegrationId`
- `badgeId`
- `discordRoleId`
- `discordRoleName`
- `unlockLabel`
- `status`
- `createdAt`
- `updatedAt`

Unique constraint:

- one rule per integration and badge/role pair

`DiscordRoleGrant`

- `id`
- `userId`
- `discordAccountId`
- `badgeAwardId`
- `discordRoleRuleId`
- `guildId`
- `roleId`
- `status`
- `attemptCount`
- `lastAttemptAt`
- `grantedAt`
- `lastErrorCode`
- `lastErrorMessage`
- `createdAt`
- `updatedAt`

Unique constraint:

- one grant per badge award and role rule

## Grant Statuses

Grant statuses should be specific enough to drive support and admin UX:

- `pending`
- `granted`
- `skipped_discord_not_linked`
- `failed_user_not_in_server`
- `failed_missing_bot_permission`
- `failed_role_hierarchy`
- `failed_rate_limited`
- `failed_unknown`

`skipped_discord_not_linked` is not terminal. When the learner links Discord, Arcademy reopens eligible skipped grants or creates missing grants and queues them.

Rate-limited grants should retry with backoff. Permission, hierarchy, and user-not-in-server failures should remain visible until an admin or learner fixes the underlying state and retries.

## Security and Privacy

Discord OAuth tokens are used only during account linking and are not retained after Arcademy stores the Discord user ID and display fields. Bot tokens stay in environment variables or managed secrets and are never stored in project-editable fields.

OAuth uses a state value tied to the current Arcademy session to prevent CSRF. Account linking requires an authenticated Arcademy wallet session, so a Discord identity cannot be attached to an anonymous browser session.

Arcademy stores only the Discord identity fields needed for linking and role sync. Public badge verification pages do not expose Discord usernames or server membership.

Project admins can see role grant statuses for their project but should not see unrelated learner progress or badge data outside their project context.

## Analytics

Add analytics events:

- `discord_connect_started`
- `discord_connected`
- `discord_connect_failed`
- `discord_disconnected`
- `discord_role_rule_created`
- `discord_role_rule_activated`
- `discord_role_grant_queued`
- `discord_role_granted`
- `discord_role_grant_failed`
- `discord_role_grant_retried`

These events should include product, course, badge, guild, role, and failure metadata where available. They should not include OAuth tokens or sensitive Discord API responses.

## Testing

Unit tests should cover:

- role grant eligibility from badge awards
- no grants for draft or paused rules
- no duplicate grants for the same badge award and role rule
- backfill when Discord is linked after badge awards
- status mapping for Discord API errors

Integration tests should cover:

- badge award creates grant jobs for active rules
- linked Discord user receives queued grants
- unlinked Discord user receives a skipped state and later backfill
- project admin cannot manage another project's Discord configuration

Manual QA should cover:

- top-nav Discord reminder states
- project configuration screens
- bot permission check messages
- successful role grant in a test Discord server
- failure when bot role is below the target role

## Implementation Sequence

1. Add Discord data model and migrations.
2. Add Discord OAuth account linking and top-nav reminder.
3. Add project Discord integration and role rule admin screens.
4. Add role grant queueing after badge awards and after Discord linking.
5. Add Discord API client, grant processor, retries, and status mapping.
6. Add profile/admin status views and analytics.
7. Add tests and test-server QA checklist.

## Future Extensions

Discord-first `/verify` can be added later using the same account-linking and backfill systems. Discord Linked Roles can be added later for broad signals such as verified Arcademy learner, earned any badge, or completed a threshold number of courses. Role revocation can also be added later if projects want temporary or expiring educational access, but the first version only grants roles.
