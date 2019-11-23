// Copyright (C) 2017 Mozilla Corporation. All rights reserved.
// This code is governed by the license found in the LICENSE file.

/*---
esid: sec-atomics.store
description: Testing descriptor property of Atomics.store
includes: [propertyHelper.js]
features: [Atomics]
---*/
verifyProperty(Atomics, 'store', {
  enumerable: false,
  writable: true,
  configurable: true,
});
