import type { Metadata } from "next";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans-family",
  weight: ["300", "400", "500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display-family",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "HomeConnect — Find. Connect. Move. Live.",
  description:
    "HomeConnect is the premium housing ecosystem connecting renters, buyers, landlords, agents and verified artisans.",
  authors: [{ name: "HomeConnect" }],
  openGraph: {
    title: "HomeConnect — Find. Connect. Move. Live.",
    description:
      "The housing ecosystem for renters, buyers, landlords, agents and artisans.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/brand/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/brand/favicon-48.png", type: "image/png", sizes: "48x48" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${plusJakarta.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <AuthSessionProvider>{children}</AuthSessionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
