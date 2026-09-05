import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  ShortUUID,
  decode,
  encode,
  getAlphabet,
  random,
  setAlphabet,
  stringToInt,
  uuid,
} from "../src/shortuuid.js";
import { UUID, uuid4 } from "../src/uuid.js";

describe("LegacyShortUUIDTest (ported from Python)", () => {
  test("LegacyShortUUIDTest test_generation", () => {
    assert.ok(20 < uuid().length && uuid().length < 24);
    assert.ok(20 < uuid("http://www.example.com/").length && uuid("http://www.example.com/").length < 24);
    assert.ok(20 < uuid("HTTP://www.example.com/").length && uuid("HTTP://www.example.com/").length < 24);
    assert.ok(20 < uuid("example.com/").length && uuid("example.com/").length < 24);
  });

  test("LegacyShortUUIDTest test_encoding", () => {
    const u = new UUID("{3b1f8b40-222c-4a6e-b77e-779d5a94e21c}");
    assert.equal(encode(u), "CXc85b4rqinB7s5J52TRYb");
  });

  test("LegacyShortUUIDTest test_decoding", () => {
    const u = new UUID("{3b1f8b40-222c-4a6e-b77e-779d5a94e21c}");
    assert.ok(decode("CXc85b4rqinB7s5J52TRYb").equals(u));
  });

  test("LegacyShortUUIDTest test_alphabet", () => {
    const backupAlphabet = getAlphabet();

    const alphabet = "01";
    setAlphabet(alphabet);
    assert.equal(alphabet, getAlphabet());

    setAlphabet("01010101010101");
    assert.equal(alphabet, getAlphabet());

    assert.deepEqual(new Set(uuid()), new Set("01"));
    assert.ok(116 < uuid().length && uuid().length < 140);

    let u = uuid4();
    assert.ok(u.equals(decode(encode(u))));

    let s = uuid();
    assert.equal(s, encode(decode(s)));

    assert.throws(() => setAlphabet("1"), Error);
    assert.throws(() => setAlphabet("1111111"), Error);

    setAlphabet(backupAlphabet);

    assert.throws(() => new ShortUUID("0"), Error);
  });

  test("LegacyShortUUIDTest test_random", () => {
    assert.equal(random().length, 22);
    for (let i = 1; i < 100; i++) {
      assert.equal(random(i).length, i);
    }
  });
});

describe("ClassShortUUIDTest (ported from Python)", () => {
  test("ClassShortUUIDTest test_generation", () => {
    const su = new ShortUUID();
    assert.ok(20 < su.uuid().length && su.uuid().length < 24);
    assert.ok(20 < su.uuid("http://www.example.com/").length && su.uuid("http://www.example.com/").length < 24);
    assert.ok(20 < su.uuid("HTTP://www.example.com/").length && su.uuid("HTTP://www.example.com/").length < 24);
    assert.ok(20 < su.uuid("example.com/").length && su.uuid("example.com/").length < 24);
  });

  test("ClassShortUUIDTest test_encoding", () => {
    const su = new ShortUUID();
    const u = new UUID("{3b1f8b40-222c-4a6e-b77e-779d5a94e21c}");
    assert.equal(su.encode(u), "CXc85b4rqinB7s5J52TRYb");
  });

  test("ClassShortUUIDTest test_decoding", () => {
    const su = new ShortUUID();
    const u = new UUID("{3b1f8b40-222c-4a6e-b77e-779d5a94e21c}");
    assert.ok(su.decode("CXc85b4rqinB7s5J52TRYb").equals(u));
  });

  test("ClassShortUUIDTest test_random", () => {
    const su = new ShortUUID();
    for (let i = 0; i < 1000; i++) {
      assert.equal(su.random().length, 22);
    }
    for (let i = 1; i < 100; i++) {
      assert.equal(su.random(i).length, i);
    }
  });

  test("ClassShortUUIDTest test_alphabet", () => {
    const alphabet = "01";
    const su1 = new ShortUUID(alphabet);
    const su2 = new ShortUUID();

    assert.equal(alphabet, su1.getAlphabet());

    su1.setAlphabet("01010101010101");
    assert.equal(alphabet, su1.getAlphabet());

    assert.deepEqual(new Set(su1.uuid()), new Set("01"));
    assert.ok(116 < su1.uuid().length && su1.uuid().length < 140);
    assert.ok(20 < su2.uuid().length && su2.uuid().length < 24);

    let u = uuid4();
    assert.ok(u.equals(su1.decode(su1.encode(u))));

    let s = su1.uuid();
    assert.equal(s, su1.encode(su1.decode(s)));

    assert.throws(() => su1.setAlphabet("1"), Error);
    assert.throws(() => su1.setAlphabet("1111111"), Error);
  });

  test("ClassShortUUIDTest test_unsorted_alphabet", () => {
    const alphabet = "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

    const su1 = new ShortUUID(alphabet, true);
    const su2 = new ShortUUID();

    assert.equal(alphabet, su1.getAlphabet());

    su2.setAlphabet(alphabet, true);
    assert.equal(alphabet, su2.getAlphabet());

    su2.setAlphabet(alphabet + "123abc", true);
    assert.equal(alphabet, su2.getAlphabet());

    let u = uuid4();
    assert.ok(u.equals(su1.decode(su1.encode(u))));

    let s = su1.uuid();
    assert.equal(s, su1.encode(su1.decode(s)));

    assert.throws(() => su1.setAlphabet("1"), Error);
    assert.throws(() => su1.setAlphabet("1111111"), Error);
  });

  test("ClassShortUUIDTest test_encoded_length", () => {
    const su1 = new ShortUUID();
    assert.equal(su1.encodedLength(), 22);

    const asciiUppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const asciiLowercase = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    const base64Alphabet = asciiUppercase + asciiLowercase + digits + "+/";

    const su2 = new ShortUUID(base64Alphabet);
    assert.equal(su2.encodedLength(), 22);

    const binaryAlphabet = "01";
    const su3 = new ShortUUID(binaryAlphabet);
    assert.equal(su3.encodedLength(), 128);

    const su4 = new ShortUUID();
    assert.equal(su4.encodedLength(8), 11);
  });
});

