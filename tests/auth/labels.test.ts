import { describe, it, expect } from "vitest";
import { profileKindLabel } from "@/lib/auth/labels";

describe("profileKindLabel", () => {
  it("maps CHILD to 儿童", () => {
    expect(profileKindLabel("CHILD")).toBe("儿童");
  });
  it("maps ADULT to 成人", () => {
    expect(profileKindLabel("ADULT")).toBe("成人");
  });
});
