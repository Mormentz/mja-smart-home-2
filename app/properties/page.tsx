import type { Metadata } from "next";
import PropertiesPage from "@/components/pages/properties-page";

export const metadata: Metadata = {
  title: "Properties — HomeConnect",
  description: "Browse verified homes, apartments and villas across every city on HomeConnect.",
  openGraph: {
    title: "Properties — HomeConnect",
    description: "Verified homes, apartments and villas. Move in with confidence.",
  },
};

export default function Page() {
  return <PropertiesPage />;
}
