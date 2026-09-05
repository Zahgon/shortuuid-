import assert from "node:assert/strict";

import {
  ShortUUID,
  decode,
  encode,
  getAlphabet,
  random,
  setAlphabet,
  uuid,
  intToString,
  stringToInt,
  UUID as ExportedUUID,
} from "../src/shortuuid.js";
import { UUID } from "../src/uuid.js";

assert.equal(ExportedUUID, UUID, "re-exported UUID must be the same class");

for (const fn of [decode, encode, getAlphabet, random, setAlphabet, uuid, intToString, stringToInt]) {
  assert.equal(typeof fn, "function", "missing module-level function");
}
for (const method of ["encode", "decode", "uuid", "random", "getAlphabet", "setAlphabet", "encodedLength"]) {
  assert.equal(typeof ShortUUID.prototype[method], "function", `missing method ${method}`);
}

assert.equal(getAlphabet(), "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");

const u = new UUID("3b1f8b40-222c-4a6e-b77e-779d5a94e21c");
assert.equal(encode(u), "CXc85b4rqinB7s5J52TRYb");
assert.equal(String(decode("CXc85b4rqinB7s5J52TRYb")), "3b1f8b40-222c-4a6e-b77e-779d5a94e21c");

const su = new ShortUUID();
assert.equal(su.encodedLength(), 22);
const round = uuid4Round(su);
assert.ok(round);

function uuid4Round(instance) {
  const s = instance.uuid();
  return s.length >= 21 && s.length <= 23;
}

console.log("build ok - module loads and the public API behaves as expected");
