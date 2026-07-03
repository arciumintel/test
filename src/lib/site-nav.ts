import { getMyPartnerApplicationStatus } from "@/app/actions/partner-application";
import { getManagedProducts } from "@/lib/project-admin";
import { getCurrentUser } from "@/lib/session";

export type NavLink = {
  href: string;
  label: string;
};

export type SiteNavContext = {
  user: Awaited<ReturnType<typeof getCurrentUser>>;
  showPartnerConsole: boolean;
  showBecomePartner: boolean;
  isStaff: boolean;
};

export async function getSiteNavContext(): Promise<SiteNavContext> {
  const user = await getCurrentUser();
  const isStaff = user?.role === "staff_admin";

  const managedProjects =
    user && !isStaff ? await getManagedProducts(user.id, false) : [];
  const showPartnerConsole = isStaff || managedProjects.length > 0;

  const partnerStatus =
    user && !isStaff && !showPartnerConsole
      ? await getMyPartnerApplicationStatus()
      : null;
  const showBecomePartner =
    Boolean(user) &&
    !isStaff &&
    !showPartnerConsole &&
    !partnerStatus?.pendingApplication;

  return { user, showPartnerConsole, showBecomePartner, isStaff };
}

export function getHeaderNavLinks({ user }: SiteNavContext): NavLink[] {
  const links: NavLink[] = [
    { href: "/start", label: "Start" },
    { href: "/courses", label: "Courses" },
    { href: "/products", label: "Projects" },
  ];

  if (user) {
    links.push({ href: "/profile", label: "My learning" });
  }

  return links;
}

export function getFooterLearnLinks(): NavLink[] {
  return [
    { href: "/start", label: "Start" },
    { href: "/courses", label: "Courses" },
    { href: "/products", label: "Projects" },
    { href: "/glossary", label: "Glossary" },
  ];
}

export function getFooterPartnerLinks({
  showPartnerConsole,
  showBecomePartner,
  isStaff,
}: SiteNavContext): NavLink[] {
  const links: NavLink[] = [
    { href: "/partners", label: "Partners" },
    { href: "/partners/docs", label: "Partner handbook" },
  ];

  if (showPartnerConsole) {
    links.push({ href: "/partner-console", label: "Partner console" });
  }
  if (showBecomePartner) {
    links.push({ href: "/partners/apply", label: "Become a partner" });
  }
  if (isStaff) {
    links.push({ href: "/admin", label: "Admin" });
  }

  return links;
}
