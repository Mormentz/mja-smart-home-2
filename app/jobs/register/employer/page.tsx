"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ensureEmployerProfile, saveEmployerRegistration, uploadEmployerIdDocument } from "@/lib/actions/employer";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function EmployerRegisterPage() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<"BUSINESS" | "INDIVIDUAL">("INDIVIDUAL");
  const [hcId, setHcId] = useState<string>("");
  const [hasId, setHasId] = useState(false);

  useEffect(() => {
    ensureEmployerProfile(kind).then((p) => {
      setHcId(p.hcId);
      setHasId(Boolean(p.authorizedRepIdUrl));
    });
  }, [kind]);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-ink text-ink-foreground">
        <Header variant="dark" />
        <div className="container-page pb-10 pt-32">
          <p className="text-sm uppercase tracking-[0.2em] text-ink-foreground/65">Jobs</p>
          <h1 className="mt-3 font-display text-3xl font-semibold">Employer registration</h1>
          <p className="mt-2 text-ink-foreground/75">
            Verified employers can post vacancies and request contact. ID:{" "}
            <span className="font-mono text-success">{hcId || "…"}</span>
          </p>
          <Link href="/jobs" className="mt-4 inline-block text-sm text-success underline-offset-4 hover:underline">
            ← Back to Jobs hub
          </Link>
        </div>
      </div>
      <div className="container-page py-10">
        <form
          className="mx-auto max-w-xl space-y-4 rounded-2xl border bg-card p-6"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const res = await saveEmployerRegistration({
                kind,
                companyName: String(fd.get("companyName") || "") || undefined,
                cacNumber: String(fd.get("cacNumber") || "") || undefined,
                businessAddress: String(fd.get("businessAddress") || "") || undefined,
                officialEmail: String(fd.get("officialEmail") || "") || undefined,
                phone: String(fd.get("phone") || "") || undefined,
                authorizedRepName: String(fd.get("authorizedRepName") || "") || undefined,
                fullName: String(fd.get("fullName") || "") || undefined,
                generalLocation: String(fd.get("generalLocation") || "") || undefined,
                natureOfEmployment: String(fd.get("natureOfEmployment") || "") || undefined,
              });
              if (!res.ok) return;
              const idFile = fd.get("authorizedRepIdFile");
              if (idFile instanceof File && idFile.size > 0) {
                const up = new FormData();
                up.set("file", idFile);
                const uploaded = await uploadEmployerIdDocument(up);
                if (!uploaded.ok) {
                  toast.error(`ID upload failed: ${uploaded.error}`);
                  return;
                }
              }
              toast.success("Submitted for verification");
              router.push("/dashboard/employment");
            });
          }}
        >
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" checked={kind === "INDIVIDUAL"} onChange={() => setKind("INDIVIDUAL")} />
              Individual
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={kind === "BUSINESS"} onChange={() => setKind("BUSINESS")} />
              Business
            </label>
          </div>
          {kind === "BUSINESS" ? (
            <>
              <Field name="companyName" label="Company name" required />
              <Field name="cacNumber" label="CAC registration number" required />
              <div className="space-y-2">
                <Label htmlFor="businessAddress">Business address</Label>
                <Textarea id="businessAddress" name="businessAddress" required />
              </div>
              <Field name="officialEmail" label="Official email" type="email" required />
              <Field name="phone" label="Phone" required />
              <Field name="authorizedRepName" label="Authorized representative" required />
              <IdUploadField label="Authorized representative ID" hasExisting={hasId} />
            </>
          ) : (
            <>
              <Field name="fullName" label="Full name" required />
              <Field name="phone" label="Phone" required />
              <Field name="officialEmail" label="Email" type="email" required />
              <Field name="generalLocation" label="General location" required />
              <Field name="natureOfEmployment" label="Nature of employment" required />
              <IdUploadField label="Government-issued ID" hasExisting={hasId} />
            </>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Submit for verification"}
          </Button>
        </form>
      </div>
      <Footer />
    </div>
  );
}

function IdUploadField({ label, hasExisting }: { label: string; hasExisting: boolean }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="authorizedRepIdFile">{label}</Label>
      <Input
        id="authorizedRepIdFile"
        name="authorizedRepIdFile"
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        required={!hasExisting}
      />
      <p className="text-xs text-muted-foreground">
        {hasExisting ? "An ID is on file. Upload a new one to replace it. " : ""}
        NIN slip, passport, driver&apos;s licence or voter&apos;s card (image or PDF). Used for verification only — never
        shown publicly.
      </p>
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
