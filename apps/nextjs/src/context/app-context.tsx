"use client";

import { createContext, useState, useContext, ReactNode } from "react";

interface AppContextType {
  isProfileCreating: boolean;
  setIsProfileCreating: (value: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isProfileCreating, setIsProfileCreating] = useState(false);

  return (
    <AppContext.Provider value={{ isProfileCreating, setIsProfileCreating }}>
      {children}
    </AppContext.Provider>
  );
} 