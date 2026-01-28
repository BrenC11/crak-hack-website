import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "CRAK HACK",
  description: "CRAK HACK - A short film experience"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-void">
      <body
        className={spaceGrotesk.className}
        // Fallback colors in case CSS is blocked/not yet loaded.
        style={{ backgroundColor: "#050608", color: "#dfe9ff" }}
      >
        {children}
      </body>
    </html>
  );
}
