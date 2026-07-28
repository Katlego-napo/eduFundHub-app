import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduFund Hub | Past Papers & Bursaries for South African Students",
  description:
    "Access past examination papers, memorandums, the latest bursary opportunities, and career guidance — all in one place for South African students.",
  openGraph: {
    title: "EduFund Hub",
    description:
      "Your gateway to academic success — past papers, bursaries, and study resources.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lexend:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
