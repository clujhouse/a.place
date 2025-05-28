import type { Metadata, Viewport } from "next";
import { Raleway } from "next/font/google";

import { cn } from "@acme/ui";
import { SidebarProvider } from "@acme/ui/sidebar";
import { ThemeProvider, ThemeToggle } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import { TRPCReactProvider } from "~/trpc/react";
import { PostHogProvider } from "../components/PostHogProvider";

import "~/app/globals.css";
import "~/app/prosemirror.css";

import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { env } from "~/env";
import { OnboardingWrapper } from "../components/onboarding-wrapper";
import { AppProvider } from "../context/app-context";
import { AppSidebar } from "./_components/app-sidebar";
import { HamburgerMenu } from "./_components/hamburger-menu";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://turbo.t3.gg"
      : "http://localhost:3000",
  ),
  title: "a.place",
  description:
    "a.place is a new spot on the internet for builders, makers, & creators to find and be found by the right group of ppl. any idea goes. a hip-hop album, short film, a novel, some indie software, a youtube channel — whatever.",
  icons: [{ rel: "icon", url: "/" }],
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
        <PostHogProvider>
          <ThemeProvider
            disableTransitionOnChange
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            <ThemeToggle />
            <TRPCReactProvider>
              <NuqsAdapter>
                <SidebarProvider>
                  <AppProvider>
                    <OnboardingWrapper>
                      <AppSidebar />
                      <HamburgerMenu />
                      <main className="h-dvh w-full pt-12 md:pt-0">
                        {/* <SidebarTrigger /> */}
                        {props.children}
                      </main>
                    </OnboardingWrapper>
                  </AppProvider>
                </SidebarProvider>
              </NuqsAdapter>
            </TRPCReactProvider>
            <Toaster />
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
