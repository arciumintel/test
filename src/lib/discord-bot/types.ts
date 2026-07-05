/** Raw Discord interaction payload (subset used by slash commands). */
export type DiscordInteractionOption = {
  type: number;
  name: string;
  value?: string | number | boolean;
  options?: DiscordInteractionOption[];
};

export type DiscordInteractionMember = {
  user: { id: string; username: string };
  roles?: string[];
  permissions?: string;
};

export type DiscordInteraction = {
  id: string;
  application_id: string;
  token: string;
  type: number;
  guild_id?: string;
  member?: DiscordInteractionMember;
  user?: { id: string; username: string };
  data?: {
    id: string;
    name: string;
    options?: DiscordInteractionOption[];
    resolved?: {
      users?: Record<string, { id: string; username: string; global_name?: string | null }>;
    };
  };
};

/** Discord embed payload (API v10 subset). */
export type DiscordEmbed = {
  title?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
};

export type InteractionReplyPayload = {
  content?: string;
  embeds?: DiscordEmbed[];
};
