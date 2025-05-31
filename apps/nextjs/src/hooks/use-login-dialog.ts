import { useAtom } from "jotai";
import { usePostHog } from "posthog-js/react";

import { loginDialogOpenAtom } from "~/lib/atoms";

export function useLoginDialog() {
  const [isOpen, setIsOpen] = useAtom(loginDialogOpenAtom);
  const posthog = usePostHog();

  const openLoginDialog = (
    source?: string,
    additionalData?: Record<string, any>,
  ) => {
    setIsOpen(true);

    // Track login dialog opening
    posthog.capture("login_dialog_opened", {
      source: source || "unknown",
      ...additionalData,
    });
  };

  const closeLoginDialog = () => setIsOpen(false);

  return {
    isOpen,
    openLoginDialog,
    closeLoginDialog,
  };
}
