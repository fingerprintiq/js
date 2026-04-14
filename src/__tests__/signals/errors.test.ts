import { describe, it, expect } from "vitest";
import { collectErrors } from "../../signals/errors";

describe("collectErrors", () => {
  it("returns 9 error messages with valid hash", async () => {
    const result = await collectErrors();
    expect(result).not.toBeNull();
    expect(result!.value.messages).toHaveLength(9);
    expect(result!.value.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(result!.duration).toBeGreaterThanOrEqual(0);
  });

  it("all messages are non-empty strings", async () => {
    const result = await collectErrors();
    for (const msg of result!.value.messages) {
      expect(typeof msg).toBe("string");
      expect(msg.length).toBeGreaterThan(0);
    }
  });

  it("produces deterministic hash", async () => {
    const r1 = await collectErrors();
    const r2 = await collectErrors();
    expect(r1!.value.hash).toBe(r2!.value.hash);
    expect(r1!.value.messages).toEqual(r2!.value.messages);
  });

  it("captures null property error", async () => {
    const result = await collectErrors();
    // First message should be about null access
    expect(result!.value.messages[0]).toBeTruthy();
    expect(result!.value.messages[0].toLowerCase()).toMatch(/null|cannot/i);
  });

  it("captures invalid array length error", async () => {
    const result = await collectErrors();
    // 5th error (index 4) is new Array(-1)
    expect(result!.value.messages[4]).toBeTruthy();
    expect(result!.value.messages[4].toLowerCase()).toMatch(/invalid|length/i);
  });
});
