/**
 * Replays the golden corpus produced by parity/parity_dump.py through the JS port.
 *
 * Each corpus line records inputs plus the exact result the reference Python
 * `shortuuid` produced, so any behavioural difference shows up as a mismatch.
 *
 * Line format (TSV): op \t alphabet \t arg1 \t arg2 \t expected
 * (empty columns are the literal empty string).
 */
import { readFileSync } from "node:fs";

import {
  ShortUUID,
  intToString,
  stringToInt,
} from "../src/shortuuid.js";
import { UUID } from "../src/uuid.js";

const KNOWN_OPS = [
  "encode",
  "decode",
  "encode_pad",
  "encoded_length",
  "get_alphabet",
  "uuid_name",
  "int_to_string",
  "int_to_string_pad",
  "string_to_int",
];

function replayLine(op, alphabet, a1, a2) {
  switch (op) {
    case "encode":
      return new ShortUUID(alphabet).encode(new UUID(a1));
    case "encode_pad":
      return new ShortUUID(alphabet).encode(new UUID(a1), Number(a2));
    case "decode":
      return String(new ShortUUID(alphabet).decode(a1, a2 === "1"));
    case "encoded_length":
      return String(new ShortUUID(alphabet).encodedLength(Number(a1)));
    case "get_alphabet":
      return new ShortUUID(alphabet, a1 === "1").getAlphabet();
    case "uuid_name":
      return new ShortUUID(alphabet).uuid(a1);
    case "int_to_string":
      return intToString(BigInt(a1), alphabet);
    case "int_to_string_pad":
      return intToString(BigInt(a1), alphabet, Number(a2));
    case "string_to_int":
      return String(stringToInt(a1, alphabet));
    default:
      throw new Error(`unknown op "${op}"`);
  }
}

export function replayCorpus(corpusPath) {
  const lines = readFileSync(corpusPath, "utf8")
    .split("\n")
    .filter((line) => line.length > 0);

  const counts = new Map();
  const mismatches = [];

  for (const [index, line] of lines.entries()) {
    const [op, alphabet, a1, a2, expected] = line.split("\t");
    counts.set(op, (counts.get(op) ?? 0) + 1);

    let actual;
    try {
      actual = replayLine(op, alphabet, a1, a2);
    } catch (error) {
      actual = `ERR:${error.message}`;
    }

    if (actual !== expected) {
      mismatches.push({ line: index + 1, op, alphabet, a1, a2, python: expected, js: actual });
    }
  }

  return { total: lines.length, counts, mismatches };
}

export function formatMismatch(mismatch) {
  return [
    `line ${mismatch.line} [${mismatch.op}] alphabet=${JSON.stringify(mismatch.alphabet)}`,
    `  args  : ${JSON.stringify(mismatch.a1)} ${JSON.stringify(mismatch.a2)}`,
    `  python: ${JSON.stringify(mismatch.python)}`,
    `  js    : ${JSON.stringify(mismatch.js)}`,
  ].join("\n");
}

export { KNOWN_OPS };
