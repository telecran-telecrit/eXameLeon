// Copyright (C) 2016 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-dataview.prototype.getint16
description: >
  Return values from Buffer
info: |
  24.2.4.8 DataView.prototype.getInt16 ( byteOffset [ , littleEndian ] )

  1. Let v be the this value.
  2. If littleEndian is not present, let littleEndian be false.
  3. Return ? GetViewValue(v, byteOffset, littleEndian, "Int16").

  24.2.1.1 GetViewValue ( view, requestIndex, isLittleEndian, type )

  ...
  14. Let bufferIndex be getIndex + viewOffset.
  15. Return GetValueFromBuffer(buffer, bufferIndex, type, isLittleEndian).
  ...

  24.1.1.5 GetValueFromBuffer ( arrayBuffer, byteIndex, type [ , isLittleEndian
  ] )

  ...
  8. If isLittleEndian is false, reverse the order of the elements of rawValue.
  ...
features: [DataView.prototype.setUint8]
---*/

var buffer = new ArrayBuffer(8);
var sample = new DataView(buffer, 0);

sample.setUint8(0, 127);
sample.setUint8(1, 255);
sample.setUint8(2, 255);
sample.setUint8(3, 255);
sample.setUint8(4, 128);
sample.setUint8(5, 0);
sample.setUint8(6, 1);
sample.setUint8(7, 0);

assert.sameValue(sample.getInt16(0, false), 32767, "0, false");
assert.sameValue(sample.getInt16(1, false), -1, "1, false");
assert.sameValue(sample.getInt16(2, false), -1, "2, false");
assert.sameValue(sample.getInt16(3, false), -128, "3, false");
assert.sameValue(sample.getInt16(4, false), -32768, "4, false");
assert.sameValue(sample.getInt16(5, false), 1, "5, false");
assert.sameValue(sample.getInt16(6, false), 256, "8, false");

assert.sameValue(sample.getInt16(0, true), -129, "0, true");
assert.sameValue(sample.getInt16(1, true), -1, "1, true");
assert.sameValue(sample.getInt16(2, true), -1, "2, true");
assert.sameValue(sample.getInt16(3, true), -32513, "3, true");
assert.sameValue(sample.getInt16(4, true), 128, "4, true");
assert.sameValue(sample.getInt16(5, true), 256, "5, true");
assert.sameValue(sample.getInt16(6, true), 1, "6, true");
