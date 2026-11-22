import { describe, expect, it } from "vitest";
import {
  authorizeExportRequest,
  isExportApiEnabled,
} from "@/lib/export/access";

describe("export API access gate", () => {
  it("is disabled in production without ENABLE_RESPONSE_EXPORT", () => {
    expect(
      isExportApiEnabled({ NODE_ENV: "production", ENABLE_RESPONSE_EXPORT: undefined }),
    ).toBe(false);
    expect(
      authorizeExportRequest("Bearer secret", {
        NODE_ENV: "production",
        EXPORT_TOKEN: "secret",
      }),
    ).toEqual({ ok: false, status: 404, reason: "export_disabled" });
  });

  it("allows development when Bearer matches EXPORT_TOKEN", () => {
    expect(
      authorizeExportRequest("Bearer tok", {
        NODE_ENV: "development",
        EXPORT_TOKEN: "tok",
      }),
    ).toEqual({ ok: true });
  });

  it("returns 401 on wrong token when enabled", () => {
    expect(
      authorizeExportRequest("Bearer wrong", {
        NODE_ENV: "development",
        EXPORT_TOKEN: "tok",
      }),
    ).toEqual({ ok: false, status: 401, reason: "unauthorized" });
  });

  it("returns 404 when token env unset even in development", () => {
    expect(
      authorizeExportRequest("Bearer x", {
        NODE_ENV: "development",
        EXPORT_TOKEN: "",
      }),
    ).toEqual({ ok: false, status: 404, reason: "export_token_unset" });
  });

  it("ENABLE_RESPONSE_EXPORT=1 enables outside development", () => {
    expect(
      authorizeExportRequest("Bearer tok", {
        NODE_ENV: "production",
        ENABLE_RESPONSE_EXPORT: "1",
        EXPORT_TOKEN: "tok",
      }),
    ).toEqual({ ok: true });
  });
});
