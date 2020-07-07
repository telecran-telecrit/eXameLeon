var traverse = require("../lib/babel/traversal");
var assert   = require("assert");
var _        = require("lodash");

suite("traverse", function () {
  var ast = {
    type: "Program",
    body: [
      {
        "type": "VariableDeclaration",
        "declarations": [
          {
            "type": "VariableDeclarator",
            "id": {
              "type": "Identifier",
              "name": "foo",
            },
            "init": {
              "type": "Literal",
              "value": "bar",
              "raw": "\'bar\'"
            }
          }
        ],
        "kind": "var"
      },
      {
        "type": "ExpressionStatement",
        "expression": {
          "type": "AssignmentExpression",
          "operator": "=",
          "left": {
            "type": "MemberExpression",
            "computed": false,
            "object": {
              "type": "ThisExpression"
            },
            "property": {
              "type": "Identifier",
              "name": "test"
            }
          },
          "right": {
            "type": "Literal",
            "value": "wow",
            "raw": "\'wow\'"
          }
        }
      }
    ]
  };

  var body = ast.body;

  test("traverse", function () {
    var expect = [
      body[0], body[0].declarations[0], body[0].declarations[0].id, body[0].declarations[0].init,
      body[1], body[1].expression, body[1].expression.left, body[1].expression.left.object, body[1].expression.left.property, body[1].expression.right
    ];

    var actual = [];

    traverse(ast, {
      enter: function (node) {
        actual.push(node);
      }
    });

    assert.deepEqual(actual, expect);
  });

  test("traverse falsy parent", function () {
    traverse(null, {
      enter: function () {
        throw new Error("should not be ran");
      }
    });
  });

  test("traverse blacklistTypes", function () {
    var expect = [
      body[0], body[0].declarations[0], body[0].declarations[0].id, body[0].declarations[0].init,
      body[1], body[1].expression, body[1].expression.right
    ];

    var actual = [];

    traverse(ast, {
      blacklist: ["MemberExpression"],
      enter: function (node) {
        actual.push(node);
      }
    });

    assert.deepEqual(actual, expect);
  });

  test("traverse replace", function () {
    var replacement = {
      type: "Literal",
      value: "foo"
    };
    var ast2 = _.cloneDeep(ast);

    traverse(ast2, {
      enter: function (node) {
        if (node.type === "ThisExpression") return replacement;
      }
    });

    assert.equal(ast2.body[1].expression.left.object, replacement);
  });

  test("hasType", function () {
    assert.ok(traverse.hasType(ast, null, "ThisExpression"));
    assert.ok(!traverse.hasType(ast, null, "ThisExpression", ["AssignmentExpression"]));

    assert.ok(traverse.hasType(ast, null, "ThisExpression"));
    assert.ok(traverse.hasType(ast, null, "Program"));

    assert.ok(!traverse.hasType(ast, null, "ThisExpression", ["MemberExpression"]));
    assert.ok(!traverse.hasType(ast, null, "ThisExpression", ["Program"]));

    assert.ok(!traverse.hasType(ast, null, "ArrowFunctionExpression"));
  });
});
