"use strict";

var x = function x(foo) {
  for (var _len = arguments.length, bar = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    bar[_key - 1] = arguments[_key];
  }

  console.log(bar);
};

var y = function y(foo) {
  for (var _len = arguments.length, bar = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    bar[_key - 1] = arguments[_key];
  }

  var x = function z(bar) {
    bar[1] = 5;
  };
};

var b = function b(x, y) {
  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  console.log(args[0]);
  args.pop();
  console.log(args[1]);
};

var z = function z(foo) {
  for (var _len = arguments.length, bar = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    bar[_key - 1] = arguments[_key];
  }

  var x = function x() {
    bar[1] = 5;
  };
};

var a = function a(foo) {
  for (var _len = arguments.length, bar = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    bar[_key - 1] = arguments[_key];
  }

  return bar.join(",");
};

var b = function b(foo) {
  for (var _len = arguments.length, bar = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    bar[_key - 1] = arguments[_key];
  }

  var join = "join";
  return bar[join];
};
