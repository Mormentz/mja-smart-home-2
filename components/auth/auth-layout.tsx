import { AuthBrand } from "@/components/auth/auth-brand";
import { AuthHeroBackground, AuthHeroPanel } from "@/components/auth/auth-hero";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-[#E6E1D3] lg:p-8">
      <AuthHeroBackground />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-stretch justify-center lg:min-h-[calc(100vh-4rem)] lg:items-center">
        <div className="flex w-full overflow-hidden bg-white/95 backdrop-blur-md shadow-[0_24px_80px_-20px_rgba(0,0,0,0.18)] lg:min-h-[640px] lg:rounded-[2rem] lg:bg-white lg:backdrop-blur-none">
          <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-14">
            <AuthBrand />
            <div className="max-w-md">
              <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">{title}</h1>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
              <div className="mt-8">{children}</div>
            </div>
          </div>
          <AuthHeroPanel />
        </div>
      </div>
    </div>
  );
}
