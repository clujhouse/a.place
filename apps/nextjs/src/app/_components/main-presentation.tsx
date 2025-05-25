"use client";

import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";

import { Marquee } from "@acme/ui/marquee";

import { ProfileCard } from "~/components/profile-card";
import { useCreateChat } from "~/hooks/use-create-chat";

const users = [
  { id: "2sbyS7C0Ne0LMilv4zbKzpBZ1KaPI3WR", name: "Andrei Tudorache" },
  { id: "7nQIvxYySt6D1eToD4dV41QJfAzswu6j", name: "Andrew Dorobantu" },
  { id: "VyVByuQ2fKMDxQx9s3tVXmPEKcd0DngJ", name: "Andrew Cruceru" },
  { id: "gQeDVeP7mtQJPM9ZCYzGMRVIHEkNC854", name: "Kevin" },
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
}: {
  prompt: string;
  onClick: ((message: string) => void) | null;
}) => {
  return (
    <button
      key={prompt}
      className="text-md max-w-80 border px-3 py-1 text-center transition-all hover:border-primary hover:bg-accent"
      onClick={() => onClick?.(prompt)}
    >
      {prompt}
    </button>
  );
};

const MainPresentation = () => {
  const router = useRouter();
  const { createChat } = useCreateChat();

  const handleClick = async (prompt: string) => {
    const chatId = nanoid();
    await createChat(chatId);
    router.push(`/talking-stage/${chatId}?query=${prompt}`);
  };

  return (
    <div className="relative mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 pb-12">
      <h1 className="mb-6 max-w-72 text-center text-6xl font-bold">
        find and be found.
      </h1>
      <Marquee className="w-full [--duration:80s]">
        {users.map((user) => (
          <ProfileCard
            key={user.id}
            profile={user}
            profileImageDisplay="full"
            containerClassName="!w-40"
          />
        ))}
      </Marquee>
      <div className="flex w-full flex-col gap-2">
        <Marquee className="w-full p-0 [--duration:80s] [--gap:0.5rem]" reverse>
          {prompts.slice(0, Math.ceil(prompts.length / 2)).map((prompt) => (
            <PromptBox
              key={prompt}
              prompt={prompt}
              onClick={() => handleClick(prompt)}
            />
          ))}
        </Marquee>
        <Marquee className="w-full p-0 [--duration:80s] [--gap:0.5rem]">
          {prompts.slice(Math.ceil(prompts.length / 2)).map((prompt) => (
            <PromptBox
              key={prompt}
              prompt={prompt}
              onClick={() => handleClick(prompt)}
            />
          ))}
        </Marquee>
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
    </div>
  );
};

export default MainPresentation;
