import { z } from "zod";

// Local-only, additive contracts. These do not extend reports, rewards or AWS APIs.
export const tankInputsSchema = z.strictObject({
  capacityLitres: z.number().finite().min(1).max(1_000_000),
  levelPct: z.number().finite().min(0).max(100),
  dailyUseLitres: z
    .number()
    .finite()
    .min(0)
    .max(1_000_000)
    .refine((value) => value === 0 || value >= 0.01),
});
export type TankInputs = z.infer<typeof tankInputsSchema>;
export type TankField = keyof TankInputs;
const inputSource = z.enum(["USER_ENTERED", "DEMO_FIXTURE"]);
export const tankStateSchema = tankInputsSchema.extend({
  version: z.literal(1),
  capacitySource: inputSource,
  levelSource: z.enum(["USER_ENTERED", "SIMULATED"]),
  dailyUseSource: inputSource,
  simulatedDays: z.number().int().min(0).max(36_500),
});
export type TankState = z.infer<typeof tankStateSchema>;

const pressure = z.number().finite().min(0).max(1).nullable();
export const stressInputsSchema = z.strictObject({
  supply: pressure,
  heatDemand: pressure,
  rainfall: pressure,
  groundwater: pressure,
  tankerDemand: pressure,
  leakLoss: pressure,
});
export type StressInputs = z.infer<typeof stressInputsSchema>;
export type StressFactorId = keyof StressInputs;
export const demoSupplierSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  source: z.literal("DEMO"),
  capacityLitres: z.number().int().positive(),
  samplePriceINR: z.number().finite().nonnegative(),
});
export type DemoSupplier = z.infer<typeof demoSupplierSchema>;
