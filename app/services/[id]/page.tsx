import { redirect } from "next/navigation";

export default async function ServiceProfileRedirect({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const { id } = await params;
  redirect(`/artisans/${id}`);
}
