import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const neue = localFont({
  src: [
    {
      path: "../public/fonts/PPNeueMontreal-Hairline.otf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../public/fonts/PPNeueMontreal-HairlineItalic.otf",
      weight: "100",
      style: "italic",
    },
    {
      path: "../public/fonts/PPNeueMontreal-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/PPNeueMontreal-LightItalic.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/PPNeueMontreal-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/PPNeueMontreal-Italic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/PPNeueMontreal-Semibold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/PPNeueMontreal-SemiboldItalic.otf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../public/fonts/PPNeueMontreal-Extrabold.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../public/fonts/PPNeueMontreal-ExtraboldItalic.otf",
      weight: "800",
      style: "italic",
    },
  ],
  variable: "--font-neue",
  display: "swap",
  preload: false,
});
const book = localFont({
  src: [
    {
      path: "../public/fonts/PPNeueMontrealText-Book.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/PPNeueMontrealText-BookItalic.otf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-book",
  display: "swap",
});
const kode = localFont({
  src: [
    { path: "../public/fonts/KodeMono-Regular.ttf", weight: "400" },
    { path: "../public/fonts/KodeMono-Medium.ttf", weight: "500" },
    { path: "../public/fonts/KodeMono-SemiBold.ttf", weight: "600" },
    { path: "../public/fonts/KodeMono-Bold.ttf", weight: "700" },
  ],
  variable: "--font-kode",
  display: "swap",
  preload: false,
});

const title = "Reclaim | Find a next use for event leftovers";
const description =
  "A marketplace for materials left after events. Connect organisers with people who can reuse boards, props and other items, or collect sorted recyclables.";

export const metadata: Metadata = {
  title: {
    default: title,
    template: "%s | Reclaim",
  },
  description,
  applicationName: "Reclaim",
  openGraph: {
    title,
    description,
    siteName: "Reclaim",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
  robots: {
    index: process.env.NODE_ENV === "production",
    follow: process.env.NODE_ENV === "production",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${neue.variable} ${book.variable} ${kode.variable}`}>
        {children}
      </body>
    </html>
  );
}
