System.register([], function (_export) {
  return {
    setters: [],
    execute: function () {
      "use strict";

      _export("foo", foo);

      _export("foo", foo);

      _export("bar", bar);

      _export("bar", foo);

      _export("default", foo);

      _export("default", foo);

      _export("bar", bar);
    }
  };
});