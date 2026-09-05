# shortuuid (JavaScript)

JavaScript port of [shortuuid](https://github.com/skorokithakis/shortuuid): concise,
unambiguous, URL-safe UUIDs. Pure ESM, no runtime dependencies, Node >= 18.

`shortuuid` generates UUIDs using the platform's `uuid` facilities and translates them
to base57 using lowercase and uppercase letters and digits, removing similar-looking
characters such as `l`, `1`, `I`, `O` and `0`.

The port is validated against the Python implementation itself: a golden corpus of 2926
deterministic cases (encode, decode, padding, alphabets, `int_to_string`/`string_to_int`
and v5 `uuid(name=...)`) is replayed and compared exactly.

## Install

There is no published npm package; use it from a checkout.

```bash
npm test          # run the ported unit suite
npm run parity    # replay the golden corpus against the port
npm run verify    # build + test + parity
```

```js
import shortuuid, { ShortUUID } from './src/shortuuid.js';
```

## Quick usage

```js
import { uuid, encode, decode, getAlphabet, setAlphabet } from 'shortuuid-js';
import { UUID, uuid4 } from 'shortuuid-js/uuid';

uuid();                       // 'vytxeTZskVKR7C7WgdSP3d'
uuid('example.com');          // v5 UUID in the DNS namespace -> short string

const u = uuid4();
decode(encode(u)).equals(u);  // true

getAlphabet();                // '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
```

Class-based usage, for per-instance alphabets:

```js
import { ShortUUID } from 'shortuuid-js';

const su = new ShortUUID('01345678');
su.uuid();
su.getAlphabet();             // '01345678'
```

Command-line:

```bash
node src/cli-bin.js                                   # random short UUID
node src/cli-bin.js encode 3b1f8b40-222c-4a6e-b77e-779d5a94e21c
node src/cli-bin.js decode CXc85b4rqinB7s5J52TRYb
node src/cli-bin.js decode --legacy <shortuuid>       # pre-1.0.0 (reversed) strings
```

## API mapping

Names are camelCased and Python keyword arguments become positional/optional arguments.
Behaviour is otherwise identical.

| Python | JavaScript |
| --- | --- |
| `shortuuid.uuid(name=None, pad_length=None)` | `uuid(name, padLength)` |
| `shortuuid.encode(uuid, pad_length=None)` | `encode(uuid, padLength)` |
| `shortuuid.decode(string, legacy=False)` | `decode(string, legacy)` |
| `shortuuid.random(length=None)` | `random(length)` |
| `shortuuid.get_alphabet()` / `set_alphabet(a, dont_sort_alphabet=False)` | `getAlphabet()` / `setAlphabet(a, dontSortAlphabet)` |
| `ShortUUID(alphabet=None, dont_sort_alphabet=False)` | `new ShortUUID(alphabet, dontSortAlphabet)` |
| `su.encoded_length(num_bytes=16)` | `su.encodedLength(numBytes)` |
| `int_to_string(n, alphabet, padding=None)` | `intToString(n, alphabet, padding)` |
| `string_to_int(s, alphabet, alphabet_index=None)` | `stringToInt(s, alphabet, alphabetIndex)` |
| `uuid.UUID`, `uuid.uuid4`, `uuid.uuid5` | `UUID`, `uuid4`, `uuid5` (from `shortuuid-js/uuid`) |

### Differences forced by the platform

**128-bit values are carried as `BigInt`.** Python's `uuid.UUID.int` is an arbitrary
precision integer; a JS `number` cannot hold 128 bits losslessly. The `UUID` class in
[src/uuid.js](src/uuid.js) stores `.int` as a `BigInt`, so `encode`/`decode` are exact.

**`uuid` is reimplemented, not imported.** Python relies on its standard-library `uuid`
module. Node has `crypto.randomUUID` but no v5 or integer-view API matching Python's, so
[src/uuid.js](src/uuid.js) provides a minimal RFC 4122 `UUID` (v4 via `crypto.randomBytes`,
v5 via SHA-1 over the namespace + name, the DNS and URL namespaces, and a `.int` view).

**Type checks raise `Error`.** Python raises `ValueError` on a non-`UUID` `encode`
argument, a non-`str` `decode` argument, a single-symbol alphabet, or a character outside
the alphabet. The port raises `Error` in the same places.

## Tests

```
npm test
```

22 tests, a one-for-one port of the Python `unittest` suite
(`shortuuid/test_shortuuid.py`): `LegacyShortUUIDTest`, `ClassShortUUIDTest`,
`ShortUUIDPaddingTest`, `EncodingEdgeCasesTest`, `DecodingEdgeCasesTest`, and `CliTest`.

## Verification against Python

`npm run parity` replays [parity/corpus.tsv](parity/corpus.tsv) — 2926 cases produced by
the reference Python `shortuuid` (see [parity/parity_dump.py](parity/parity_dump.py)) —
through the port and compares every result at full precision. The corpus is generated
from the exact upstream `master` source vendored under `parity/_vendor/`, because the
last released version on PyPI (1.0.11) predates the `dont_sort_alphabet` and
`alphabet_index` features this port targets.

## License

BSD-3-Clause; see COPYING.
