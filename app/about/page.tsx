import type { Metadata } from "next";
import AboutPage from "@/components/pages/about-page";

export const metadata: Metadata = {
  title: "About — HomeConnect",
  description:
    "We're building the housing ecosystem the world actually needs — verified, connected, human.",
  openGraph: {
    title: "About — HomeConnect",
    description: "Meet the team building the housing platform for the way you actually live.",
  },
};

export default function Page() {
  return <AboutPage />;
}
