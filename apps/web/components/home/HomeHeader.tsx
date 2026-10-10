import Link from "next/link";
import { Mark } from "./Icons";
export default function HomeHeader() {
  return (
    <header className="site-header">
      <a href="#idea" className="brand" aria-label="Reclaim home">
        <Mark />
        <span>reclaim</span>
      </a>
      <nav aria-label="Main navigation">
        <a href="#building">
          HOW IT WORKS <span>+</span>
        </a>
        <a href="#problem">WHY RECLAIM</a>
        <a href="#contact">THE IDEA</a>
      </nav>
      <Link href="/dashboard" className="header-entry">
        Explore materials
      </Link>
    </header>
  );
}
