import { BrandLogo } from "@/components/brand-logo";

export function LoginBrandMark({ size = "desktop" }) {
  const compact = size === "mobile";

  return <BrandLogo size={compact ? "lg" : "xl"} className="mx-auto lg:mx-0" />;
}
