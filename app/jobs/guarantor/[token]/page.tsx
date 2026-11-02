import { GuarantorConfirmForm } from "@/components/jobs/guarantor-confirm-form";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export default async function GuarantorInvitePage({
  params,
}: {
  params: Promise<{ token: string }> | { token: string };
}) {
  const { token } = await params;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-ink text-ink-foreground">
        <Header variant="dark" />
        <div className="container-page pb-10 pt-32">
          <h1 className="font-display text-3xl font-semibold">Guarantor / reference confirmation</h1>
          <p className="mt-2 max-w-xl text-ink-foreground/75">
            Confirming your relationship does not make you financially liable for the applicant&apos;s actions.
          </p>
        </div>
      </div>
      <div className="container-page py-10">
        <GuarantorConfirmForm token={token} />
      </div>
      <Footer />
    </div>
  );
}
