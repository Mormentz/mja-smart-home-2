"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveRentalCustomer } from "@/lib/actions/equipment-rentals";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RentalCustomerRegisterPage() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-ink text-ink-foreground">
        <Header variant="dark" />
        <div className="container-page pb-10 pt-32">
          <h1 className="font-display text-3xl font-semibold">Rental customer registration</h1>
          <p className="mt-2 text-ink-foreground/75">
            Verification is proportionate to equipment value — renting a chair is not the same as a pro camera.
          </p>
        </div>
      </div>
      <div className="container-page py-10">
        <form
          className="mx-auto max-w-md space-y-4 rounded-2xl border p-6"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            start(async () => {
              await saveRentalCustomer({
                fullName: String(fd.get("fullName")),
                phone: String(fd.get("phone")),
                whatsapp: String(fd.get("whatsapp") || "") || undefined,
                email: String(fd.get("email")),
                dateOfBirth: String(fd.get("dateOfBirth") || "") || undefined,
                generalLocation: String(fd.get("generalLocation") || "") || undefined,
                businessName: String(fd.get("businessName") || "") || undefined,
              });
              toast.success("Customer profile saved");
              router.push("/rentals/browse");
            });
          }}
        >
          <Field name="fullName" label="Full name" required />
          <Field name="phone" label="Phone" required />
          <Field name="whatsapp" label="WhatsApp" />
          <Field name="email" label="Email" type="email" required />
          <Field name="dateOfBirth" label="Date of birth" type="date" />
          <Field name="generalLocation" label="General location" />
          <Field name="businessName" label="Business name (if applicable)" />
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Continue"}
          </Button>
        </form>
      </div>
      <Footer />
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} />
    </div>
  );
}
