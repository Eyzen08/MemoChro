import { test } from "node:test";
import assert from "node:assert/strict";
import { tarEntry } from "../src/lib/tar.ts";
test("TAR entries have correct sizes, checksum and 512-byte alignment", () => {
  const chunks = tarEntry(
    "archive.json",
    new TextEncoder().encode('{"hello":"memory"}'),
  );
  const header = chunks[0];
  const string = (a: number, b: number) =>
    new TextDecoder().decode(header.slice(a, b)).replace(/\0/g, "").trim();
  assert.equal(string(0, 100), "archive.json");
  assert.equal(Number.parseInt(string(124, 136), 8), 18);
  const sum = header.reduce((n, v, i) => n + (i >= 148 && i < 156 ? 32 : v), 0);
  assert.equal(Number.parseInt(string(148, 156), 8), sum);
  assert.equal(chunks.reduce((n, c) => n + c.length, 0) % 512, 0);
  assert.throws(() => tarEntry("../escape", new Uint8Array()));
});
test("TAR stores a full memory UUID and content-hash photo path without truncation", () => {
  const name =
    "photos/123e4567-e89b-42d3-a456-426614174000/" + "a".repeat(64) + ".jpg";
  const [header] = tarEntry(name, new Uint8Array([1, 2, 3]));
  const read = (start: number, length: number) =>
    new TextDecoder()
      .decode(header.slice(start, start + length))
      .replace(/\0.*$/s, "");
  assert.equal(read(345, 155) + "/" + read(0, 100), name);
});
