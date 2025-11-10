import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fangate.army";
const ogImage =
  "https://res.cloudinary.com/dtamgk7i5/image/upload/v1762777066/fangate_hrnkge.png";

export const metadata: Metadata = {
  title: "FanGate - BTS Fan Verification",
  description: "Verify yourself as ARMY to get access to BTS concert ticketing page.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "FanGate - BTS Fan Verification",
    description:
      "Verify yourself as ARMY to get access to BTS concert ticketing page.",
    url: siteUrl,
    siteName: "FanGate",
    type: "website",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "FanGate - Verified ARMY Access",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FanGate - BTS Fan Verification",
    description:
      "Verify yourself as ARMY to get access to BTS concert ticketing page.",
    images: [ogImage],
  },
  icons: {
    icon: "/fangate-logo.png",
    shortcut: "/fangate-logo.png",
    apple: "/fangate-logo.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
