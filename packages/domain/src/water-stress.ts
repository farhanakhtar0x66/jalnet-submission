import {
  type StressFactorId,
  type StressInputs,
  stressInputsSchema,
} from "../../contracts/src/water.ts";

// §21.2 prototype weights. These are not calibrated hydrological standards.
export const stressFactors: readonly {
  id: StressFactorId;
  label: string;
  weight: number;
  meaning: string;
}[] = [
  {
    id: "supply",
    label: "Supply outage pressure",
    weight: 0.25,
    meaning: "Fictional supply interruption pressure; no utility feed.",
  },
  {
    id: "heatDemand",
    label: "Heat-driven demand pressure",
    weight: 0.15,
    meaning: "Fictional demand pressure; not a temperature reading.",
  },
  {
    id: "rainfall",
    label: "Rainfall / recharge pressure",
    weight: 0.15,
    meaning: "Fictional recharge shortfall; not measured rainfall.",
  },
  {
    id: "groundwater",
    label: "Groundwater pressure",
    weight: 0.2,
    meaning: "Fictional groundwater strain; no well measurements.",
  },
  {
    id: "tankerDemand",
    label: "Tanker demand pressure",
    weight: 0.15,
    meaning: "Fictional demand; not supplier orders or bookings.",
  },
  {
    id: "leakLoss",
    label: "Leak-loss pressure",
    weight: 0.1,
    meaning: "Fictional loss pressure; no measured leakage volume.",
  },
];
export const stressMinimumCoverage = 0.6;
export function stressDemoFixture(): StressInputs {
  return {
    supply: 0.8,
    heatDemand: 0.6,
    rainfall: 0.4,
    groundwater: 0.7,
    tankerDemand: 0.5,
    leakLoss: 0.3,
  };
}
export function calculateStress(input: StressInputs) {
  const values = stressInputsSchema.parse(input);
  const available = stressFactors.filter(
    (factor) => values[factor.id] !== null,
  );
  const coverage = available.reduce((sum, factor) => sum + factor.weight, 0);
  const contributors = stressFactors.map((factor) => {
    const value = values[factor.id];
    const effectiveWeight =
      value === null || coverage === 0 ? 0 : factor.weight / coverage;
    return {
      ...factor,
      value,
      effectiveWeight,
      contributionPoints: value === null ? null : value * effectiveWeight * 100,
    };
  });
  const score =
    coverage + 1e-10 < stressMinimumCoverage
      ? null
      : Math.round(
          contributors.reduce(
            (sum, factor) => sum + (factor.contributionPoints ?? 0),
            0,
          ),
        );
  const band =
    score === null
      ? coverage === 0
        ? "UNAVAILABLE"
        : "LIMITED_DATA"
      : score < 25
        ? "LOW"
        : score < 50
          ? "MODERATE"
          : score < 75
            ? "HIGH"
            : "CRITICAL";
  return {
    source: "DEMO_INDICATOR" as const,
    score,
    band,
    coverage,
    contributors,
  };
}
export type StressForm = Record<StressFactorId, string>;
export function stressForm(inputs: StressInputs): StressForm {
  return Object.fromEntries(
    stressFactors.map(({ id }) => [
      id,
      inputs[id] === null ? "" : String((inputs[id] ?? 0) * 100),
    ]),
  ) as StressForm;
}
export function parseStressForm(
  form: StressForm,
):
  | { valid: true; inputs: StressInputs; errors: Partial<StressForm> }
  | { valid: false; errors: Partial<StressForm> } {
  const errors: Partial<StressForm> = {};
  const values: Partial<StressInputs> = {};
  for (const { id } of stressFactors) {
    const text = form[id].trim();
    if (!text) {
      values[id] = null;
      continue;
    }
    const value = Number(text);
    if (
      text.length > 20 ||
      !/^\d+(?:\.\d+)?$/.test(text) ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 100
    )
      errors[id] =
        "Enter a demo pressure from 0 to 100, or clear it for missing data.";
    else values[id] = value / 100;
  }
  const parsed = stressInputsSchema.safeParse(values);
  return parsed.success
    ? { valid: true, inputs: parsed.data, errors }
    : { valid: false, errors };
}
