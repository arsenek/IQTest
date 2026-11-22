import { describe, it, expect } from "vitest";
import { normTablesSchema } from "@/lib/content/schemas";
import { loadNorms } from "@/lib/content/loadNorms";

const baseBands = [
  {
    minAgeMonths: 72,
    maxAgeMonths: 143,
    means: { VCI: 10, PRI: 10, WMI: 10, PSI: 10 },
    sds: { VCI: 3, PRI: 3, WMI: 3, PSI: 3 },
  },
];

describe("normTablesSchema stage unlock", () => {
  it("normalizes legacy trial:true to stage trial", () => {
    const parsed = normTablesSchema.parse({
      version: "fixture/legacy",
      trial: true,
      ageBands: baseBands,
    });
    expect(parsed.stage).toBe("trial");
    expect(parsed.trial).toBe(true);
  });

  it("accepts explicit stage without trial flag", () => {
    const parsed = normTablesSchema.parse({
      version: "fixture/cal",
      stage: "calibrated",
      ageBands: baseBands,
    });
    expect(parsed.stage).toBe("calibrated");
    expect(parsed.trial).toBe(false);
  });

  it("accepts consistent stage + trial", () => {
    const parsed = normTablesSchema.parse({
      version: "fixture/ok",
      stage: "trial",
      trial: true,
      ageBands: baseBands,
    });
    expect(parsed.stage).toBe("trial");
  });

  it("rejects missing stage and trial", () => {
    const result = normTablesSchema.safeParse({
      version: "fixture/bad",
      ageBands: baseBands,
    });
    expect(result.success).toBe(false);
  });

  it("rejects trial:false without explicit stage", () => {
    const result = normTablesSchema.safeParse({
      version: "fixture/bad",
      trial: false,
      ageBands: baseBands,
    });
    expect(result.success).toBe(false);
  });

  it("rejects inconsistent stage and trial", () => {
    const result = normTablesSchema.safeParse({
      version: "fixture/bad",
      stage: "standardized",
      trial: true,
      ageBands: baseBands,
    });
    expect(result.success).toBe(false);
  });
});

describe("loadNorms placeholder", () => {
  it("exposes stage trial for placeholder/v1", () => {
    const norms = loadNorms("placeholder/v1");
    expect(norms.stage).toBe("trial");
    expect(norms.trial).toBe(true);
  });
});
