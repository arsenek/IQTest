import { loadPack } from "@/lib/content/loadPack";
import { loadNorms } from "@/lib/content/loadNorms";
import { describe, it, expect } from "vitest";

describe("loadPack", () => {
  it("child/v1 exposes VCI PRI WMI PSI", () => {
    const pack = loadPack("child/v1");
    const keys = new Set(pack.subtests.map((s) => s.indexKey));
    expect(keys).toEqual(new Set(["VCI", "PRI", "WMI", "PSI"]));
  });

  it("adult/v1 exposes VCI PRI WMI PSI", () => {
    const pack = loadPack("adult/v1");
    const keys = new Set(pack.subtests.map((s) => s.indexKey));
    expect(keys).toEqual(new Set(["VCI", "PRI", "WMI", "PSI"]));
  });

  it("rejects unknown pack id", () => {
    expect(() => loadPack("missing/v9")).toThrow(/unknown pack/i);
  });
});

describe("loadNorms", () => {
  it("loads placeholder trial norms", () => {
    const norms = loadNorms("placeholder/v1");
    expect(norms.version).toBe("placeholder/v1");
    expect(norms.trial).toBe(true);
    expect(norms.ageBands.length).toBeGreaterThan(0);
  });
});
