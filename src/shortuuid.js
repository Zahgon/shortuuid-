/**
 * Concise UUID generation.
 *
 * JavaScript port of shortuuid (https://github.com/skorokithakis/shortuuid), preserving
 * the public interface and behaviour of the Python library. 128-bit UUID values are
 * carried as BigInt so encoding/decoding is lossless; the `UUID` class in ./uuid.js
 * stands in for Python's `uuid.UUID`.
 */

import crypto from "node:crypto";

import { UUID, uuid4, uuid5, NAMESPACE_DNS, NAMESPACE_URL } from "./uuid.js";

export { UUID } from "./uuid.js";

const DEFAULT_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * Convert a number to a string, using the given alphabet.
 *
 * The output has the most significant digit first.
 */
export function intToString(number, alphabet, padding = null) {
  let output = "";
  const alphaLen = BigInt(alphabet.length);
  let n = BigInt(number);
  while (n > 0n) {
    const digit = n % alphaLen;
    n = n / alphaLen;
    output += alphabet[Number(digit)];
  }
  if (padding) {
    const remainder = Math.max(padding - output.length, 0);
    output = output + alphabet[0].repeat(remainder);
  }
  return [...output].reverse().join("");
}

/**
 * Convert a string to a number, using the given alphabet.
 *
 * The input is assumed to have the most significant digit first.
 *
 * `alphabetIndex`, if provided, should be a Map from each character to its index. This
 * avoids rebuilding the index on each call. If it is passed, `alphabet` is ignored.
 */
export function stringToInt(string, alphabet, alphabetIndex = null) {
  if (alphabetIndex == null) {
    alphabetIndex = new Map([...alphabet].map((char, idx) => [char, idx]));
  }
  let number = 0n;
  // Derive the radix from the index so `alphabet` is truly ignored when
  // alphabetIndex is passed, as documented above.
  const alphaLen = BigInt(alphabetIndex.size);
  for (const char of string) {
    if (!alphabetIndex.has(char)) {
      throw new Error(`'${char}' is not in alphabet`);
    }
    number = number * alphaLen + BigInt(alphabetIndex.get(char));
  }
  return number;
}

export class ShortUUID {
  constructor(alphabet = null, dontSortAlphabet = false) {
    if (alphabet == null) {
      alphabet = DEFAULT_ALPHABET;
    }
    this.setAlphabet(alphabet, dontSortAlphabet);
  }

  /** The necessary length to fit the entire UUID given the current alphabet. */
  get _length() {
    return Math.ceil(Math.log(2 ** 128) / Math.log(this._alphaLen));
  }

  /**
   * Encode a UUID into a string according to the alphabet.
   *
   * If leftmost (MSB) bits are 0, the string might be shorter unless padded.
   */
  encode(uuid, padLength = null) {
    if (!(uuid instanceof UUID)) {
      throw new Error("Input `uuid` must be a UUID object.");
    }
    if (padLength == null) {
      padLength = this._length;
    }
    return intToString(uuid.int, this._alphabet, padLength);
  }

  /**
   * Decode a string according to the current alphabet into a UUID.
   *
   * Throws on illegal characters. If the string is too short, leftmost (MSB) bits are
   * filled with 0. Pass `legacy=true` for strings encoded by ShortUUID < 1.0.0.
   */
  decode(string, legacy = false) {
    if (typeof string !== "string") {
      throw new Error("Input `string` must be a str.");
    }
    if (legacy) {
      string = [...string].reverse().join("");
    }
    return new UUID({ int: stringToInt(string, this._alphabet, this._alphabetIndex) });
  }

  /**
   * Generate and return a UUID.
   *
   * If `name` is provided, a v5 UUID is generated using the URL namespace (for http/https
   * names) or the DNS namespace otherwise. Without a name a random v4 UUID is used.
   */
  uuid(name = null, padLength = null) {
    if (padLength == null) {
      padLength = this._length;
    }
    let u;
    if (name == null) {
      u = uuid4();
    } else if (/^https?:\/\//i.test(name)) {
      u = uuid5(NAMESPACE_URL, name);
    } else {
      u = uuid5(NAMESPACE_DNS, name);
    }
    return this.encode(u, padLength);
  }

  /** Generate a cryptographically secure short random string of `length`. */
  random(length = null) {
    if (length == null) {
      length = this._length;
    }
    let result = "";
    for (let i = 0; i < length; i++) {
      result += this._alphabet[crypto.randomInt(this._alphaLen)];
    }
    return result;
  }

  /** Return the current alphabet used for new UUIDs. */
  getAlphabet() {
    return this._alphabetStr;
  }

  /** Set the alphabet to be used for new UUIDs. */
  setAlphabet(alphabet, dontSortAlphabet = false) {
    // Deduplicate (and by default sort) to prevent duplicates and ensure reproducibility.
    const unique = [...new Set([...alphabet])];
    const newAlphabet = dontSortAlphabet ? unique : unique.sort();
    if (newAlphabet.length > 1) {
      this._alphabet = newAlphabet;
      this._alphabetStr = newAlphabet.join("");
      this._alphaLen = newAlphabet.length;
      this._alphabetIndex = new Map(newAlphabet.map((char, idx) => [char, idx]));
    } else {
      throw new Error("Alphabet with more than one unique symbols required.");
    }
  }

  /** Return the string length of the shortened UUID. */
  encodedLength(numBytes = 16) {
    const factor = Math.log(256) / Math.log(this._alphaLen);
    return Math.ceil(factor * numBytes);
  }
}

// For backwards compatibility: a shared global instance whose methods are exposed as
// module-level functions, mirroring shortuuid's Python API.
const _globalInstance = new ShortUUID();

export const encode = (uuid, padLength) => _globalInstance.encode(uuid, padLength);
export const decode = (string, legacy) => _globalInstance.decode(string, legacy);
export const uuid = (name, padLength) => _globalInstance.uuid(name, padLength);
export const random = (length) => _globalInstance.random(length);
export const getAlphabet = () => _globalInstance.getAlphabet();
export const setAlphabet = (alphabet, dontSortAlphabet) =>
  _globalInstance.setAlphabet(alphabet, dontSortAlphabet);
