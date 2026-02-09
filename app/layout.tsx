import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nihar Patel — Software Engineer",
  description:
    "Software engineer specializing in distributed systems, cloud infrastructure, and high-throughput backend services. MS in Software Engineering at San Jose State.",
  keywords: [
    "Nihar Patel",
    "Software Engineer",
    "Distributed Systems",
    "Cloud Infrastructure",
    "Backend",
    "Java",
    "Go",
    "C++",
    "GCP",
    "Kubernetes",
  ],
  authors: [{ name: "Nihar Patel" }],
  openGraph: {
    title: "Nihar Patel — Software Engineer",
    description:
      "Building production-grade distributed systems, cloud-native tooling, and event-driven data pipelines.",
    url: "https://niharpatel.dev",
    siteName: "Nihar Patel",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nihar Patel — Software Engineer",
    description:
      "Distributed systems · Cloud infrastructure · High-throughput backend services",
  },
  metadataBase: new URL("https://niharpatel.dev"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
