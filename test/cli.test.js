import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { cli } from "../src/cli.js";

describe("CliTest (ported from Python)", () => {
  test("CliTest test_shortuuid_command_produces_uuid", () => {
    let output;
    cli([], (value) => { output = value; });
    assert.equal(output.length, 22);
  });

  test("CliTest test_encode_command", () => {
    let output;
    cli(["encode", "3b1f8b40-222c-4a6e-b77e-779d5a94e21c"], (value) => { output = value; });
    assert.equal(output, "CXc85b4rqinB7s5J52TRYb");
  });

  test("CliTest test_decode_command", () => {
    let output;
    cli(["decode", "CXc85b4rqinB7s5J52TRYb"], (value) => { output = value; });
    assert.equal(output, "3b1f8b40-222c-4a6e-b77e-779d5a94e21c");
  });
});
