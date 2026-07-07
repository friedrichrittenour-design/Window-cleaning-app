export type ServiceTier = "basic" | "plus_tracks" | "premium";
export type CleaningType = "exterior" | "interior_exterior";

export const SERVICE_TIERS: {
  id: ServiceTier;
  label: string;
  description: string;
}[] = [
  {
    id: "basic",
    label: "Basic",
    description: "Window cleaning only.",
  },
  {
    id: "plus_tracks",
    label: "Plus Tracks",
    description: "Window cleaning + track cleaning.",
  },
  {
    id: "premium",
    label: "Premium",
    description:
      "Window cleaning + debris removal + hard water stain removal + track cleaning.",
  },
];

export interface PricingConfig {
  small: number;
  medium: number;
  large: number;
  interiorMultiplier: number;
  storySurchargePerLevel: number;
  tiers: Record<ServiceTier, number>;
  screensFee: number;
  minimumJobPrice: number;
}

export const DEFAULT_PRICING: PricingConfig = {
  small: 8,
  medium: 12,
  large: 18,
  interiorMultiplier: 1.6,
  storySurchargePerLevel: 15,
  tiers: {
    basic: 0,
    plus_tracks: 20,
    premium: 45,
  },
  screensFee: 25,
  minimumJobPrice: 89,
};

export interface QuoteInput {
  windowCounts: { small: number; medium: number; large: number };
  stories: number;
  cleaningType: CleaningType;
  serviceTier: ServiceTier;
  addScreens: boolean;
}

export interface QuoteResult {
  low: number;
  high: number;
  breakdown: {
    windows: number;
    interiorSurcharge: number;
    storySurcharge: number;
    tierFee: number;
    screensFee: number;
    subtotal: number;
    minimumApplied: boolean;
  };
}

function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function calculateQuote(
  input: QuoteInput,
  pricing: PricingConfig = DEFAULT_PRICING
): QuoteResult {
  const { small, medium, large } = input.windowCounts;

  const windowsBase =
    small * pricing.small + medium * pricing.medium + large * pricing.large;

  const interiorSurcharge =
    input.cleaningType === "interior_exterior"
      ? windowsBase * (pricing.interiorMultiplier - 1)
      : 0;

  const storySurcharge =
    Math.max(0, input.stories - 1) * pricing.storySurchargePerLevel;

  const tierFee = pricing.tiers[input.serviceTier];
  const screensFee = input.addScreens ? pricing.screensFee : 0;

  const rawSubtotal =
    windowsBase + interiorSurcharge + storySurcharge + tierFee + screensFee;

  const minimumApplied = rawSubtotal < pricing.minimumJobPrice;
  const subtotal = minimumApplied ? pricing.minimumJobPrice : rawSubtotal;

  const low = roundToNearest(subtotal * 0.9, 5);
  const high = roundToNearest(subtotal * 1.15, 5);

  return {
    low,
    high,
    breakdown: {
      windows: windowsBase,
      interiorSurcharge,
      storySurcharge,
      tierFee,
      screensFee,
      subtotal,
      minimumApplied,
    },
  };
}
