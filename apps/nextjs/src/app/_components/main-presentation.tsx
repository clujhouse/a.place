"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { usePostHog } from "posthog-js/react";

import { authClient } from "@acme/auth/client";
import { Marquee } from "@acme/ui/marquee";

import { ProfileCard } from "~/components/profile-card";
import { useCreateChat } from "~/hooks/use-create-chat";

const users = [
  { id: "2sbyS7C0Ne0LMilv4zbKzpBZ1KaPI3WR" },
  { id: "7nQIvxYySt6D1eToD4dV41QJfAzswu6j" },
  { id: "gikUGiW6PhsjlWBFQVhVV81VdvxWhlpj" },

  { id: "VyVByuQ2fKMDxQx9s3tVXmPEKcd0DngJ" },
  { id: "pohbBNnAq8ek4OsLXUuyDlW6AJiOeXi6" },

  { id: "gQeDVeP7mtQJPM9ZCYzGMRVIHEkNC854" },
];

const prompts = [
  "looking for a designer",
  "musicians growing fast",
  "great software engineers",
  "amazing product managers for growth",
  "looking for a marketer",
  "seeking talented videographers",
  "need experienced copywriters",
  "searching for data scientists",
  "hiring frontend developers",
  "want creative illustrators",
  "looking for content creators",
  "need UX researchers",
  "seeking social media experts",
  "recruiting mobile developers",
  "want passionate photographers",
  "who is making short form content?",
  "need a producer for my album",
];

const PromptBox = ({
  prompt,
  onClick,
  isAuthenticated,
}: {
  prompt: string;
  onClick: ((message: string) => void) | null;
  isAuthenticated: boolean;
}) => {
  const posthog = usePostHog();

  const handleClick = () => {
    // Track prompt click
    posthog.capture("homepage_prompt_clicked", {
      prompt_text: prompt,
      prompt_length: prompt.length,
      is_authenticated: isAuthenticated,
      source: "homepage_marquee",
    });

    onClick?.(prompt);
  };

  return (
    <button
      key={prompt}
      className={`text-md max-w-80 border px-3 py-1 text-center transition-all hover:border-primary hover:bg-accent ${
        isAuthenticated ? "cursor-pointer" : "cursor-pointer opacity-90"
      }`}
      onClick={handleClick}
      title={!isAuthenticated ? "Login required to search" : undefined}
    >
      {prompt}
    </button>
  );
};

// Custom Scrollable Marquee Component
const ScrollableMarquee = ({
  children,
  className = "",
  reverse = false,
  speed = "100s",
}: {
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
  speed?: string;
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isAnimationPaused, setIsAnimationPaused] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const animationRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsAnimationPaused(true);
    setStartX(e.pageX - (containerRef.current?.offsetLeft || 0));
    setScrollLeft(containerRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (containerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (containerRef.current) {
      containerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Resume animation after a short delay
    if (animationRef.current) clearTimeout(animationRef.current);
    animationRef.current = setTimeout(() => setIsAnimationPaused(false), 1000);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setIsAnimationPaused(true);
    if (containerRef.current) {
      containerRef.current.scrollLeft += e.deltaY;
    }
    // Resume animation after a short delay
    if (animationRef.current) clearTimeout(animationRef.current);
    animationRef.current = setTimeout(() => setIsAnimationPaused(false), 1000);
  };

  React.useEffect(() => {
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, []);

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <div
        ref={containerRef}
        className="scrollbar-hide flex cursor-grab overflow-x-auto active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          ["--duration" as any]: speed,
          ["--gap" as any]: "1rem",
        }}
      >
        <div
          className={`flex shrink-0 gap-4 ${
            isAnimationPaused ? "" : "animate-marquee"
          } ${reverse ? "[animation-direction:reverse]" : ""}`}
          style={{
            animationPlayState: isAnimationPaused ? "paused" : "running",
          }}
        >
          {children}
        </div>
        {/* Duplicate for seamless loop */}
        <div
          className={`flex shrink-0 gap-4 ${
            isAnimationPaused ? "" : "animate-marquee"
          } ${reverse ? "[animation-direction:reverse]" : ""}`}
          style={{
            animationPlayState: isAnimationPaused ? "paused" : "running",
          }}
        >
          {children}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent"></div>
    </div>
  );
};

const MainPresentation = () => {
  const router = useRouter();
  const { createChat } = useCreateChat();
  const { data: session } = authClient.useSession();
  const posthog = usePostHog();

  const handleClick = async (prompt: string) => {
    // Check if user is logged in
    if (!session?.user) {
      posthog.capture("homepage_redirect_to_login", {
        prompt_text: prompt,
        source: "unauthenticated_prompt_click",
      });

      router.push("/login");
      return;
    }

    posthog.capture("homepage_chat_creation_started", {
      prompt_text: prompt,
      prompt_length: prompt.length,
      source: "homepage_prompt",
    });

    const chatId = nanoid();
    await createChat(chatId);
    router.push(`/talking-stage/${chatId}?query=${prompt}`);
  };

  // Track homepage view
  React.useEffect(() => {
    posthog.capture("homepage_viewed", {
      is_authenticated: !!session?.user,
      source: "main_presentation",
    });
  }, [session, posthog]);

  return (
    <div className="relative mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 pb-12">
      <h1 className="mb-6 max-w-72 text-center text-6xl font-bold">
        find and be found.
      </h1>
      <ScrollableMarquee>
        {users.map((user) => (
          <ProfileCard
            key={user.id}
            profileId={user.id}
            profileImageDisplay="full"
            containerClassName="!w-40"
          />
        ))}
      </ScrollableMarquee>
      <div className="flex w-full flex-col gap-2">
        <ScrollableMarquee reverse>
          {prompts.slice(0, Math.ceil(prompts.length / 2)).map((prompt) => (
            <PromptBox
              key={prompt}
              prompt={prompt}
              onClick={() => handleClick(prompt)}
              isAuthenticated={!!session?.user}
            />
          ))}
        </ScrollableMarquee>
        <ScrollableMarquee>
          {prompts.slice(Math.ceil(prompts.length / 2)).map((prompt) => (
            <PromptBox
              key={prompt}
              prompt={prompt}
              onClick={() => handleClick(prompt)}
              isAuthenticated={!!session?.user}
            />
          ))}
        </ScrollableMarquee>
      </div>
    </div>
  );
};

export default MainPresentation;
