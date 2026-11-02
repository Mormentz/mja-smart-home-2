import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { viewSeekerCv } from "@/lib/actions/job-privacy";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export default async function SecureCvViewerPage({
  params,
}: {
  params: Promise<{ profileId: string }> | { profileId: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { profileId } = await params;
  const result = await viewSeekerCv(profileId);
  if (!result.ok) {
    return (
      <div className="min-h-screen bg-background">
        <Header variant="light" />
        <div className="container-page py-24">
          <h1 className="font-display text-2xl font-semibold">CV access denied</h1>
          <p className="mt-2 text-muted-foreground">{result.error}</p>
        </div>
        <Footer />
      </div>
    );
  }
  if (!result.html) notFound();

  return (
    <div className="min-h-screen bg-background">
      <Header variant="light" />
      <div className="container-page py-16">
        <p className="mb-4 text-xs text-muted-foreground">{result.watermark}</p>
        <p className="mb-6 text-sm font-medium text-amber-700">
          Secure viewer — downloads disabled by default.
        </p>
        <div
          className="prose max-w-none rounded-2xl border bg-card p-6 select-none"
          // Built from platform fields only
          dangerouslySetInnerHTML={{ __html: result.html }}
        />
      </div>
      <Footer />
    </div>
  );
}
