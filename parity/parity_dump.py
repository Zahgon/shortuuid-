"""Generate a golden parity corpus from the reference Python `shortuuid`.

Every line records an operation, its inputs, and the exact result the Python
implementation produced. The JS side (parity/replay-core.mjs) replays each line
and asserts the port produces the identical output.

Only deterministic operations are recorded. `uuid()` without a name and
`random()` are cryptographically random, so they are excluded here (their
behaviour is covered by the unit tests instead). `uuid(name=...)` is v5 and
therefore deterministic, so it is included.

Columns are tab-separated: op, arg1, arg2, arg3, expected.
An empty column is written as the literal empty string.
"""

import sys
from uuid import UUID

import shortuuid
from shortuuid.main import ShortUUID, int_to_string, string_to_int

# A spread of alphabets: default, binary, hex-ish, base64, and a few odd ones.
ALPHABETS = [
    None,  # default base57
    "01",
    "0123456789",
    "0123456789abcdef",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
    "aaaaabcdefgh1230123",  # duplicates -> dedup+sort
    "abcdefg",
]

# Deterministic set of UUIDs to encode/decode. Seeded so runs are reproducible.
import random as _random

_random.seed(20240603)


def _rand_uuid_int():
    return _random.getrandbits(128)


NAMES = [
    "example.com",
    "http://www.example.com/",
    "HTTP://www.example.com/",
    "https://example.org/path?q=1",
    "sub.domain.example.net",
    "",
]


def emit(rows, op, a1="", a2="", a3="", expected=""):
    rows.append("\t".join([op, str(a1), str(a2), str(a3), str(expected)]))


def main():
    rows = []

    for alpha in ALPHABETS:
        su = ShortUUID(alpha)
        alpha_str = su.get_alphabet()

        # get_alphabet: sorted and unsorted dedup behaviour
        if alpha is not None:
            emit(rows, "get_alphabet", alpha, "0", "", ShortUUID(alpha).get_alphabet())
            su_ns = ShortUUID(alpha, dont_sort_alphabet=True)
            emit(rows, "get_alphabet", alpha, "1", "", su_ns.get_alphabet())

        # encoded_length for a few byte counts
        for nb in (16, 8, 4, 32):
            emit(rows, "encoded_length", alpha_str, nb, "", su.encoded_length(num_bytes=nb))

        # encode / decode round trips over many UUIDs
        for _ in range(200):
            n = _rand_uuid_int()
            u = UUID(int=n)
            enc = su.encode(u)
            emit(rows, "encode", alpha_str, str(u), "", enc)
            emit(rows, "decode", alpha_str, enc, "0", str(su.decode(enc)))

        # encode with explicit pad_length (including short/truncating pads)
        for pad in (1, 5, 22, 40):
            n = _rand_uuid_int()
            u = UUID(int=n)
            emit(rows, "encode_pad", alpha_str, str(u), pad, su.encode(u, pad_length=pad))

        # decode of truncated (short) strings -> MSB filled with 0
        n = _rand_uuid_int()
        u = UUID(int=n)
        enc = su.encode(u)
        for cut in (1, 3, 7):
            short = enc[:cut]
            emit(rows, "decode", alpha_str, short, "0", str(su.decode(short)))

        # legacy decode (reversed). A pre-1.0.0 (legacy) string is the reverse of a
        # new-style encoding, so feed reverse(enc): legacy decode reverses it back to
        # `enc` and decodes to the original value. Feeding `enc` directly would move
        # the padding zeros to the MSB end and overflow 128 bits (matching Python).
        legacy_input = enc[::-1]
        emit(rows, "decode", alpha_str, legacy_input, "1", str(su.decode(legacy_input, legacy=True)))

    # uuid(name=...) is v5, deterministic. Use default + one custom alphabet.
    for alpha in (None, "0123456789abcdef"):
        su = ShortUUID(alpha)
        alpha_str = su.get_alphabet()
        for name in NAMES:
            if name == "":
                continue
            emit(rows, "uuid_name", alpha_str, name, "", su.uuid(name=name))

    # int_to_string / string_to_int direct
    hex_alpha = "0123456789abcdef"
    for value in (0, 1, 15, 16, 255, 256, 65535, 2 ** 64, 2 ** 128 - 1):
        s = int_to_string(value, list(hex_alpha))
        emit(rows, "int_to_string", hex_alpha, value, "", s)
        if s:
            emit(rows, "string_to_int", hex_alpha, s, "", string_to_int(s, list(hex_alpha)))
    # int_to_string with padding
    for value, pad in ((16, 8), (0, 4), (255, 2)):
        emit(rows, "int_to_string_pad", hex_alpha, value, pad,
             int_to_string(value, list(hex_alpha), padding=pad))

    sys.stdout.write("\n".join(rows) + "\n")


if __name__ == "__main__":
    main()
