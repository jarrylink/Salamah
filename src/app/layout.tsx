import type { Metadata } from "next";
import { DM_Serif_Display, Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { brand } from "@/config/brand";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Salamah International School · Katsina, Nigeria",
  description: "Official portal of Salamah International School, Katsina. Cambridge British & Nigerian curriculum.",
  icons: {
    icon: [
      { url: brand.assets.favicon, type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: brand.assets.favicon,
    apple: brand.assets.favicon,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${dmSerif.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" type="image/png" href={brand.assets.favicon} />
        <link rel="icon" type="image/png" href="/icon.png" />
        <link rel="shortcut icon" href={brand.assets.favicon} />
        <link rel="apple-touch-icon" href={brand.assets.favicon} />
      </head>
      <body className="min-h-full bg-[#020b14] font-sans text-slate-100">{children}</body>
    </html>
  );
}
