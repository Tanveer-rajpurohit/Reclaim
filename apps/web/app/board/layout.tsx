import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BoardProvider } from "../../components/board/Store";
import Shell from "../../components/board/Shell";
import "./board.css";
export const metadata: Metadata = {
  title: "Material board",
  robots: { index: false, follow: false },
};
export default function BoardLayout({ children }: { children: ReactNode }) {
  return (
    <BoardProvider>
      <Shell>{children}</Shell>
    </BoardProvider>
  );
}
