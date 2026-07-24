import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dil Se - Find Your Vibe",
  description: "India's coolest dating app for Gen Z. Connect with people nearby and find your perfect match.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const GLOBAL_ANIMATIONS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

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
    will-change: transform, opacity;
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
    <html lang="en" className="bg-[#FAFAF7]">
      <head>
        <meta name="theme-color" content="#FF6B9D" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_ANIMATIONS_CSS }} />
      </head>
      <body className="bg-[#FAFAF7] text-[#1A1A2E] min-h-screen overflow-x-hidden antialiased font-sans selection:bg-[#FF6B9D]/25 selection:text-[#1A1A2E]">
        <div className="animate-page-entry min-h-screen w-full">
          {children}
        </div>
      </body>
    </html>
  );
}
