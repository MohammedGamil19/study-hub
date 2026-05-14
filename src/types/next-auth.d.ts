import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isPremium: boolean;
      language: string;
    } & DefaultSession["user"];
  }
}
