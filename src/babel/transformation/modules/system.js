import DefaultFormatter from "./_default";
import AMDFormatter from "./amd";
import * as util from  "../../util";
import last from "lodash/array/last";
import each from "lodash/collection/each";
import map from "lodash/collection/map";
import * as t from "../../types";

var hoistVariablesVisitor = {
  enter(node, parent, scope, hoistDeclarators) {
    if (t.isFunction(node)) {
      // nothing inside is accessible
      return this.skip();
    }

    if (t.isVariableDeclaration(node)) {
      if (node.kind !== "var" && !t.isProgram(parent)) { // let, const
        // can't be accessed
        return;
      }

      // ignore block hoisted nodes as these can be left in
      if (node._blockHoist) return;

      var nodes = [];

      for (var i = 0; i < node.declarations.length; i++) {
        var declar = node.declarations[i];
        hoistDeclarators.push(t.variableDeclarator(declar.id));
        if (declar.init) {
          // no initializer so we can just hoist it as-is
          var assign = t.expressionStatement(t.assignmentExpression("=", declar.id, declar.init));
          nodes.push(assign);
        }
      }

      // for (var i in test)
      // for (var i = 0;;)
      if (t.isFor(parent)) {
        if (parent.left === node) {
          return node.declarations[0].id;
        }

        if (parent.init === node) {
          return t.toSequenceExpression(nodes, scope);
        }
      }

      return nodes;
    }
  }
};

var hoistFunctionsVisitor = {
  enter(node, parent, scope, handlerBody) {
    if (t.isFunction(node)) this.skip();

    if (t.isFunctionDeclaration(node) || node._blockHoist) {
      handlerBody.push(node);
      this.remove();
    }
  }
};

var runnerSettersVisitor = {
  enter(node, parent, scope, state) {
    if (node._importSource === state.source) {
      if (t.isVariableDeclaration(node)) {
        each(node.declarations, function (declar) {
          state.hoistDeclarators.push(t.variableDeclarator(declar.id));
          state.nodes.push(t.expressionStatement(
            t.assignmentExpression("=", declar.id, declar.init)
          ));
        });
      } else {
        state.nodes.push(node);
      }

      this.remove();
    }
  }
};

export default class SystemFormatter extends AMDFormatter {
  constructor(file) {
    this.exportIdentifier = file.scope.generateUidIdentifier("export");
    this.noInteropRequireExport = true;
    this.noInteropRequireImport = true;

    DefaultFormatter.apply(this, arguments);
  }

  init() {}

  _addImportSource(node, exportNode) {
    node._importSource = exportNode.source && exportNode.source.value;
    return node;
  }

  buildExportsWildcard(objectIdentifier, node) {
    var leftIdentifier = this.scope.generateUidIdentifier("key");
    var valIdentifier  = t.memberExpression(objectIdentifier, leftIdentifier, true);

    var left = t.variableDeclaration("var", [
      t.variableDeclarator(leftIdentifier)
    ]);

    var right = objectIdentifier;

    var block = t.blockStatement([
      t.expressionStatement(this.buildExportCall(leftIdentifier, valIdentifier))
    ]);

    return this._addImportSource(t.forInStatement(left, right, block), node);
  }

  buildExportsAssignment(id, init, node) {
    var call = this.buildExportCall(t.literal(id.name), init, true);
    return this._addImportSource(call, node);
  }

  remapExportAssignment(node) {
    return this.buildExportCall(t.literal(node.left.name), node);
  }

  buildExportCall(id, init, isStatement) {
    var call = t.callExpression(this.exportIdentifier, [id, init]);
    if (isStatement) {
      return t.expressionStatement(call);
    } else {
      return call;
    }
  }

  importSpecifier(specifier, node, nodes) {
    AMDFormatter.prototype.importSpecifier.apply(this, arguments);
    this._addImportSource(last(nodes), node);
  }

  buildRunnerSetters(block, hoistDeclarators) {
    var scope = this.file.scope;

    return t.arrayExpression(map(this.ids, function (uid, source) {
      var state = {
        hoistDeclarators: hoistDeclarators,
        source:           source,
        nodes:            []
      };

      scope.traverse(block, runnerSettersVisitor, state);

      return t.functionExpression(null, [uid], t.blockStatement(state.nodes));
    }));
  }

  transform(program) {
    var hoistDeclarators = [];
    var moduleName = this.getModuleName();
    var moduleNameLiteral = t.literal(moduleName);

    var block = t.blockStatement(program.body);

    var runner = util.template("system", {
      MODULE_DEPENDENCIES: t.arrayExpression(this.buildDependencyLiterals()),
      EXPORT_IDENTIFIER:   this.exportIdentifier,
      MODULE_NAME:         moduleNameLiteral,
      SETTERS:             this.buildRunnerSetters(block, hoistDeclarators),
      EXECUTE:             t.functionExpression(null, [], block)
    }, true);

    var handlerBody = runner.expression.arguments[2].body.body;
    if (!moduleName) runner.expression.arguments.shift();

    var returnStatement = handlerBody.pop();

    // hoist up all variable declarations
    this.file.scope.traverse(block, hoistVariablesVisitor, hoistDeclarators);

    if (hoistDeclarators.length) {
      var hoistDeclar = t.variableDeclaration("var", hoistDeclarators);
      hoistDeclar._blockHoist = true;
      handlerBody.unshift(hoistDeclar);
    }

    // hoist up function declarations for circular references
    this.file.scope.traverse(block, hoistFunctionsVisitor, handlerBody);

    handlerBody.push(returnStatement);

    program.body = [runner];
  }
}
