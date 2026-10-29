import { test } from "node:test";
import assert from "node:assert/strict";
import {
  memoryInput,
  safeNext,
  uploadExtension,
  uuid,
  passwordInput,
} from "../src/lib/validation.ts";

test("password validation preserves intentional spaces and rejects invalid input", () => {
  assert.equal(passwordInput("  a long passphrase  "), "  a long passphrase  ");
  assert.throws(() => passwordInput(null));
  assert.throws(() => passwordInput("x".repeat(201)));
});

test("memory validates required fields and real calendar dates", () => {
  assert.throws(() => memoryInput({ title: " ", memory_date: "2025-01-01" }));
  assert.throws(() => memoryInput({ title: "Day", memory_date: "2025-02-30" }));
  assert.throws(() => memoryInput({ title: "Day", memory_date: "" }));
  assert.throws(() =>
    memoryInput({ title: "x".repeat(201), memory_date: "2025-01-01" }),
  );
  assert.equal(
    memoryInput({ title: " A day ", memory_date: "2024-02-29" }).title,
    "A day",
  );
});
test("identifiers and redirect targets cannot escape their boundary", () => {
  assert.throws(() => uuid("../other-user"));
  assert.equal(
    uuid("123e4567-e89b-42d3-a456-426614174000"),
    "123e4567-e89b-42d3-a456-426614174000",
  );
  for (const path of [
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "/%2fevil.com",
    "/auth/callback",
  ])
    assert.equal(safeNext(path), "/home");
  assert.equal(safeNext("/memories/new"), "/memories/new");
});
test("uploads validate bytes as well as MIME and size", () => {
  assert.equal(
    uploadExtension(
      "image/png",
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      200,
    ),
    "png",
  );
  assert.throws(() =>
    uploadExtension("image/png", new Uint8Array([60, 115, 99, 114]), 200),
  );
  assert.throws(() =>
    uploadExtension("image/svg+xml", new Uint8Array([60]), 200),
  );
  assert.throws(() =>
    uploadExtension(
      "image/png",
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      11 * 1024 * 1024,
    ),
  );
});
