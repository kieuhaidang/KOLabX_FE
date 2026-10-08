import type { ReactNode } from "react";
import { PublicHeader } from "../layouts/PublicHeader";

export function PublicAiTrialShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080b0b] text-white">
      <PublicHeader theme="dark" />
      <main className="relative overflow-hidden py-8 md:py-12">
        <div className="pointer-events-none absolute -left-40 top-12 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 bottom-12 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
        <div className="container relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
