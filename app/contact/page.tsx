import type { Metadata } from "next";
import ContactPage from "@/components/pages/contact-page";

export const metadata: Metadata = {
  title: "Contact — HomeConnect",
  description: "Get in touch with the HomeConnect team — support, partnerships, press.",
  openGraph: {
    title: "Contact — HomeConnect",
    description: "We'd love to hear from you. Reach out anytime.",
  },
};

export default function Page() {
  return <ContactPage />;
}
