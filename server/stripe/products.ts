/**
 * Stripe product and price configuration for Snapty services
 * These are the standard service packages offered to clients
 */

export const STRIPE_PRODUCTS = {
  PHOTOGRAPHY: {
    name: "Real Estate Photography",
    description: "Professional property photos with basic editing",
    basePrice: 17900, // $179.00 in cents
  },
  DRONE: {
    name: "Drone Photography",
    description: "Aerial views and perspectives of the property",
    basePrice: 29900, // $299.00 in cents
  },
  VIDEO: {
    name: "Video Walkthrough",
    description: "4K video walkthrough of the property",
    basePrice: 47900, // $479.00 in cents
  },
  FLOOR_PLAN: {
    name: "2D Floor Plan",
    description: "2D floor plan layout of the property",
    basePrice: 9900, // $99.00 in cents
  },
};

/**
 * Convert cents to dollars for display
 */
export const formatPrice = (cents: number): string => {
  return (cents / 100).toFixed(2);
};

/**
 * Convert dollars to cents for Stripe API
 */
export const toCents = (dollars: number): number => {
  return Math.round(dollars * 100);
};
