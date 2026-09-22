"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Star, X } from "lucide-react";
import {
  createListing,
  deleteListing,
  updateListing,
} from "@/lib/actions/listings";
import { uploadPropertyImages } from "@/lib/actions/uploads";
import { requestPropertyVerification } from "@/lib/actions/verification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DashboardDataTable,
  DashboardEmptyState,
  DashboardTableCell,
  DashboardTableHead,
  Table,
  TableBody,
  TableHeader,
  TableRow,
} from "@/components/dashboard/dashboard-data-table";
import { resolveImage, imageSrc as propertyImageSrc } from "@/lib/properties";
import { toast } from "sonner";

type AmenityOption = { id: string; name: string; slug: string };

type Listing = {
  id: string;
  title: string;
  location: string;
  price: number;
  type: string;
  category: string;
  beds: number;
  baths: number;
  area: number;
  image: string;
  images?: string[];
  description: string;
  amenities: string[];
  verificationStatus: string;
  tourUrl: string | null;
  neighborhoodId: string | null;
  propertyAmenities?: { amenityId: string; amenity: { id: string; name: string } }[];
};

type NeighborhoodOption = { id: string; name: string };

function thumbSrc(key: string) {
  return propertyImageSrc(resolveImage(key));
}

export function ListingsManager({
  listings,
  neighborhoods,
  amenities,
}: {
  listings: Listing[];
  neighborhoods: NeighborhoodOption[];
  amenities: AmenityOption[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setShowForm((v) => !v);
          }}
        >
          {showForm && !editing ? "Cancel" : "Add listing"}
        </Button>
      </div>
      {showForm && (
        <ListingForm
          neighborhoods={neighborhoods}
          amenities={amenities}
          initial={editing}
          onSuccess={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
      {listings.length === 0 ? (
        <DashboardEmptyState>No listings yet. Add your first property.</DashboardEmptyState>
      ) : (
        <DashboardDataTable>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <DashboardTableHead>Listing</DashboardTableHead>
                <DashboardTableHead>Type</DashboardTableHead>
                <DashboardTableHead className="text-right">Price</DashboardTableHead>
                <DashboardTableHead>Verification</DashboardTableHead>
                <DashboardTableHead className="text-right">Actions</DashboardTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => (
                <ListingRow
                  key={listing.id}
                  listing={listing}
                  onEdit={() => {
                    setEditing(listing);
                    setShowForm(true);
                  }}
                />
              ))}
            </TableBody>
          </Table>
        </DashboardDataTable>
      )}
    </div>
  );
}

