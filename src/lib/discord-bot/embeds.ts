import "server-only";
import { absoluteUrl } from "@/lib/site";
import { badgeVerificationPath } from "@/lib/paths";
import type { DiscordEmbed } from "@/lib/discord-bot/types";
import { formatGrantStatus, truncateWallet } from "@/lib/discord-bot/utils";

const COLORS = {
  green: 0x57f287,
  orange: 0xfaa61a,
  blurple: 0x5865f2,
  /** Orchid brand-secondary ≈ oklch(0.55 0.14 320) */
  purple: 0xc13d9e,
  grey: 0x95a5a6,
} as const;

export function notLinkedEmbed(profileUrl: string): DiscordEmbed {
  return {
    color: COLORS.orange,
    title: "Connect Discord on Arcademy",
    description:
      "Link your Discord account on Arcademy to view badges, progress, and quiz scores here.",
    fields: [
      {
        name: "How to connect",
        value: `[Open your Arcademy profile](${profileUrl}) and choose **Connect Discord**.`,
      },
    ],
  };
}

export function badgesEmbed(
  awards: {
    badge: { name: string };
    course: { title: string; product: { name: string } };
    verificationSlug: string | null;
  }[],
  profileUrl: string
): DiscordEmbed {
  if (awards.length === 0) {
    return {
      color: COLORS.green,
      title: "Your Arcademy badges",
      description:
        "You have not earned any badges yet. Complete a course on Arcademy to earn one.",
      fields: [
        {
          name: "Get started",
          value: `[Browse courses](${profileUrl.replace("/profile", "/courses")})`,
        },
      ],
      footer: { text: "Earned credentials are stored on Arcademy." },
    };
  }

  const shown = awards.slice(0, 10);
  const lines = shown.map((award) => {
    const verify = award.verificationSlug
      ? `[Verify](${absoluteUrl(badgeVerificationPath(award.verificationSlug))})`
      : "No verification link";
    return `**${award.badge.name}** — ${award.course.product.name} · ${award.course.title}\n${verify}`;
  });

  const embed: DiscordEmbed = {
    color: COLORS.green,
    title: "Your Arcademy badges",
    description: lines.join("\n\n"),
    footer: { text: "Earned credentials are stored on Arcademy." },
  };

  if (awards.length > 10) {
    embed.fields = [
      {
        name: "More",
        value: `+ ${awards.length - 10} more on [Arcademy](${profileUrl}).`,
      },
    ];
  }

  return embed;
}

export function progressEmbed(
  courses: {
    title: string;
    productName: string;
    pct: number;
    completed: boolean;
  }[]
): DiscordEmbed {
  if (courses.length === 0) {
    return {
      color: COLORS.blurple,
      title: "Your course progress",
      description: "You have not started any courses yet.",
    };
  }

  const inProgress = courses.filter((c) => !c.completed && c.pct < 100);
  const completed = courses.filter((c) => c.completed);
  const fields: DiscordEmbed["fields"] = [];

  if (inProgress.length > 0) {
    fields.push({
      name: "In progress",
      value: inProgress
        .slice(0, 8)
        .map((c) => `**${c.title}** (${c.productName}) — ${c.pct}%`)
        .join("\n"),
    });
  }

  if (completed.length > 0) {
    fields.push({
      name: "Completed",
      value: completed
        .slice(0, 8)
        .map((c) => `**${c.title}** (${c.productName})`)
        .join("\n"),
    });
  }

  return {
    color: COLORS.blurple,
    title: "Your course progress",
    description:
      fields.length === 0 ? "No active course progress to show." : undefined,
    fields,
  };
}

export function quizScoresEmbed(
  attempts: {
    score: number;
    passed: boolean;
    submittedAt: Date;
    quiz: {
      course: { title: string; product: { name: string } };
    };
  }[]
): DiscordEmbed {
  if (attempts.length === 0) {
    return {
      color: COLORS.purple,
      title: "Recent quiz scores",
      description: "You have not submitted any quiz attempts yet.",
    };
  }

  return {
    color: COLORS.purple,
    title: "Recent quiz scores",
    description: attempts
      .map((attempt) => {
        const status = attempt.passed ? "Passed" : "Not passed";
        const date = attempt.submittedAt.toISOString().slice(0, 10);
        return `**${attempt.quiz.course.title}** (${attempt.quiz.course.product.name})\n${attempt.score}% — ${status} · ${date}`;
      })
      .join("\n\n"),
  };
}

