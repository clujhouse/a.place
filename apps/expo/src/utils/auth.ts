import * as SecureStore from "expo-secure-store";
import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [
    // expoClient({
    //   scheme: "expo",
    //   storage: SecureStore,
    // }),
  ],
  baseURL: "http://localhost:3000",
});

export const { signIn, signOut } = authClient;
