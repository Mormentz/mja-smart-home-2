"use client";

import { useState } from "react";
import {
  createListing,
  deleteListing,
  updateListing,
} from "@/lib/actions/listings";
import { requestPropertyVerification } from "@/lib/actions/verification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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
  description: string;
  amenities: string[];
  verificationStatus: string;
  tourUrl: string | null;
  neighborhoodId: string | null;
};

type NeighborhoodOption = { id: string; name: string };

export function ListingsManager({
  listings,
  neighborhoods,
}: {
  listings: Listing[];
  neighborhoods: NeighborhoodOption[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
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
          initial={editing}
          onSuccess={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
      {listings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No listings yet. Add your first property.
        </div>
      ) : (
        <div className="space-y-4">
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
        </div>
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
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft flex flex-wrap items-center justify-between gap-4">
      <div>
        <h3 className="font-display text-lg font-semibold">{listing.title}</h3>
        <p className="text-sm text-muted-foreground">{listing.location}</p>
        <p className="mt-1 text-sm">
          ${listing.price.toLocaleString()} · {listing.type.replace("_", " ")} · {listing.category}
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
          Status: {listing.verificationStatus}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {listing.verificationStatus !== "VERIFIED" && listing.verificationStatus !== "PENDING" && (
          <Button variant="secondary" size="sm" onClick={handleVerify}>
            Request verification
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}

function ListingForm({
  onSuccess,
  neighborhoods,
  initial,
}: {
  onSuccess: () => void;
  neighborhoods: NeighborhoodOption[];
  initial: Listing | null;
}) {
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(initial);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const amenities = String(form.get("amenities") ?? "")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

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
      image: String(form.get("image")),
      description: String(form.get("description")),
      amenities,
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
    <form onSubmit={onSubmit} className="rounded-3xl border border-border bg-card p-6 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="id">Listing ID (slug)</Label>
          <Input id="id" name="id" placeholder="my-new-listing" defaultValue={initial?.id} required disabled={isEdit} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={initial?.title} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" defaultValue={initial?.location} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input id="price" name="price" type="number" defaultValue={initial?.price} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <select id="type" name="type" className="w-full h-10 rounded-md border border-input px-3" defaultValue={initial?.type ?? "FOR_SALE"} required>
            <option value="FOR_SALE">For Sale</option>
            <option value="FOR_RENT">For Rent</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select id="category" name="category" className="w-full h-10 rounded-md border border-input px-3" defaultValue={initial?.category ?? "HOUSE"} required>
            <option value="HOUSE">House</option>
            <option value="APARTMENT">Apartment</option>
            <option value="VILLA">Villa</option>
            <option value="LOFT">Loft</option>
            <option value="TOWNHOUSE">Townhouse</option>
            <option value="PENTHOUSE">Penthouse</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="beds">Beds</Label>
          <Input id="beds" name="beds" type="number" defaultValue={initial?.beds ?? 2} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="baths">Baths</Label>
          <Input id="baths" name="baths" type="number" defaultValue={initial?.baths ?? 2} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="area">Area (sq ft)</Label>
          <Input id="area" name="area" type="number" defaultValue={initial?.area ?? 1000} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="image">Image key</Label>
          <Input id="image" name="image" placeholder="property-1.jpg" defaultValue={initial?.image ?? "property-1.jpg"} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tourUrl">Virtual tour URL (embed)</Label>
          <Input id="tourUrl" name="tourUrl" placeholder="https://..." defaultValue={initial?.tourUrl ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="neighborhoodId">Neighborhood</Label>
          <select
            id="neighborhoodId"
            name="neighborhoodId"
            className="w-full h-10 rounded-md border border-input px-3"
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
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={initial?.description} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amenities">Amenities (comma-separated)</Label>
        <Input
          id="amenities"
          name="amenities"
          placeholder="Gym, Parking, Garden"
          defaultValue={initial?.amenities?.join(", ") ?? ""}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : isEdit ? "Update listing" : "Create listing"}
      </Button>
    </form>
  );
}
