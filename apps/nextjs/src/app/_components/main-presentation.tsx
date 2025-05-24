"use client";

import { Marquee } from "@acme/ui/marquee";

import { ProfileCard } from "~/components/profile-card";
import { useMainChatContext } from "~/context/main-chat-context";

const users = [
    {id: '2sbyS7C0Ne0LMilv4zbKzpBZ1KaPI3WR', name: 'Andrei Tudorache'},
    {id: '7nQIvxYySt6D1eToD4dV41QJfAzswu6j', name: 'Andrew Dorobantu'},
    {id: 'VyVByuQ2fKMDxQx9s3tVXmPEKcd0DngJ', name: 'Andrew Cruceru'},
    {id: '2sbyS7C0Ne0LMilv4zbKzpBZ1KaPI3WR', name: 'Andrei Tudorache'},
    {id: '7nQIvxYySt6D1eToD4dV41QJfAzswu6j', name: 'Andrew Dorobantu'},
    {id: 'VyVByuQ2fKMDxQx9s3tVXmPEKcd0DngJ', name: 'Andrew Cruceru'},
    {id: '2sbyS7C0Ne0LMilv4zbKzpBZ1KaPI3WR', name: 'Andrei Tudorache'},
    {id: '7nQIvxYySt6D1eToD4dV41QJfAzswu6j', name: 'Andrew Dorobantu'},
    {id: 'VyVByuQ2fKMDxQx9s3tVXmPEKcd0DngJ', name: 'Andrew Cruceru'},
]

const prompts = [
    "looking for a designer",
    "musticians growing fast",
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
]

const PromptBox = ({ prompt, onClick }: { prompt: string, onClick: ((message: string) => void) | null }) => {
    return (
        <button key={prompt} className="text-md text-center max-w-80 border py-1 px-3 hover:bg-accent hover:border-primary transition-all" onClick={() => onClick?.(prompt)}>
            {prompt}
        </button>
    )
}

const MainPresentation = () => {
  const { sendMessage } = useMainChatContext();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 w-full px-4">
      <h1 className="text-6xl font-bold text-center max-w-72">find and be found.</h1>
        <Marquee className="w-full">
            {users.map((user) => (
                <ProfileCard key={user.id} profile={user} profileImageDisplay="full" containerClassName="!w-40" />
            ))}
        </Marquee>
        <div className="flex flex-col w-full">
            <Marquee className="w-full" reverse>
                {prompts.slice(0, Math.ceil(prompts.length / 2)).map((prompt) => (
                    <PromptBox key={prompt} prompt={prompt} onClick={sendMessage} />
                ))}
            </Marquee>
            <Marquee className="w-full">
                {prompts.slice(Math.ceil(prompts.length / 2)).map((prompt) => (
                    <PromptBox key={prompt} prompt={prompt} onClick={sendMessage} />
                ))}
            </Marquee>
        </div>
    </div>
  );
};

export default MainPresentation;
