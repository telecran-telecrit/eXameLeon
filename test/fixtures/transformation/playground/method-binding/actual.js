var fn = obj#method;
var fn = obj#method("foob");
var fn = obj[foo]#method;
var fn = obj.foo#method;
var fn = obj[foo()]#method;

["foo", "bar"].map(#toUpperCase);
[1.1234, 23.53245, 3].map(#toFixed(2));

var get = function () {
  return 2;
};
[1.1234, 23.53245, 3].map(#toFixed(get()));
