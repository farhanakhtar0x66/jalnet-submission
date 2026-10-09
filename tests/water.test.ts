import { describe, expect, it } from "vitest";
import {
  tankInputsSchema,
  tankStateSchema,
} from "../packages/contracts/src/water.js";
import {
  calculateTank,
  editTank,
  parseTankForm,
  simulateTankDay,
  tankDemoFixture,
  tankForm,
} from "../packages/domain/src/water.js";

const inputs = () =>
  tankInputsSchema.parse({
    capacityLitres: 1500,
    levelPct: 60,
    dailyUseLitres: 300,
  });
describe("executable local My Water arithmetic", () => {
  it("calculates fixture volume and depletion without hardcoded output", () => {
    expect(calculateTank(inputs())).toEqual({
      remainingLitres: 900,
      hoursRemaining: 72,
      status: "ESTIMATED",
    });
    expect(
      calculateTank({
        capacityLitres: 1000,
        levelPct: 25,
        dailyUseLitres: 200,
      }),
    ).toEqual({
      remainingLitres: 250,
      hoursRemaining: 30,
      status: "ESTIMATED",
    });
  });
  it("responds independently to capacity, level and daily-use changes", () => {
    expect(
      calculateTank({ ...inputs(), capacityLitres: 3000 }).hoursRemaining,
    ).toBe(144);
    expect(calculateTank({ ...inputs(), levelPct: 20 }).remainingLitres).toBe(
      300,
    );
    expect(
      calculateTank({ ...inputs(), dailyUseLitres: 150 }).hoursRemaining,
    ).toBe(144);
  });
  it("does not invent a finite estimate at zero consumption", () => {
    expect(calculateTank({ ...inputs(), dailyUseLitres: 0 })).toEqual({
      remainingLitres: 900,
      hoursRemaining: null,
      status: "NO_CONSUMPTION_ESTIMATE",
    });
  });
  it("treats an empty tank as empty even when use is zero", () => {
    expect(
      calculateTank({ ...inputs(), levelPct: 0, dailyUseLitres: 0 }),
    ).toEqual({ remainingLitres: 0, hoursRemaining: 0, status: "EMPTY" });
  });
  it("advances exactly one hypothetical day and clamps depletion to zero", () => {
    let state = tankDemoFixture();
    state = simulateTankDay(state);
    expect(state.levelPct).toBe(40);
    expect(state.simulatedDays).toBe(1);
    expect(
      calculateTank(tankInputsSchema.parse(tankFormToInputs(state)))
        .hoursRemaining,
    ).toBe(48);
    for (let day = 0; day < 4; day++) state = simulateTankDay(state);
    expect(state.levelPct).toBe(0);
    expect(state.simulatedDays).toBe(5);
    expect(state.levelSource).toBe("SIMULATED");
  });
  it("handles fractional use and zero-use simulation without mutating inputs", () => {
    const state = { ...tankDemoFixture(), dailyUseLitres: 12.5 };
    expect(simulateTankDay(state).levelPct).toBeCloseTo(59.1666666667);
    expect(state.levelPct).toBe(60);
    expect(simulateTankDay({ ...state, dailyUseLitres: 0 }).levelPct).toBe(60);
  });
  it("keeps field provenance accurate across edits accumulated while invalid", () => {
    const state = simulateTankDay(tankDemoFixture());
    const edited = editTank(
      state,
      { ...inputs(), levelPct: 20 },
      "capacityLitres",
    );
    expect(edited.capacitySource).toBe("USER_ENTERED");
    expect(edited.levelSource).toBe("USER_ENTERED");
    expect(edited.dailyUseSource).toBe("DEMO_FIXTURE");
    expect(edited.simulatedDays).toBe(0);
  });
  it("labels consumption edits but retains a simulated level origin", () => {
    const state = simulateTankDay(tankDemoFixture());
    const edited = editTank(
      state,
      {
        capacityLitres: state.capacityLitres,
        levelPct: state.levelPct,
        dailyUseLitres: 150,
      },
      "dailyUseLitres",
    );
    expect(edited.levelSource).toBe("SIMULATED");
    expect(edited.dailyUseSource).toBe("USER_ENTERED");
    expect(edited.simulatedDays).toBe(1);
  });
  it("reset fixture is independent of previous mutated state", () => {
    const value = tankDemoFixture();
    value.levelPct = 2;
    expect(tankDemoFixture().levelPct).toBe(60);
  });
  it("keeps simulated and tiny valid saved values usable in decimal input fields", () => {
    const state = simulateTankDay({ ...tankDemoFixture(), levelPct: 75 });
    expect(state.levelPct).toBe(55);
    expect(tankForm(state).levelPct).toBe("55");
    expect(
      parseTankForm(tankForm({ ...state, levelPct: 0.0000001 })).valid,
    ).toBe(true);
    expect(tankForm({ ...state, levelPct: 1e-18 }).levelPct).toBe(
      "0.000000000000000001",
    );
    expect(parseTankForm(tankForm({ ...state, levelPct: 1e-18 })).valid).toBe(
      true,
    );
    let repeated = { ...tankDemoFixture(), dailyUseLitres: 12.34 };
    for (let day = 0; day < 80; day++) {
      repeated = simulateTankDay(repeated);
      expect(parseTankForm(tankForm(repeated)).valid).toBe(true);
    }
    expect(repeated.levelPct).toBe(0);
  });
  it.each([
    { capacityLitres: 0 },
    { capacityLitres: 1_000_001 },
    { levelPct: -1 },
    { levelPct: 101 },
    { levelPct: Number.NaN },
    { dailyUseLitres: -1 },
    { dailyUseLitres: Number.POSITIVE_INFINITY },
  ])("rejects invalid domain input %j", (invalid) => {
    expect(() => calculateTank({ ...inputs(), ...invalid })).toThrow();
  });
  it.each(["", " ", "60.", "1e2", "Infinity", "NaN", "-3", "1,000"])(
    "rejects incomplete or ambiguous numeric entry %j",
    (value) => {
      expect(
        parseTankForm({ ...tankForm(inputs()), levelPct: value }).valid,
      ).toBe(false);
    },
  );
  it("accepts decimal entries, full/empty boundaries and exact zero use", () => {
    expect(
      parseTankForm({
        capacityLitres: "1000.5",
        levelPct: "100",
        dailyUseLitres: "0",
      }),
    ).toMatchObject({
      valid: true,
      inputs: { capacityLitres: 1000.5, levelPct: 100, dailyUseLitres: 0 },
    });
    expect(
      parseTankForm({ capacityLitres: "1", levelPct: "0", dailyUseLitres: "0" })
        .valid,
    ).toBe(true);
  });
  it("reports all invalid fields and enforces storage version/provenance", () => {
    expect(
      parseTankForm({
        capacityLitres: "0",
        levelPct: "105",
        dailyUseLitres: "-1",
      }).errors,
    ).toHaveProperty("dailyUseLitres");
    expect(
      tankStateSchema.safeParse({ ...tankDemoFixture(), version: 2 }).success,
    ).toBe(false);
    expect(
      tankStateSchema.safeParse({ ...tankDemoFixture(), levelSource: "IOT" })
        .success,
    ).toBe(false);
    expect(
      tankStateSchema.safeParse({
        ...tankDemoFixture(),
        userId: "client-owner",
      }).success,
    ).toBe(false);
    expect(() =>
      simulateTankDay({ ...tankDemoFixture(), simulatedDays: 36_500 }),
    ).toThrow();
  });
});
function tankFormToInputs(state: ReturnType<typeof tankDemoFixture>) {
  return {
    capacityLitres: state.capacityLitres,
    levelPct: state.levelPct,
    dailyUseLitres: state.dailyUseLitres,
  };
}
