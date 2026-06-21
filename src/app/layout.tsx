import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppRootProvider } from "@/components/app-root-provider";
import { ProvidersLoader } from "@/components/providers-loader";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { logDeploymentWarnings } from "@/lib/env";

logDeploymentWarnings();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Arcademy — Learn the Arcium ecosystem",
    template: "%s · Arcademy",
  },
  description:
    "The official learning platform for the Arcium ecosystem. Take structured courses, pass assessments, and earn recognition tied to your Solana wallet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AppRootProvider>
          <ProvidersLoader>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </ProvidersLoader>
        </AppRootProvider>
      </body>
    </html>
  );
}
