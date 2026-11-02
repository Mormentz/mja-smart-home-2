import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

/** Legacy /artisans redirects to /services */
export default async function ArtisansRedirectPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const sp = (await searchParams) ?? {};
  const params = new URLSearchParams();
  for (const key of ["category", "subcategory", "state", "area", "q"] as const) {
    const v = one(sp[key]);
    if (v) params.set(key, v);
  }
  const qs = params.toString();
  redirect(qs ? `/services?${qs}` : "/services");
}
