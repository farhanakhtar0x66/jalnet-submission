import { demoSupplierSchema } from "@jalnet/contracts/water";

// Fictional display-only fixtures. No contact details, booking or payment API.
export const demoSuppliers = [
  {
    id: "demo-a",
    name: "Demo Supplier A",
    source: "DEMO",
    capacityLitres: 5000,
    samplePriceINR: 900,
  },
  {
    id: "demo-b",
    name: "Demo Supplier B",
    source: "DEMO",
    capacityLitres: 10000,
    samplePriceINR: 1600,
  },
].map((supplier) => demoSupplierSchema.parse(supplier));
