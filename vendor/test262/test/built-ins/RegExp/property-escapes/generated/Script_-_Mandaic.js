// Copyright 2019 Mathias Bynens. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
author: Mathias Bynens
description: >
  Unicode property escapes for `Script=Mandaic`
info: |
  Generated by https://github.com/mathiasbynens/unicode-property-escapes-tests
  Unicode v12.1.0
esid: sec-static-semantics-unicodematchproperty-p
features: [regexp-unicode-property-escapes]
includes: [regExpUtils.js]
---*/

const matchSymbols = buildString({
  loneCodePoints: [
    0x00085E
  ],
  ranges: [
    [0x000840, 0x00085B]
  ]
});
testPropertyEscapes(
  /^\p{Script=Mandaic}+$/u,
  matchSymbols,
  "\\p{Script=Mandaic}"
);
testPropertyEscapes(
  /^\p{Script=Mand}+$/u,
  matchSymbols,
  "\\p{Script=Mand}"
);
testPropertyEscapes(
  /^\p{sc=Mandaic}+$/u,
  matchSymbols,
  "\\p{sc=Mandaic}"
);
testPropertyEscapes(
  /^\p{sc=Mand}+$/u,
  matchSymbols,
  "\\p{sc=Mand}"
);

const nonMatchSymbols = buildString({
  loneCodePoints: [],
  ranges: [
    [0x00DC00, 0x00DFFF],
    [0x000000, 0x00083F],
    [0x00085C, 0x00085D],
    [0x00085F, 0x00DBFF],
    [0x00E000, 0x10FFFF]
  ]
});
testPropertyEscapes(
  /^\P{Script=Mandaic}+$/u,
  nonMatchSymbols,
  "\\P{Script=Mandaic}"
);
testPropertyEscapes(
  /^\P{Script=Mand}+$/u,
  nonMatchSymbols,
  "\\P{Script=Mand}"
);
testPropertyEscapes(
  /^\P{sc=Mandaic}+$/u,
  nonMatchSymbols,
  "\\P{sc=Mandaic}"
);
testPropertyEscapes(
  /^\P{sc=Mand}+$/u,
  nonMatchSymbols,
  "\\P{sc=Mand}"
);
