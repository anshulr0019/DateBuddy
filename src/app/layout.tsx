import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import FloatingNav from "./components/FloatingNav";
import Heartbeat from "./components/Heartbeat";
import PWAInstallBanner from "./components/PWAInstallBanner";
import { NotificationProvider } from "./context/NotificationContext";
import { FilterProvider } from "./context/FilterContext";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Infyn - Find Your Vibe",
  description: "India's coolest dating & connections app for Gen Z. Connect with people nearby and find your perfect match.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Infyn - Find Your Vibe",
    description: "Connect with people nearby and find your vibe.",
    url: "https://infyn.app",
    siteName: "Infyn",
    locale: "en_US",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  // Android: keyboard pushes content up instead of overlaying
  interactiveWidget: "resizes-content",
};

const GLOBAL_ANIMATIONS_CSS = `
  /* Disable mobile tap highlight color */
  * {
    -webkit-tap-highlight-color: transparent;
  }

  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
    background-color: #FAFAF7;
  }

  /* Custom text selection */
  ::selection {
    background: rgba(255, 107, 157, 0.25);
    color: #1A1A2E;
  }

  /* Hide scrollbar utility */
  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }

  .scrollbar-none {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  /* Smooth page transition animation */
  @keyframes pageEntry {
    0% {
      opacity: 0;
      transform: translateY(6px) scale(0.995);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .animate-page-entry {
    animation: pageEntry 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  /* Floating micro animation */
  @keyframes floatSlow {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-4px); }
  }

  .animate-float-slow {
    animation: floatSlow 4s ease-in-out infinite;
  }
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`bg-[#FAFAF7] ${jakarta.variable} ${jakarta.className}`}>
      <head>
        {/* Match system chrome to app background — avoids jarring pink Android status bar */}
        <meta name="theme-color" content="#FAFAF7" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1A1A2E" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_ANIMATIONS_CSS }} />
      </head>
      <body className="bg-[#FAFAF7] text-[#1A1A2E] min-h-screen overflow-x-hidden antialiased font-sans selection:bg-[#FF6B9D]/25 selection:text-[#1A1A2E]">
        <NotificationProvider>
          <FilterProvider>
            <main className="min-h-screen w-full">
              {children}
            </main>
            <FloatingNav />
            <PWAInstallBanner />
            <Heartbeat />
          </FilterProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
