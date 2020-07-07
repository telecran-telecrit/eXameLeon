"use strict";

var _core = require("babel-runtime/core-js")["default"];

var _regeneratorRuntime = require("babel-runtime/regenerator")["default"];

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

var _interopRequireWildcard = require("babel-runtime/helpers/interop-require-wildcard")["default"];

var giveWord = _regeneratorRuntime.mark(function giveWord() {
  return _regeneratorRuntime.wrap(function giveWord$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return myWord;

      case 2:
      case "end":
        return context$1$0.stop();
    }
  }, giveWord, this);
});

exports.giveWord = giveWord;
Object.defineProperty(exports, "__esModule", {
  value: true
});

var _someModule = require("someModule");

var foo = _interopRequire(_someModule);

var bar = _interopRequireWildcard(_someModule);

var myWord = _core.Symbol("abc");
exports.myWord = myWord;