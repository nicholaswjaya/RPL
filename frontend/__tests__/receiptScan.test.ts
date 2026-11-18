import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateContent } = vi.hoisted(() => ({
  generateContent: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

import { processReceiptImage, ReceiptScanError } from "../../backend/scan";

describe("processReceiptImage", () => {
  beforeEach(() => {
    generateContent.mockReset();
  });

  it("does not retry malformed AI output", async () => {
    generateContent.mockResolvedValue({ text: "not JSON" });
    const file = new File(["receipt"], "receipt.jpg", { type: "image/jpeg" });

    await expect(processReceiptImage(file, "test-key")).rejects.toBeInstanceOf(
      ReceiptScanError
    );
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it("returns valid scanned receipt data", async () => {
    generateContent.mockResolvedValue({
      text: '{"items":[{"name":"Nasi","price":15000,"qty":1}],"tax":0,"service":0,"discount":0}',
    });
    const file = new File(["receipt"], "receipt.jpg", { type: "image/jpeg" });

    await expect(processReceiptImage(file, "test-key")).resolves.toEqual({
      items: [{ name: "Nasi", price: 15000, qty: 1 }],
      tax: 0,
      service: 0,
      discount: 0,
    });
    expect(generateContent).toHaveBeenCalledTimes(1);
  });
});
