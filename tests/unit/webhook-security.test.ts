import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhookSignature, verifySecretToken } from "@/lib/webhook-security";

const SECRET = "test-webhook-secret";

function sign(body: string, secret = SECRET): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

describe("verifyWebhookSignature", () => {
  it("accepts a valid signature", () => {
    const body = JSON.stringify({ posExternalId: "r1" });
    expect(verifyWebhookSignature(body, sign(body), SECRET)).toBe(true);
  });

  it("rejects a signature computed with a different secret", () => {
    const body = JSON.stringify({ posExternalId: "r1" });
    expect(verifyWebhookSignature(body, sign(body, "wrong-secret"), SECRET)).toBe(false);
  });

  it("rejects a tampered body signed before tampering", () => {
    const original = JSON.stringify({ posExternalId: "r1" });
    const signature = sign(original);
    const tampered = JSON.stringify({ posExternalId: "r2" });
    expect(verifyWebhookSignature(tampered, signature, SECRET)).toBe(false);
  });

  it("rejects when no secret is configured", () => {
    const body = "{}";
    expect(verifyWebhookSignature(body, sign(body), undefined)).toBe(false);
  });

  it("rejects when no signature header is present", () => {
    expect(verifyWebhookSignature("{}", null, SECRET)).toBe(false);
  });

  it("rejects a malformed hex signature without throwing", () => {
    expect(() => verifyWebhookSignature("{}", "not-hex!", SECRET)).not.toThrow();
    expect(verifyWebhookSignature("{}", "not-hex!", SECRET)).toBe(false);
  });
});

describe("verifySecretToken", () => {
  it("accepts a matching secret", () => {
    expect(verifySecretToken("my-secret", "my-secret")).toBe(true);
  });

  it("rejects a mismatching secret without throwing", () => {
    expect(() => verifySecretToken("wrong", "my-secret")).not.toThrow();
    expect(verifySecretToken("wrong", "my-secret")).toBe(false);
  });

  it("rejects a secret of different length without throwing", () => {
    expect(() => verifySecretToken("short", "much-longer-secret")).not.toThrow();
    expect(verifySecretToken("short", "much-longer-secret")).toBe(false);
  });

  it("rejects when no secret is configured", () => {
    expect(verifySecretToken("anything", undefined)).toBe(false);
  });

  it("rejects when no header value is provided", () => {
    expect(verifySecretToken(null, "my-secret")).toBe(false);
  });
});
