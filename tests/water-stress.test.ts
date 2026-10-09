import { describe, expect, it } from "vitest";
import {
  demoSupplierSchema,
  stressInputsSchema,
} from "../packages/contracts/src/water.js";
import {
  calculateStress,
  parseStressForm,
  stressDemoFixture,
  stressFactors,
  stressForm,
} from "../packages/domain/src/water-stress.js";

const all = (value: number | null) =>
  Object.fromEntries(stressFactors.map(({ id }) => [id, value])) as ReturnType<
    typeof stressDemoFixture
  >;
describe("explainable local DEMO stress calculation", () => {
  it("actually calculates the documented sample and full weighted coverage", () => {
    const result = calculateStress(stressDemoFixture());
    expect(result).toMatchObject({
      source: "DEMO_INDICATOR",
      score: 60,
      band: "HIGH",
      coverage: 1,
    });
    expect(
      result.contributors.reduce(
        (sum, factor) => sum + (factor.contributionPoints ?? 0),
        0,
      ),
    ).toBeCloseTo(59.5);
    expect(
      result.contributors.find((factor) => factor.id === "supply"),
    ).toMatchObject({
      weight: 0.25,
      effectiveWeight: 0.25,
      contributionPoints: 20,
    });
  });
  it("renormalizes missing factors instead of assuming a zero pressure", () => {
    const result = calculateStress({
      ...all(null),
      supply: 1,
      heatDemand: 0,
      groundwater: 1,
    });
    expect(result.coverage).toBeCloseTo(0.6);
    expect(result.score).toBe(75);
    expect(result.band).toBe("CRITICAL");
    expect(
      result.contributors.find((factor) => factor.id === "rainfall"),
    ).toMatchObject({
      value: null,
      effectiveWeight: 0,
      contributionPoints: null,
    });
    expect(
      result.contributors.reduce(
        (sum, factor) => sum + factor.effectiveWeight,
        0,
      ),
    ).toBeCloseTo(1);
  });
  it("suppresses precise score and band with weak weighted coverage", () => {
    expect(calculateStress({ ...all(null), supply: 1 })).toMatchObject({
      score: null,
      band: "LIMITED_DATA",
      coverage: 0.25,
    });
  });
  it("returns no-data rather than zero/safe when all inputs are missing", () => {
    expect(calculateStress(all(null))).toMatchObject({
      score: null,
      band: "UNAVAILABLE",
      coverage: 0,
    });
  });
  it("counts a present zero pressure as data, distinctly from missing", () => {
    expect(calculateStress(all(0))).toMatchObject({
      score: 0,
      band: "LOW",
      coverage: 1,
    });
  });
  it.each([
    [0.24, 24, "LOW"],
    [0.25, 25, "MODERATE"],
    [0.49, 49, "MODERATE"],
    [0.5, 50, "HIGH"],
    [0.74, 74, "HIGH"],
    [0.75, 75, "CRITICAL"],
    [1, 100, "CRITICAL"],
  ] as const)(
    "uses consistent rounded published bands at %s",
    (value, score, band) => {
      expect(calculateStress(all(value))).toMatchObject({ score, band });
    },
  );
  it("updates with changed pressures and never couples to private tank data", () => {
    expect(calculateStress({ ...stressDemoFixture(), supply: 0 }).score).toBe(
      40,
    );
    expect(
      stressInputsSchema.safeParse({ ...stressDemoFixture(), tankLevel: 1 })
        .success,
    ).toBe(false);
  });
  it("rejects invalid/unknown values instead of dropping them as missing", () => {
    for (const invalid of [Number.NaN, Number.POSITIVE_INFINITY, -1, 1.1, "1"])
      expect(
        stressInputsSchema.safeParse({
          ...stressDemoFixture(),
          supply: invalid,
        }).success,
      ).toBe(false);
    expect(stressInputsSchema.safeParse({ supply: 1 }).success).toBe(false);
  });
  it("accepts cleared factors and decimals but rejects ambiguous edits", () => {
    const form = stressForm(stressDemoFixture());
    expect(
      parseStressForm({ ...form, supply: "", rainfall: "12.5" }),
    ).toMatchObject({ valid: true, inputs: { supply: null, rainfall: 0.125 } });
    for (const supply of ["101", "-1", "10.", "Infinity", "1e2"])
      expect(parseStressForm({ ...form, supply }).valid).toBe(false);
  });
  it("requires DEMO supplier provenance and provides no operational booking fields", () => {
    const sample = {
      id: "demo-a",
      name: "Demo Supplier A",
      source: "DEMO",
      capacityLitres: 5000,
      samplePriceINR: 900,
    };
    expect(demoSupplierSchema.parse(sample).source).toBe("DEMO");
    expect(
      demoSupplierSchema.safeParse({ ...sample, source: "LIVE" }).success,
    ).toBe(false);
    expect(
      demoSupplierSchema.safeParse({
        ...sample,
        contact: "private phone",
        booked: true,
      }).success,
    ).toBe(false);
  });
});
