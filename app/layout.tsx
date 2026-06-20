import type { Metadata, Viewport } from "next";
import { TabBar } from "@/components/TabBar";
import { Sidebar } from "@/components/Sidebar";
import { KeyboardInset } from "@/components/KeyboardInset";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marginalia",
  description: "A quiet, private book tracker.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Marginalia",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f2f2f7",
};

// Runs before paint to apply the saved theme, avoiding a light/dark flash.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('marginalia-theme')||'system';var m=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.dataset.theme=m;var c=document.querySelector('meta[name="theme-color"]');if(c)c.setAttribute('content',m==='dark'?'#000000':'#f2f2f7');}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <KeyboardInset />
        <div className="app">
          <Sidebar />
          <div className="main">{children}</div>
          <TabBar />
        </div>
      </body>
    </html>
  );
}
