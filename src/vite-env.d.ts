/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly BASE_URL: string;
    readonly CLERK_PUBLISHABLE_KEY: string;
  }
}
