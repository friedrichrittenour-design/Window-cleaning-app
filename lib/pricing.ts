export type ServiceId = "window_cleaning" | "gutter_cleaning" | "house_washing";
export type ServiceTier = "basic" | "plus_tracks" | "premium";
export type CleaningType = "exterior" | "interior_exterior";
export type ConditionLevel = "light" | "moderate" | "heavy";

export const SERVICES: { id: ServiceId; label: string; description: string }[] = [
  {
    id: "window_cleaning",
    label: "Window Cleaning",
    description: "Streak-free interior & exterior window washing.",
  },
  {
    id: "gutter_cleaning",
    label: "Gutter Cleaning",
    description: "Debris removal and flush-out for gutters & downspouts.",
  },
  {
    id: "house_washing",
    label: "House Washing",
    description: "Soft-wash exterior siding, brick, and stucco cleaning.",
  },
];

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
  windowCleaning: {
    small: number;
    medium: number;
    large: number;
    interiorMultiplier: number;
    tiers: Record<ServiceTier, number>;
    screensFee: number;
  };
  gutterCleaning: {
    pricePerLinearFoot: number;
    debrisMultipliers: Record<ConditionLevel, number>;
  };
  houseWashing: {
    pricePerSqFt: number;
    dirtinessMultipliers: Record<ConditionLevel, number>;
  };
  storySurchargePerLevel: number;
  minimumJobPrice: number;
}

export const DEFAULT_PRICING: PricingConfig = {
  windowCleaning: {
    small: 8,
    medium: 12,
    large: 18,
    interiorMultiplier: 1.6,
    tiers: {
      basic: 0,
      plus_tracks: 20,
      premium: 45,
    },
    screensFee: 25,
  },
  gutterCleaning: {
    pricePerLinearFoot: 1.5,
    debrisMultipliers: {
      light: 1,
      moderate: 1.3,
      heavy: 1.6,
    },
  },
  houseWashing: {
    pricePerSqFt: 0.2,
    dirtinessMultipliers: {
      light: 1,
      moderate: 1.25,
      heavy: 1.5,
    },
  },
  storySurchargePerLevel: 15,
  minimumJobPrice: 89,
};

export interface QuoteInput {
  services: ServiceId[];
  stories: number;
  window?: {
    windowCounts: { small: number; medium: number; large: number };
    cleaningType: CleaningType;
    serviceTier: ServiceTier;
    addScreens: boolean;
  };
  gutter?: {
    linearFeet: number;
    debrisLevel: ConditionLevel;
  };
  houseWash?: {
    squareFeet: number;
    dirtiness: ConditionLevel;
  };
}

export interface QuoteResult {
  low: number;
  high: number;
  perService: Partial<Record<ServiceId, { subtotal: number }>>;
  breakdown: {
    storySurcharge: number;
    subtotal: number;
    minimumApplied: boolean;
  };
}

function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function windowCleaningSubtotal(
  input: NonNullable<QuoteInput["window"]>,
  pricing: PricingConfig["windowCleaning"]
): number {
  const { small, medium, large } = input.windowCounts;
  const base = small * pricing.small + medium * pricing.medium + large * pricing.large;
  const interiorSurcharge =
    input.cleaningType === "interior_exterior" ? base * (pricing.interiorMultiplier - 1) : 0;
  const tierFee = pricing.tiers[input.serviceTier];
  const screensFee = input.addScreens ? pricing.screensFee : 0;

  return base + interiorSurcharge + tierFee + screensFee;
}

function gutterCleaningSubtotal(
  input: NonNullable<QuoteInput["gutter"]>,
  pricing: PricingConfig["gutterCleaning"]
): number {
  return (
    input.linearFeet *
    pricing.pricePerLinearFoot *
    pricing.debrisMultipliers[input.debrisLevel]
  );
}

function houseWashingSubtotal(
  input: NonNullable<QuoteInput["houseWash"]>,
  pricing: PricingConfig["houseWashing"]
): number {
  return (
    input.squareFeet *
    pricing.pricePerSqFt *
    pricing.dirtinessMultipliers[input.dirtiness]
  );
}

export function calculateQuote(
  input: QuoteInput,
  pricing: PricingConfig = DEFAULT_PRICING
): QuoteResult {
  const perService: Partial<Record<ServiceId, { subtotal: number }>> = {};

  if (input.services.includes("window_cleaning") && input.window) {
    perService.window_cleaning = {
      subtotal: windowCleaningSubtotal(input.window, pricing.windowCleaning),
    };
  }

  if (input.services.includes("gutter_cleaning") && input.gutter) {
    perService.gutter_cleaning = {
      subtotal: gutterCleaningSubtotal(input.gutter, pricing.gutterCleaning),
    };
  }

  if (input.services.includes("house_washing") && input.houseWash) {
    perService.house_washing = {
      subtotal: houseWashingSubtotal(input.houseWash, pricing.houseWashing),
    };
  }

  const servicesTotal = Object.values(perService).reduce(
    (sum, s) => sum + (s?.subtotal ?? 0),
    0
  );

  const storySurcharge = Math.max(0, input.stories - 1) * pricing.storySurchargePerLevel;

  const rawSubtotal = servicesTotal + storySurcharge;
  const minimumApplied = rawSubtotal < pricing.minimumJobPrice;
  const subtotal = minimumApplied ? pricing.minimumJobPrice : rawSubtotal;

  const low = roundToNearest(subtotal * 0.9, 5);
  const high = roundToNearest(subtotal * 1.15, 5);

  return {
    low,
    high,
    perService,
    breakdown: {
      storySurcharge,
      subtotal,
      minimumApplied,
    },
  };
}
