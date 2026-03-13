import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

// Seed services
const services = [
  { name: "Real Estate Photography", description: "Professional interior and exterior photography for real estate listings", serviceType: "base", basePrice: "0.00", deliveryTime: "24 hours", icon: "camera", sortOrder: 1 },
  { name: "Drone Photography", description: "Aerial drone photography for stunning property overviews", serviceType: "addon", basePrice: "80.00", deliveryTime: "24 hours", icon: "plane", sortOrder: 2 },
  { name: "Video Walkthrough", description: "Professional video tour of the property", serviceType: "addon", basePrice: "150.00", deliveryTime: "48 hours", icon: "video", sortOrder: 3 },
  { name: "Floor Plans", description: "2D floor plan creation for property listings", serviceType: "addon", basePrice: "90.00", deliveryTime: "24 hours", icon: "layout", sortOrder: 4 },
];

// Seed pricing rules
const pricingRules = [
  { minSqft: 0, maxSqft: 1000, price: "150.00", label: "Up to 1,000 sqft" },
  { minSqft: 1001, maxSqft: 2000, price: "220.00", label: "1,001 – 2,000 sqft" },
  { minSqft: 2001, maxSqft: 3000, price: "300.00", label: "2,001 – 3,000 sqft" },
  { minSqft: 3001, maxSqft: null, price: "380.00", label: "3,001+ sqft" },
];

// Clear and re-seed services
await conn.execute("DELETE FROM services WHERE 1=1");
for (const svc of services) {
  await conn.execute(
    "INSERT INTO services (name, description, serviceType, basePrice, deliveryTime, icon, isActive, sortOrder) VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
    [svc.name, svc.description, svc.serviceType, svc.basePrice, svc.deliveryTime, svc.icon, svc.sortOrder]
  );
}
console.log("✓ Services seeded");

// Clear and re-seed pricing rules
await conn.execute("DELETE FROM pricing_rules WHERE 1=1");
for (const rule of pricingRules) {
  await conn.execute(
    "INSERT INTO pricing_rules (minSqft, maxSqft, price, label, isActive) VALUES (?, ?, ?, ?, 1)",
    [rule.minSqft, rule.maxSqft, rule.price, rule.label]
  );
}
console.log("✓ Pricing rules seeded");

await conn.end();
console.log("✓ Seed complete");
