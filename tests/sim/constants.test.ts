import { describe, expect, it } from "vitest";
import {
  isSimEmail,
  personaIdFromSimEmail,
  simEmailForPersona,
} from "@/lib/sim/constants";
import { loadPersonasFile, selectPersonas } from "@/lib/sim/personas";

describe("sim email markers", () => {
  it("builds sim email from persona id", () => {
    expect(simEmailForPersona("sim-c01")).toBe("sim-c01@iqtest.local");
    expect(simEmailForPersona("sim-a12")).toBe("sim-a12@iqtest.local");
  });

  it("detects only sim-*@iqtest.local", () => {
    expect(isSimEmail("sim-c01@iqtest.local")).toBe(true);
    expect(isSimEmail("real@example.com")).toBe(false);
    expect(isSimEmail("sim-c01@example.com")).toBe(false);
    expect(isSimEmail("user@iqtest.local")).toBe(false);
  });

  it("round-trips persona id", () => {
    expect(personaIdFromSimEmail("sim-c01@iqtest.local")).toBe("sim-c01");
  });
});

describe("personas file", () => {
  it("loads 50 personas with child/adult mix", () => {
    const file = loadPersonasFile();
    expect(file.personas.length).toBe(50);
    expect(file.personas.filter((p) => p.kind === "CHILD").length).toBe(20);
    expect(file.personas.filter((p) => p.kind === "ADULT").length).toBe(30);
  });

  it("selectPersonas respects count", () => {
    const file = loadPersonasFile();
    expect(selectPersonas(file.personas, { count: 3 })).toHaveLength(3);
  });
});