export function linkStatusEmbed(
  linked: boolean,
  username?: string,
  wallet?: string
): DiscordEmbed {
  if (linked && username && wallet) {
    return {
      color: COLORS.green,
      title: "Arcademy link status",
      description: "Your Discord account is linked to Arcademy.",
      fields: [
        { name: "Discord", value: username, inline: true },
        { name: "Wallet", value: truncateWallet(wallet), inline: true },
      ],
    };
  }

  return {
    color: COLORS.orange,
    title: "Arcademy link status",
    description:
      "Your Discord account is not linked to Arcademy yet. Connect on your profile to sync badges and server roles.",
  };
}

export function verifyBadgeEmbed(
  award: NonNullable<Awaited<ReturnType<typeof import("@/lib/badges").getBadgeAwardByVerificationSlug>>>
): DiscordEmbed {
  const wallet = award.walletAddress
    ? truncateWallet(award.walletAddress)
    : "Not recorded";

  return {
    color: COLORS.green,
    title: `${award.badge.name} — Verified`,
    description: award.badge.description ?? "Arcademy course badge.",
    fields: [
      { name: "Course", value: award.course.title, inline: true },
      { name: "Project", value: award.course.product.name, inline: true },
      {
        name: "Awarded",
        value: award.awardedAt.toISOString().slice(0, 10),
        inline: true,
      },
      { name: "Wallet", value: wallet },
      {
        name: "Verification page",
        value: absoluteUrl(badgeVerificationPath(award.verificationSlug!)),
      },
    ],
  };
}

export function staffLookupEmbed(
  discordUsername: string,
  linked: boolean,
  badges: number,
  inProgress: number,
  completed: number,
  grants: { status: string; ruleName: string }[]
): DiscordEmbed {
  const fields: DiscordEmbed["fields"] = [
    { name: "Arcademy linked", value: linked ? "Yes" : "No", inline: true },
    { name: "Badges earned", value: String(badges), inline: true },
    {
      name: "Course progress",
      value: `${inProgress} in progress · ${completed} completed`,
      inline: true,
    },
  ];

  fields.push({
    name: "Role grants (this server)",
    value:
      grants.length > 0
        ? grants
            .slice(0, 8)
            .map((g) => `**${g.ruleName}** — ${formatGrantStatus(g.status)}`)
            .join("\n")
        : "No grant records for this server.",
  });

  return {
    color: COLORS.blurple,
    title: `Learner lookup — ${discordUsername}`,
    fields,
  };
}

export function staffGrantsEmbed(
  guildName: string,
  grants: {
    id: string;
    status: string;
    discordRoleRule: { unlockLabel: string | null; discordRoleName: string };
    discordAccount: { username: string } | null;
    updatedAt: Date;
  }[]
): DiscordEmbed {
  if (grants.length === 0) {
    return {
      color: COLORS.grey,
      title: `Recent role grants — ${guildName}`,
      description: "No grant records found for this server.",
    };
  }

  return {
    color: COLORS.grey,
    title: `Recent role grants — ${guildName}`,
    description: grants
      .map((grant) => {
        const rule =
          grant.discordRoleRule.unlockLabel ??
          grant.discordRoleRule.discordRoleName;
        const user = grant.discordAccount?.username ?? "Unknown user";
        const date = grant.updatedAt.toISOString().slice(0, 10);
        return `\`${grant.id.slice(0, 8)}…\` **${rule}** — ${user}\n${formatGrantStatus(grant.status)} · ${date}`;
      })
      .join("\n\n"),
  };
}

export function staffBotStatusEmbed(
  integration: {
    guildName: string;
    status: string;
    botInstalled: boolean;
    lastPermissionCheckStatus: string | null;
    lastPermissionCheckAt: Date | null;
    roleRules: { id: string }[];
    product: { name: string };
  },
  permissionOk: boolean | null
): DiscordEmbed {
  return {
    color: COLORS.blurple,
    title: `Bot status — ${integration.guildName}`,
    fields: [
      { name: "Project", value: integration.product.name, inline: true },
      { name: "Integration", value: integration.status, inline: true },
      {
        name: "Bot installed",
        value: integration.botInstalled ? "Yes" : "No",
        inline: true,
      },
      {
        name: "Active role rules",
        value: String(integration.roleRules.length),
        inline: true,
      },
      {
        name: "Last permission check",
        value: integration.lastPermissionCheckAt
          ? integration.lastPermissionCheckAt.toISOString().slice(0, 10)
          : "Never",
        inline: true,
      },
      {
        name: "Can grant roles",
        value:
          permissionOk === null
            ? "Not checked"
            : permissionOk
              ? "Yes"
              : integration.lastPermissionCheckStatus ?? "No",
        inline: true,
      },
    ],
  };
}
