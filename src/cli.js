/**
 * Command-line interface, mirroring shortuuid/cli.py.
 *
 * Usage:
 *   shortuuid                       generate a random short UUID
 *   shortuuid encode <uuid>         encode a UUID into a short UUID
 *   shortuuid decode <shortuuid>    decode a short UUID into a UUID
 *   shortuuid decode --legacy <s>   decode a pre-1.0.0 (reversed) short UUID
 *
 * `out` defaults to console.log; tests pass a capture function to inspect output,
 * mirroring the Python tests that patch `shortuuid.cli.print`.
 */

import { decode, encode, uuid } from "./shortuuid.js";
import { UUID } from "./uuid.js";

export function cli(argv = [], out = console.log) {
  const args = argv.slice();
  const command = args[0];

  if (command === "encode") {
    // argparse uses `type=UUID`, so the argument is parsed into a UUID first.
    out(encode(new UUID(args[1])));
  } else if (command === "decode") {
    let legacy = false;
    const rest = args.slice(1).filter((a) => {
      if (a === "--legacy") {
        legacy = true;
        return false;
      }
      return true;
    });
    out(String(decode(rest[0], legacy)));
  } else {
    // Maintain legacy behaviour: the top-level command generates a random shortuuid.
    out(uuid());
  }
}
