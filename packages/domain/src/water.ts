import {
  type TankField,
  type TankInputs,
  type TankState,
  tankInputsSchema,
  tankStateSchema,
} from "../../contracts/src/water.ts";

export function tankDemoFixture(): TankState {
  return {
    version: 1,
    capacityLitres: 1500,
    levelPct: 60,
    dailyUseLitres: 300,
    capacitySource: "DEMO_FIXTURE",
    levelSource: "SIMULATED",
    dailyUseSource: "DEMO_FIXTURE",
    simulatedDays: 0,
  };
}

export function calculateTank(input: TankInputs) {
  const { capacityLitres, levelPct, dailyUseLitres } =
    tankInputsSchema.parse(input);
  const remainingLitres = (capacityLitres * levelPct) / 100;
  const hoursRemaining =
    remainingLitres === 0
      ? 0
      : dailyUseLitres === 0
        ? null
        : (remainingLitres / dailyUseLitres) * 24;
  return {
    remainingLitres,
    hoursRemaining,
    status:
      remainingLitres === 0
        ? ("EMPTY" as const)
        : hoursRemaining === null
          ? ("NO_CONSUMPTION_ESTIMATE" as const)
          : ("ESTIMATED" as const),
  };
}

export function simulateTankDay(input: TankState): TankState {
  const state = tankStateSchema.parse(input);
  const { remainingLitres } = calculateTank({
    capacityLitres: state.capacityLitres,
    levelPct: state.levelPct,
    dailyUseLitres: state.dailyUseLitres,
  });
  const nextLevel =
    (Math.max(0, remainingLitres - state.dailyUseLitres) /
      state.capacityLitres) *
    100;
  return tankStateSchema.parse({
    ...state,
    // Approximate simulation: six decimal percentage places avoid floating-point
    // tails becoming an invalid/overlong editable input. At the 1M L limit this
    // quantizes volume by at most 0.01 L; this is not sensor precision.
    levelPct: Math.round(nextLevel * 1_000_000) / 1_000_000,
    levelSource: "SIMULATED",
    simulatedDays: state.simulatedDays + 1,
  });
}

export type TankForm = Record<TankField, string>;
export function tankForm(state: TankInputs): TankForm {
  const decimal = (value: number) => {
    // Editable values need plain decimals. High-precision Intl formatting on
    // Android can add binary floating-point tails even to whole percentages.
    const text = String(value);
    if (!text.includes("e")) return text;
    const exponentStart = text.indexOf("e");
    const coefficient = text.slice(0, exponentStart);
    const exponent = text.slice(exponentStart + 1);
    const [whole = "", fraction = ""] = coefficient.split(".");
    const digits = whole + fraction;
    const point = whole.length + Number(exponent);
    if (point <= 0) return `0.${"0".repeat(-point)}${digits}`;
    if (point >= digits.length)
      return digits + "0".repeat(point - digits.length);
    return `${digits.slice(0, point)}.${digits.slice(point)}`;
  };
  return {
    capacityLitres: decimal(state.capacityLitres),
    levelPct: decimal(state.levelPct),
    dailyUseLitres: decimal(state.dailyUseLitres),
  };
}

// Blank/partial/negative/nonfinite/scientific input must not become a plausible zero.
export function parseTankForm(
  form: TankForm,
):
  | { valid: true; inputs: TankInputs; errors: Partial<TankForm> }
  | { valid: false; errors: Partial<TankForm> } {
  const errors: Partial<TankForm> = {};
  const numbers: Partial<TankInputs> = {};
  const bounds: Record<TankField, [number, number, string]> = {
    capacityLitres: [
      1,
      1_000_000,
      "Enter capacity from 1 to 1,000,000 litres.",
    ],
    levelPct: [0, 100, "Enter water level from 0 to 100%."],
    dailyUseLitres: [
      0,
      1_000_000,
      "Enter 0, or daily use from 0.01 to 1,000,000 litres.",
    ],
  };
  for (const field of Object.keys(bounds) as TankField[]) {
    const text = form[field].trim();
    const [min, max, message] = bounds[field];
    const value = Number(text);
    if (
      text.length > 20 ||
      !/^\d+(?:\.\d+)?$/.test(text) ||
      !Number.isFinite(value) ||
      value < min ||
      value > max ||
      (field === "dailyUseLitres" && value > 0 && value < 0.01)
    )
      errors[field] = message;
    else numbers[field] = value;
  }
  const parsed = tankInputsSchema.safeParse(numbers);
  return parsed.success
    ? { valid: true, inputs: parsed.data, errors }
    : { valid: false, errors };
}

export function editTank(
  current: TankState,
  inputs: TankInputs,
  field: TankField,
): TankState {
  return tankStateSchema.parse({
    ...tankStateSchema.parse(current),
    ...tankInputsSchema.parse(inputs),
    ...(field === "capacityLitres" ||
    inputs.capacityLitres !== current.capacityLitres
      ? { capacitySource: "USER_ENTERED" }
      : {}),
    ...(field === "levelPct" || inputs.levelPct !== current.levelPct
      ? { levelSource: "USER_ENTERED", simulatedDays: 0 }
      : {}),
    ...(field === "dailyUseLitres" ||
    inputs.dailyUseLitres !== current.dailyUseLitres
      ? { dailyUseSource: "USER_ENTERED" }
      : {}),
  });
}
