"use client";

import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAreas, getLgas, NIGERIA_STATES } from "@/lib/geo/nigeria-states";

export type LocationValues = {
  stateCode: string;
  lgaName: string;
  areaName: string;
  lat: number | null;
  lng: number | null;
};

type Props = {
  value: LocationValues;
  onChange: (next: LocationValues) => void;
};

export function NigeriaLocationFields({ value, onChange }: Props) {
  const lgas = useMemo(() => getLgas(value.stateCode), [value.stateCode]);
  const areas = useMemo(
    () => (value.stateCode && value.lgaName ? getAreas(value.stateCode, value.lgaName) : []),
    [value.stateCode, value.lgaName],
  );

  async function useMyLocation() {
    if (!navigator.geolocation) {
      window.alert("Geolocation is not supported in this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                Accept: "application/json",
              },
            },
          );
          const data = (await res.json()) as {
            address?: {
              state?: string;
              city?: string;
              town?: string;
              suburb?: string;
              county?: string;
            };
          };
          const addr = data.address ?? {};
          const stateHint = (addr.state ?? "").toLowerCase();
          const matchedState =
            NIGERIA_STATES.find(
              (s) =>
                stateHint.includes(s.name.toLowerCase().split("(")[0]!.trim()) ||
                (stateHint.includes("abuja") && s.code === "FC") ||
                (stateHint.includes("federal capital") && s.code === "FC"),
            ) ?? NIGERIA_STATES[0]!;

          const place =
            addr.suburb || addr.town || addr.city || addr.county || "Other / Nearby";
          const lgaList = getLgas(matchedState.code);
          const lga =
            lgaList.find((l) => place.toLowerCase().includes(l.name.toLowerCase())) ||
            lgaList[0]!;
          const areaList = getAreas(matchedState.code, lga.name);
          const area =
            areaList.find((a) => a.toLowerCase().includes(place.toLowerCase())) ||
            areaList[0] ||
            "Other / Nearby";

          onChange({
            stateCode: matchedState.code,
            lgaName: lga.name,
            areaName: area,
            lat: latitude,
            lng: longitude,
          });
        } catch {
          onChange({
            ...value,
            lat: latitude,
            lng: longitude,
          });
        }
      },
      () => window.alert("Could not read your location. Pick State / LGA / Area manually."),
      { enableHighAccuracy: false, timeout: 12000 },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Nigerian service location</p>
        <Button type="button" size="sm" variant="secondary" onClick={useMyLocation}>
          Use my location
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="state">State</Label>
        <select
          id="state"
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          value={value.stateCode}
          onChange={(e) =>
            onChange({
              stateCode: e.target.value,
              lgaName: "",
              areaName: "",
              lat: value.lat,
              lng: value.lng,
            })
          }
          required
        >
          <option value="">Select state</option>
          {NIGERIA_STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lga">LGA</Label>
        <select
          id="lga"
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          value={value.lgaName}
          onChange={(e) =>
            onChange({
              ...value,
              lgaName: e.target.value,
              areaName: "",
            })
          }
          required
          disabled={!value.stateCode}
        >
          <option value="">Select LGA</option>
          {lgas.map((l) => (
            <option key={l.name} value={l.name}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="area">Area / estate</Label>
        {areas.length > 1 ? (
          <select
            id="area"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            value={value.areaName}
            onChange={(e) => onChange({ ...value, areaName: e.target.value })}
            required
            disabled={!value.lgaName}
          >
            <option value="">Select area</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        ) : (
          <Input
            id="area"
            value={value.areaName}
            onChange={(e) => onChange({ ...value, areaName: e.target.value })}
            placeholder="Neighbourhood or estate"
            required
            disabled={!value.lgaName}
          />
        )}
      </div>

      {value.lat != null && value.lng != null && (
        <p className="text-xs text-muted-foreground">
          Coords saved: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      )}
    </div>
  );
}
