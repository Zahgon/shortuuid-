/**
 * Minimal RFC 4122 UUID support, mirroring the parts of Python's `uuid` module that
 * `shortuuid` relies on: parsing/formatting, a 128-bit integer view (`.int`), random
 * v4 generation, and name-based v5 generation with the DNS and URL namespaces.
 *
 * The 128-bit value is carried as a BigInt so `encode`/`decode` are lossless.
 */

import crypto from "node:crypto";

const UUID_MAX = 1n << 128n;

function parseHex(str) {
  let hex = str.trim().toLowerCase();
  if (hex.startsWith("urn:uuid:")) {
    hex = hex.slice("urn:uuid:".length);
  }
  hex = hex.replace(/[{}]/g, "").replace(/-/g, "");
  if (hex.length !== 32 || /[^0-9a-f]/.test(hex)) {
    throw new Error(`badly formed hexadecimal UUID string: ${str}`);
  }
  return BigInt("0x" + hex);
}

export class UUID {
  /**
   * Accepts a UUID string (`"3b1f8b40-..."`, braces/urn prefixes allowed), a BigInt,
   * or an options object `{ int }` to mirror Python's `UUID(int=...)`.
   */
  constructor(value) {
    let int;
    if (typeof value === "bigint") {
      int = value;
    } else if (typeof value === "string") {
      int = parseHex(value);
    } else if (value && typeof value === "object" && "int" in value) {
      int = BigInt(value.int);
    } else {
      throw new Error("UUID requires a string, bigint, or { int } object.");
    }
    if (int < 0n || int >= UUID_MAX) {
      throw new Error("int is out of range (need a 128-bit value)");
    }
    this.int = int;
  }

  static fromBytes(bytes) {
    let int = 0n;
    for (const b of bytes) {
      int = (int << 8n) | BigInt(b);
    }
    return new UUID(int);
  }

  /** Big-endian 16-byte representation. */
  bytes() {
    const buf = Buffer.alloc(16);
    let n = this.int;
    for (let i = 15; i >= 0; i--) {
      buf[i] = Number(n & 0xffn);
      n >>= 8n;
    }
    return buf;
  }

  get hex() {
    return this.int.toString(16).padStart(32, "0");
  }

  toString() {
    const h = this.hex;
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }

  equals(other) {
    return other instanceof UUID && other.int === this.int;
  }
}

export const NAMESPACE_DNS = new UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8");
export const NAMESPACE_URL = new UUID("6ba7b811-9dad-11d1-80b4-00c04fd430c8");

/** Cryptographically secure random v4 UUID. */
export function uuid4() {
  const bytes = crypto.randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10x
  return UUID.fromBytes(bytes);
}

/** SHA-1 name-based v5 UUID within the given namespace. */
export function uuid5(namespace, name) {
  const hash = crypto.createHash("sha1");
  hash.update(namespace.bytes());
  hash.update(Buffer.from(name, "utf8"));
  const bytes = hash.digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10x
  return UUID.fromBytes(bytes);
}
