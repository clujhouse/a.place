"use client";

import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction } from "react";

interface MainChatContextType {
  sendMessage: ((message: string) => void) | null;
}

const MainChatContext = createContext<MainChatContextType | null>(null);

export function useMainChatContext() {
  const context = useContext(MainChatContext);
  if (!context) {
    throw new Error("useMainChatContext must be used within an MainChatProvider");
  }
  return context;
}

export function MainChatProvider({ children, sendMessage }: { children: ReactNode, sendMessage: ((message: string) => void) }) {
  return (
    <MainChatContext.Provider value={{ sendMessage }}>
      {children}
    </MainChatContext.Provider>
  );
} 