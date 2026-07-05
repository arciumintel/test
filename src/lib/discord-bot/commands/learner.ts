import "server-only";
import { getBadgeAwardByVerificationSlug } from "@/lib/badges";
import {
  badgesEmbed,
  linkStatusEmbed,
  notLinkedEmbed,
  progressEmbed,
  quizScoresEmbed,
  verifyBadgeEmbed,
} from "@/lib/discord-bot/embeds";
import { requireLinkedUser } from "@/lib/discord-bot/permissions";
import {
  getBadgesForUser,
  getQuizAttemptsForUser,
  resolveArcademyUserWithDiscord,
} from "@/lib/discord-bot/queries";
import type {
  DiscordInteraction,
  InteractionReplyPayload,
} from "@/lib/discord-bot/types";
import {
  getDiscordUserId,
  getOptionString,
  profileConnectUrl,
} from "@/lib/discord-bot/utils";
import { getLearnerCourseProgressList } from "@/lib/learner-progress";

export async function handleBadges(
  interaction: DiscordInteraction
): Promise<InteractionReplyPayload> {
  const profileUrl = profileConnectUrl();
  const discordUserId = getDiscordUserId(interaction);
  const linked = await requireLinkedUser(discordUserId);
  if (!linked.ok) {
    return { embeds: [notLinkedEmbed(profileUrl)] };
  }

  const awards = await getBadgesForUser(linked.user.id);
  return { embeds: [badgesEmbed(awards, profileUrl)] };
}

export async function handleProgress(
  interaction: DiscordInteraction
): Promise<InteractionReplyPayload> {
  const profileUrl = profileConnectUrl();
  const discordUserId = getDiscordUserId(interaction);
  const linked = await requireLinkedUser(discordUserId);
  if (!linked.ok) {
    return { embeds: [notLinkedEmbed(profileUrl)] };
  }

  const courses = await getLearnerCourseProgressList(linked.user.id);
  return {
    embeds: [
      progressEmbed(
        courses.map((course) => ({
          title: course.title,
          productName: course.productName,
          pct: course.pct,
          completed: course.completed,
        }))
      ),
    ],
  };
}

export async function handleQuizScores(
  interaction: DiscordInteraction
): Promise<InteractionReplyPayload> {
  const profileUrl = profileConnectUrl();
  const discordUserId = getDiscordUserId(interaction);
  const linked = await requireLinkedUser(discordUserId);
  if (!linked.ok) {
    return { embeds: [notLinkedEmbed(profileUrl)] };
  }

  const attempts = await getQuizAttemptsForUser(linked.user.id, 5);
  return { embeds: [quizScoresEmbed(attempts)] };
}

export async function handleLinkStatus(
  interaction: DiscordInteraction
): Promise<InteractionReplyPayload> {
  const discordUserId = getDiscordUserId(interaction);
  const account = await resolveArcademyUserWithDiscord(discordUserId);

  if (!account) {
    return {
      embeds: [linkStatusEmbed(false)],
      content: `Connect on Arcademy: ${profileConnectUrl()}`,
    };
  }

  return {
    embeds: [
      linkStatusEmbed(true, account.username, account.user.walletAddress),
    ],
  };
}

export async function handleVerify(
  interaction: DiscordInteraction
): Promise<InteractionReplyPayload> {
  const slug = getOptionString(interaction.data?.options, "slug")?.trim();
  if (!slug) {
    return { content: "Please provide a verification slug." };
  }

  const award = await getBadgeAwardByVerificationSlug(slug);
  if (!award || !award.verificationSlug) {
    return {
      content: "No verified badge found for that slug. Check the link on Arcademy.",
    };
  }

  if (award.badge.status !== "published" || award.course.status !== "published") {
    return { content: "This badge verification is not publicly available." };
  }

  return { embeds: [verifyBadgeEmbed(award)] };
}
