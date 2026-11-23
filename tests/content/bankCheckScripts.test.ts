import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the Phase 1.3 / IQT-53 contract: every index has :check, and bank:check
 * aggregates them so CI cannot silently drop a uniqueness gate.
 */
describe("bank:check script contract", () => {
  const pkg = JSON.parse(
    readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
  ) as { scripts: Record<string, string> };

  it("exposes pri/vci/psi/wmi :check and aggregate bank:check", () => {
    for (const name of ["pri:check", "vci:check", "psi:check", "wmi:check", "bank:check"] as const) {
      expect(pkg.scripts[name], name).toBeTypeOf("string");
      expect(pkg.scripts[name]!.length).toBeGreaterThan(0);
    }
    for (const name of ["pri:check", "vci:check", "psi:check", "wmi:check"] as const) {
      expect(pkg.scripts["bank:check"]).toContain(name);
    }
  });

  it("CI workflow runs bank:check before npm test", () => {
    const yml = readFileSync(
      path.join(process.cwd(), ".github", "workflows", "ci.yml"),
      "utf8",
    );
    expect(yml).toMatch(/npm run bank:check/);
    expect(yml).toMatch(/npm test/);
    const bankAt = yml.indexOf("npm run bank:check");
    const testAt = yml.indexOf("npm test");
    expect(bankAt).toBeGreaterThanOrEqual(0);
    expect(testAt).toBeGreaterThan(bankAt);
  });
});
