import React, { useEffect } from "react";
import { atom, useAtom } from "jotai";
import Confetti from "react-dom-confetti";

import { Button } from "@acme/ui";

const showProfileConfetti = atom(false);
export const useProfileConfetti = () => {
  const [show, setShow] = useAtom(showProfileConfetti);
  return { showConfetti: show, setShowConfetti: setShow };
};

export const ProfileConfetti = () => {
  const { showConfetti, setShowConfetti } = useProfileConfetti();

  useEffect(() => {
    if (showConfetti) {
      setTimeout(() => {
        setShowConfetti(false);
      }, 500);
    }
  }, [setShowConfetti, showConfetti]);

  return (
    <>
      <div className="pointer-events-none fixed bottom-4 right-4 z-50">
        <Confetti
          config={{
            spread: 120,
            startVelocity: 45,
            elementCount: 300,
            dragFriction: 0.1,
            duration: 4000,
            stagger: 2,
            width: "8px",
            height: "8px",
            colors: ["#808080", "#A9A9A9", "#D3D3D3", "#696969", "#C0C0C0"],
          }}
          active={showConfetti}
        />
      </div>
    </>
  );
};
