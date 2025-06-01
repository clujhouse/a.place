import { atom } from "jotai";

import type { RouterOutputs } from "@acme/api";

// Auth atoms
export const loginDialogOpenAtom = atom(false);

// House atoms
export const selectedHouseAtom = atom<
  RouterOutputs["house"]["getAll"][number] | null
>(null);
