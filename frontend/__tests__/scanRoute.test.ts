import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../app/api/scan/route";

describe("POST /api/scan", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 400 when multipart form data is malformed", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const request = new Request("http://localhost/api/scan", {
      method: "POST",
      headers: { "content-type": "multipart/form-data" },
      body: "invalid multipart body",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Format upload tidak valid.",
    });
  });
});
