import type { Metadata } from "next";
import ArtisansJoinPage from "@/components/pages/artisans-join-page";

export const metadata: Metadata = {
  title: "Become an Artisan — HomeConnect",
  description:
    "Join HomeConnect Artisans Hub in Abuja. Get verified, win more jobs, and get paid securely with escrow.",
  openGraph: {
    title: "Become an Artisan — HomeConnect",
    description:
      "Register as a verified professional on HomeConnect Artisans Hub. Currently focusing on Abuja.",
  },
};

export default function Page() {
  return <ArtisansJoinPage />;
}
