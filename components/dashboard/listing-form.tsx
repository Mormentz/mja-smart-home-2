"use client";

import { useState } from "react";
import { createListing, deleteListing } from "@/lib/actions/listings";
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
};

export function ListingsManager({ listings }: { listings: Listing[] }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "Add listing"}</Button>
      </div>
      {showForm && <ListingForm onSuccess={() => setShowForm(false)} />}
      {listings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No listings yet. Add your first property.
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <ListingRow key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingRow({ listing }: { listing: Listing }) {
  async function handleDelete() {
    const result = await deleteListing(listing.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Listing deleted");
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft flex flex-wrap items-center justify-between gap-4">
      <div>
        <h3 className="font-display text-lg font-semibold">{listing.title}</h3>
        <p className="text-sm text-muted-foreground">{listing.location}</p>
        <p className="mt-1 text-sm">
          ${listing.price.toLocaleString()} · {listing.type.replace("_", " ")} · {listing.category}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={handleDelete}>
        Delete
      </Button>
    </div>
  );
}

function ListingForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const amenities = String(form.get("amenities") ?? "")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    const result = await createListing({
      id: String(form.get("id")),
      title: String(form.get("title")),
      location: String(form.get("location")),
      price: Number(form.get("price")),
      currency: "$",
      type: String(form.get("type")) as "FOR_SALE" | "FOR_RENT",
      category: String(form.get("category")) as "HOUSE" | "APARTMENT" | "VILLA" | "LOFT" | "TOWNHOUSE" | "PENTHOUSE",
      beds: Number(form.get("beds")),
      baths: Number(form.get("baths")),
      area: Number(form.get("area")),
      image: String(form.get("image")),
      description: String(form.get("description")),
      amenities,
    });

    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Listing created");
    onSuccess();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-border bg-card p-6 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="id">Listing ID (slug)</Label>
          <Input id="id" name="id" placeholder="my-new-listing" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input id="price" name="price" type="number" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <select id="type" name="type" className="w-full h-10 rounded-md border border-input px-3" required>
            <option value="FOR_SALE">For Sale</option>
            <option value="FOR_RENT">For Rent</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select id="category" name="category" className="w-full h-10 rounded-md border border-input px-3" required>
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
          <Input id="beds" name="beds" type="number" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="baths">Baths</Label>
          <Input id="baths" name="baths" type="number" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="area">Area (sq ft)</Label>
          <Input id="area" name="area" type="number" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="image">Image key</Label>
          <Input id="image" name="image" placeholder="property-1.jpg" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amenities">Amenities (comma-separated)</Label>
        <Input id="amenities" name="amenities" placeholder="Gym, Parking, Garden" />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create listing"}
      </Button>
    </form>
  );
}