describe("ShortUUIDPaddingTest (ported from Python)", () => {
  test("ShortUUIDPaddingTest test_padding", () => {
    const su = new ShortUUID();
    const randomUid = uuid4();
    const smallestUid = new UUID({ int: 0n });

    const encodedRandom = su.encode(randomUid);
    const encodedSmall = su.encode(smallestUid);

    assert.equal(encodedRandom.length, encodedSmall.length);
  });

  test("ShortUUIDPaddingTest test_decoding", () => {
    const su = new ShortUUID();
    const randomUid = uuid4();
    const smallestUid = new UUID({ int: 0n });

    const encodedRandom = su.encode(randomUid);
    const encodedSmall = su.encode(smallestUid);

    assert.ok(su.decode(encodedSmall).equals(smallestUid));
    assert.ok(su.decode(encodedRandom).equals(randomUid));
  });

  test("ShortUUIDPaddingTest test_consistency", () => {
    const su = new ShortUUID();
    const numIterations = 1000;
    const uidLengths = new Map();

    for (let count = 0; count < numIterations; count++) {
      const randomUid = uuid4();
      const encodedRandom = su.encode(randomUid);
      uidLengths.set(encodedRandom.length, (uidLengths.get(encodedRandom.length) ?? 0) + 1);
      const decodedRandom = su.decode(encodedRandom);
      assert.ok(randomUid.equals(decodedRandom));
    }

    assert.equal(uidLengths.size, 1);
    const uidLength = [...uidLengths.keys()][0];
    assert.equal(uidLengths.get(uidLength), numIterations);
  });
});

describe("EncodingEdgeCasesTest (ported from Python)", () => {
  test("EncodingEdgeCasesTest test_decode_dict", () => {
    const su = new ShortUUID();
    assert.throws(() => su.encode([]), Error);
    assert.throws(() => su.encode({}), Error);
    assert.throws(() => su.encode(42), Error);
    assert.throws(() => su.encode(42.0), Error);
  });
});

describe("DecodingEdgeCasesTest (ported from Python)", () => {
  test("DecodingEdgeCasesTest test_decode_dict", () => {
    const su = new ShortUUID();
    assert.throws(() => su.decode([]), Error);
    assert.throws(() => su.decode({}), Error);
    assert.throws(() => su.decode(42), Error);
    assert.throws(() => su.decode(42.0), Error);
  });

  test("DecodingEdgeCasesTest test_decode_invalid_characters", () => {
    const su = new ShortUUID("abc");
    assert.throws(() => su.decode("xyz"), Error);
  });

  test("DecodingEdgeCasesTest test_string_to_int_ignores_alphabet_when_index_given", () => {
    const hexIndex = new Map([..."0123456789abcdef"].map((char, idx) => [char, idx]));
    assert.equal(stringToInt("10", "0123456789", hexIndex), 16n);

    assert.equal(stringToInt("10", "0123456789abcdef"), 16n);
    assert.equal(stringToInt("1f", "0123456789abcdef"), 31n);
  });
});
