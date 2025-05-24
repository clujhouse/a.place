import type { Metadata, Viewport } from "next";
import { Raleway } from "next/font/google";

import { cn } from "@acme/ui";
import { SidebarProvider, SidebarTrigger } from "@acme/ui/sidebar";
import { ThemeProvider, ThemeToggle } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import { TRPCReactProvider } from "~/trpc/react";

import "~/app/globals.css";
import "~/app/prosemirror.css";

import { env } from "~/env";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/audio.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { AppSidebar } from "./_components/app-sidebar";
import { AppProvider } from "../context/app-context";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://turbo.t3.gg"
      : "http://localhost:3000",
  ),
  title: "Create T3 Turbo",
  description: "Simple monorepo with shared backend for web & mobile apps",
  openGraph: {
    title: "Create T3 Turbo",
    description: "Simple monorepo with shared backend for web & mobile apps",
    url: "https://create-t3-turbo.vercel.app",
    siteName: "Create T3 Turbo",
  },
  twitter: {
    card: "summary_large_image",
    site: "@jullerino",
    creator: "@jullerino",
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased",
          raleway.variable,
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ThemeToggle />
          <TRPCReactProvider>
            <SidebarProvider>
              <AppProvider>
                <AppSidebar />
                <main className="w-full">
                  {/* <SidebarTrigger /> */}
                  {props.children}
                </main>
              </AppProvider>
            </SidebarProvider>
          </TRPCReactProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
