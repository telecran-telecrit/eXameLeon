// Copyright 2019 Mathias Bynens. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
author: Mathias Bynens
description: >
  Unicode property escapes for `Script_Extensions=Dogra`
info: |
  Generated by https://github.com/mathiasbynens/unicode-property-escapes-tests
  Unicode v12.1.0
esid: sec-static-semantics-unicodematchproperty-p
features: [regexp-unicode-property-escapes]
includes: [regExpUtils.js]
---*/

const matchSymbols = buildString({
  loneCodePoints: [],
  ranges: [
    [0x000964, 0x00096F],
    [0x00A830, 0x00A839],
    [0x011800, 0x01183B]
  ]
});
testPropertyEscapes(
  /^\p{Script_Extensions=Dogra}+$/u,
  matchSymbols,
  "\\p{Script_Extensions=Dogra}"
);
testPropertyEscapes(
  /^\p{Script_Extensions=Dogr}+$/u,
  matchSymbols,
  "\\p{Script_Extensions=Dogr}"
);
testPropertyEscapes(
  /^\p{scx=Dogra}+$/u,
  matchSymbols,
  "\\p{scx=Dogra}"
);
testPropertyEscapes(
  /^\p{scx=Dogr}+$/u,
  matchSymbols,
  "\\p{scx=Dogr}"
);

const nonMatchSymbols = buildString({
  loneCodePoints: [],
  ranges: [
    [0x00DC00, 0x00DFFF],
    [0x000000, 0x000963],
    [0x000970, 0x00A82F],
    [0x00A83A, 0x00DBFF],
    [0x00E000, 0x0117FF],
    [0x01183C, 0x10FFFF]
  ]
});
testPropertyEscapes(
  /^\P{Script_Extensions=Dogra}+$/u,
  nonMatchSymbols,
  "\\P{Script_Extensions=Dogra}"
);
testPropertyEscapes(
  /^\P{Script_Extensions=Dogr}+$/u,
  nonMatchSymbols,
  "\\P{Script_Extensions=Dogr}"
);
testPropertyEscapes(
  /^\P{scx=Dogra}+$/u,
  nonMatchSymbols,
  "\\P{scx=Dogra}"
);
testPropertyEscapes(
  /^\P{scx=Dogr}+$/u,
  nonMatchSymbols,
  "\\P{scx=Dogr}"
);
