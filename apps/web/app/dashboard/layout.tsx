import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BoardProvider } from "@/components/marketplace/Store";
import Shell from "@/components/marketplace/Shell";
export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};
export default function BoardLayout({ children }: { children: ReactNode }) {
  return (
    <BoardProvider>
      <Shell>{children}</Shell>
    </BoardProvider>
  );
}
