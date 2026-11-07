"use client";

import { Toaster } from "react-hot-toast";
import { PwaProvider } from "@/src/components/PwaSetup";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster position="top-right" />
      <PwaProvider>{children}</PwaProvider>
    </>
  );
}
