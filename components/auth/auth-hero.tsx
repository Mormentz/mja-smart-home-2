import { ShieldCheck, Truck } from "lucide-react";
import heroImage from "@/assets/property-1.jpg";

export function AuthHeroBackground() {
  return (
    <div className="fixed inset-0 -z-10 lg:hidden">
      <img src={heroImage.src} alt="" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/55" />
    </div>
  );
}

export function AuthHeroPanel() {
  return (
    <div className="relative hidden lg:flex lg:w-[46%] xl:w-[48%] shrink-0 overflow-hidden">
      <img src={heroImage.src} alt="Modern home" className="absolute inset-0 h-full w-full object-cover" />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10"
        style={{
          clipPath: "ellipse(120% 100% at 100% 50%)",
        }}
      />
      <div className="relative z-10 flex flex-col justify-end p-10 xl:p-12 text-white w-full">
        <h2 className="font-display text-3xl xl:text-[2.5rem] font-semibold leading-[1.15] max-w-sm">
          Discovering the best home for your life.
        </h2>
        <p className="mt-4 text-sm xl:text-base text-white/80 leading-relaxed max-w-md">
          HomeConnect connects renters, buyers, landlords, agents, and verified artisans in one premium housing ecosystem.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 pb-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-2.5 text-xs font-medium backdrop-blur-sm">
            <ShieldCheck size={14} />
            Verified listings
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-2.5 text-xs font-medium backdrop-blur-sm">
            <Truck size={14} />
            Free tour booking
          </span>
        </div>
      </div>
    </div>
  );
}
