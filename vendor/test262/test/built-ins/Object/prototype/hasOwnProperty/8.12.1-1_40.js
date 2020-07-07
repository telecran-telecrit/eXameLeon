// Copyright (c) 2012 Ecma International.  All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
es5id: 8.12.1-1_40
description: >
    Properties - [[HasOwnProperty]] (configurable, non-enumerable
    inherited getter property)
---*/

var base = {};
Object.defineProperty(base, "foo", {
  get: function() {
    return 42;
  },
  configurable: true
});
var o = Object.create(base);

assert.sameValue(o.hasOwnProperty("foo"), false, 'o.hasOwnProperty("foo")');
