/**
 * CLI wrapper around the golden-corpus replay.
 *
 * Usage: node parity/replay.mjs <corpus.tsv>
 */
import { formatMismatch, replayCorpus } from "./replay-core.mjs";

const corpusPath = process.argv[2];
if (!corpusPath) {
  console.error("usage: node parity/replay.mjs <corpus.tsv>");
  process.exit(2);
}

const { total, counts, mismatches } = replayCorpus(corpusPath);

console.log(`parity corpus: ${total} cases from ${corpusPath}`);
for (const [op, count] of [...counts].sort()) {
  console.log(`  ${op.padEnd(18)} ${count}`);
}

if (mismatches.length > 0) {
  console.log(`\n${mismatches.length} MISMATCH(ES):`);
  for (const mismatch of mismatches.slice(0, 40)) {
    console.log("\n  " + formatMismatch(mismatch).split("\n").join("\n  "));
  }
  if (mismatches.length > 40) {
    console.log(`\n  ... and ${mismatches.length - 40} more`);
  }
  process.exit(1);
}

console.log(`\nPARITY OK - all ${total} cases match the Python implementation exactly.`);
