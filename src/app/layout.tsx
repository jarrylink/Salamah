import type { Metadata } from "next";
import { DM_Serif_Display, Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

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
  title: "Salamah School Management System",
  description: "Secure access to the Salamah School Management System.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${dmSerif.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f8fafc] font-sans text-[#1e293b]">{children}</body>
    </html>
  );
}
