/**
 * Snapty Pricing Configuration
 * All prices in cents (USD)
 */

export const PROPERTY_SIZE_PRICING = {
  small: { sqft: 1000, price: 15000 }, // $150
  medium: { sqft: 2000, price: 22000 }, // $220
  large: { sqft: 3000, price: 30000 }, // $300
  xlarge: { sqft: 4000, price: 38000 }, // $380
} as const;

export const ADDON_PRICING = {
  drone: 8000, // $80
  video: 15000, // $150
  floorplans: 9000, // $90
} as const;

export const SERVICE_NAMES = {
  photography: "Real Estate Photography",
  drone: "Drone Photography",
  video: "Video Walkthrough",
  floorplans: "Floor Plans",
} as const;

export const PROPERTY_TYPES = [
  "Single Family Home",
  "Condo",
  "Townhouse",
  "Multi-Family",
  "Commercial",
  "Land",
  "Other",
] as const;

/**
 * Calculate base price based on property size
 */
export function getBasePriceBySize(sqft: number): number {
  if (sqft <= 1000) return PROPERTY_SIZE_PRICING.small.price;
  if (sqft <= 2000) return PROPERTY_SIZE_PRICING.medium.price;
  if (sqft <= 3000) return PROPERTY_SIZE_PRICING.large.price;
  return PROPERTY_SIZE_PRICING.xlarge.price;
}

/**
 * Calculate total price including add-ons
 */
export function calculateTotalPrice(
  baseSqft: number,
  addOns: {
    drone?: boolean;
    video?: boolean;
    floorplans?: boolean;
  }
): number {
  let total = getBasePriceBySize(baseSqft);

  if (addOns.drone) total += ADDON_PRICING.drone;
  if (addOns.video) total += ADDON_PRICING.video;
  if (addOns.floorplans) total += ADDON_PRICING.floorplans;

  return total;
}

/**
 * Format price in cents to USD string
 */
export function formatPrice(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(2)}`;
}

/**
 * Get price breakdown for display
 */
export function getPriceBreakdown(
  baseSqft: number,
  addOns: {
    drone?: boolean;
    video?: boolean;
    floorplans?: boolean;
  }
): Array<{ label: string; price: number }> {
  const breakdown: Array<{ label: string; price: number }> = [];

  const basePrice = getBasePriceBySize(baseSqft);
  breakdown.push({
    label: `Property (${baseSqft} sqft)`,
    price: basePrice,
  });

  if (addOns.drone) {
    breakdown.push({
      label: "Drone Photography",
      price: ADDON_PRICING.drone,
    });
  }

  if (addOns.video) {
    breakdown.push({
      label: "Video Walkthrough",
      price: ADDON_PRICING.video,
    });
  }

  if (addOns.floorplans) {
    breakdown.push({
      label: "Floor Plans",
      price: ADDON_PRICING.floorplans,
    });
  }

  return breakdown;
}
