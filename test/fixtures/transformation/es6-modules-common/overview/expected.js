"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

require("foo");

require("foo-bar");

require("./directory/foo-bar");

var foo = _interopRequire(require("foo2"));

var foo2 = _interopRequireWildcard(require("foo3"));

var bar = require("foo4").bar;

var bar2 = require("foo5").foo;

exports.test = test;
var test = 5;
exports.test = test;