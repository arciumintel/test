import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function partnerDocsBaseOptions(): BaseLayoutProps {
  return {
    nav: {
      enabled: false,
    },
    links: [
      {
        type: "main",
        text: "Apply",
        url: "/partners/apply",
      },
      {
        type: "main",
        text: "Partner console",
        url: "/partner-console",
      },
    ],
    searchToggle: {
      enabled: true,
    },
    themeSwitch: {
      enabled: true,
      mode: "light-dark-system",
    },
  };
}