function ListingRow({ listing, onEdit }: { listing: Listing; onEdit: () => void }) {
  async function handleDelete() {
    const result = await deleteListing(listing.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Listing deleted");
  }

  async function handleVerify() {
    const result = await requestPropertyVerification(listing.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Verification requested");
  }

  return (
    <TableRow className="border-border/40">
      <DashboardTableCell>
        <div className="flex items-center gap-2.5">
          <img
            src={thumbSrc(listing.image)}
            alt=""
            className="h-9 w-9 rounded-md object-cover shrink-0"
          />
          <div className="min-w-0">
            <p className="font-medium leading-tight truncate">{listing.title}</p>
            <p className="text-[11px] text-muted-foreground truncate">{listing.location}</p>
          </div>
        </div>
      </DashboardTableCell>
      <DashboardTableCell className="text-xs uppercase text-muted-foreground">
        {listing.type.replace("_", " ")} · {listing.category}
      </DashboardTableCell>
      <DashboardTableCell className="text-right tabular-nums font-medium text-primary">
        ${listing.price.toLocaleString()}
      </DashboardTableCell>
      <DashboardTableCell>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
          {listing.verificationStatus}
        </span>
      </DashboardTableCell>
      <DashboardTableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {listing.verificationStatus !== "VERIFIED" &&
              listing.verificationStatus !== "PENDING" && (
                <DropdownMenuItem onClick={handleVerify}>Request verification</DropdownMenuItem>
              )}
            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </DashboardTableCell>
    </TableRow>
  );
}

function ListingForm({
  onSuccess,
  neighborhoods,
  amenities,
  initial,
}: {
  onSuccess: () => void;
  neighborhoods: NeighborhoodOption[];
  amenities: AmenityOption[];
  initial: Listing | null;
}) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [listingId, setListingId] = useState(initial?.id ?? "");
  const initialGallery = useMemo(() => {
    if (!initial) return [] as string[];
    if (initial.images && initial.images.length > 0) return [...initial.images];
    return initial.image ? [initial.image] : [];
  }, [initial]);
  const [gallery, setGallery] = useState<string[]>(initialGallery);
  const [cover, setCover] = useState(initial?.image ?? "");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    initial?.propertyAmenities?.map((pa) => pa.amenityId) ??
      amenities.filter((a) => initial?.amenities?.includes(a.name)).map((a) => a.id) ??
      [],
  );
  const isEdit = Boolean(initial);

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    const id = listingId.trim();
    if (!id || !/^[a-z0-9-]+$/.test(id)) {
      toast.error("Set a valid listing ID before uploading images");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.set("propertyId", id);
    Array.from(files).forEach((f) => fd.append("files", f));
    const result = await uploadPropertyImages(fd);
    setUploading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    const paths = result.paths ?? [];
    setGallery((g) => [...g, ...paths]);
    if (!cover && paths[0]) setCover(paths[0]);
    toast.success(`${paths.length} image(s) uploaded`);
  }

  function removeImage(path: string) {
    setGallery((g) => g.filter((x) => x !== path));
    if (cover === path) {
      setCover((c) => {
        const next = gallery.filter((x) => x !== path);
        return next[0] ?? "";
      });
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (gallery.length === 0 || !cover) {
      toast.error("Add at least one image");
      return;
    }
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const payload = {
      id: String(form.get("id")),
      title: String(form.get("title")),
      location: String(form.get("location")),
      price: Number(form.get("price")),
      currency: "$",
      type: String(form.get("type")) as "FOR_SALE" | "FOR_RENT",
      category: String(form.get("category")) as
        | "HOUSE"
        | "APARTMENT"
        | "VILLA"
        | "LOFT"
        | "TOWNHOUSE"
        | "PENTHOUSE",
      beds: Number(form.get("beds")),
      baths: Number(form.get("baths")),
      area: Number(form.get("area")),
      image: cover,
      images: gallery,
      description: String(form.get("description")),
      amenityIds: selectedAmenities,
      tourUrl: String(form.get("tourUrl") ?? ""),
      neighborhoodId: String(form.get("neighborhoodId") ?? ""),
    };

    const result = isEdit
      ? await updateListing(initial!.id, payload)
      : await createListing(payload);

    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Listing updated" : "Listing created");
    onSuccess();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-border/60 bg-card p-4 space-y-3 shadow-sm">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="id">Listing ID (slug)</Label>
          <Input
            id="id"
            name="id"
            placeholder="my-new-listing"
            value={listingId}
            onChange={(e) => setListingId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            required
            disabled={isEdit}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={initial?.title} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" defaultValue={initial?.location} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">Price</Label>
          <Input id="price" name="price" type="number" defaultValue={initial?.price} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <select id="type" name="type" className="w-full h-9 rounded-md border border-input px-3 text-sm" defaultValue={initial?.type ?? "FOR_SALE"} required>
            <option value="FOR_SALE">For Sale</option>
            <option value="FOR_RENT">For Rent</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <select id="category" name="category" className="w-full h-9 rounded-md border border-input px-3 text-sm" defaultValue={initial?.category ?? "HOUSE"} required>
            <option value="HOUSE">House</option>
            <option value="APARTMENT">Apartment</option>
            <option value="VILLA">Villa</option>
            <option value="LOFT">Loft</option>
            <option value="TOWNHOUSE">Townhouse</option>
            <option value="PENTHOUSE">Penthouse</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="beds">Beds</Label>
          <Input id="beds" name="beds" type="number" defaultValue={initial?.beds ?? 2} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="baths">Baths</Label>
          <Input id="baths" name="baths" type="number" defaultValue={initial?.baths ?? 2} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="area">Area (sq ft)</Label>
          <Input id="area" name="area" type="number" defaultValue={initial?.area ?? 1000} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tourUrl">Virtual tour URL (embed)</Label>
          <Input id="tourUrl" name="tourUrl" placeholder="https://..." defaultValue={initial?.tourUrl ?? ""} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="neighborhoodId">Neighborhood</Label>
          <select
            id="neighborhoodId"
            name="neighborhoodId"
            className="w-full h-9 rounded-md border border-input px-3 text-sm"
            defaultValue={initial?.neighborhoodId ?? ""}
          >
            <option value="">None</option>
            {neighborhoods.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Photos</Label>
        <p className="text-[11px] text-muted-foreground">
          Enter the listing ID first, then upload. Click a star to set the cover image.
        </p>
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={uploading}
          onChange={(e) => {
            void handleUpload(e.target.files);
            e.target.value = "";
          }}
        />
        {gallery.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {gallery.map((path) => (
              <div key={path} className="relative h-20 w-20 rounded-lg overflow-hidden border border-border/60 group">
                <img src={thumbSrc(path)} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  className="absolute top-1 left-1 rounded bg-black/60 p-0.5 text-white"
                  onClick={() => setCover(path)}
                  title="Set as cover"
                >
                  <Star size={12} className={cover === path ? "fill-secondary text-secondary" : ""} />
                </button>
                <button
                  type="button"
                  className="absolute top-1 right-1 rounded bg-black/60 p-0.5 text-white opacity-80 hover:opacity-100"
                  onClick={() => removeImage(path)}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={initial?.description} required />
      </div>

      <div className="space-y-2">
        <Label>Amenities</Label>
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3 max-h-48 overflow-y-auto rounded-lg border border-border/60 p-2">
          {amenities.map((a) => {
            const checked = selectedAmenities.includes(a.id);
            return (
              <label key={a.id} className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setSelectedAmenities((ids) =>
                      checked ? ids.filter((x) => x !== a.id) : [...ids, a.id],
                    )
                  }
                />
                {a.name}
              </label>
            );
          })}
        </div>
      </div>

      <Button type="submit" size="sm" disabled={loading || uploading}>
        {loading ? "Saving..." : isEdit ? "Update listing" : "Create listing"}
      </Button>
    </form>
  );
}
