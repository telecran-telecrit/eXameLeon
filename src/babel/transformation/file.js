import convertSourceMap from "convert-source-map";
import shebangRegex from "shebang-regex";
import isFunction from "lodash/lang/isFunction";
import sourceMap from "source-map";
import transform from "./index";
import generate from "../generation";
import defaults from "lodash/object/defaults";
import includes from "lodash/collection/includes";
import assign from "lodash/object/assign";
import Logger from "./logger";
import parse from "../helpers/parse";
import Scope from "../traversal/scope";
import slash from "slash";
import * as util from  "../util";
import path from "path";
import each from "lodash/collection/each";
import * as t from "../types";

var checkTransformerVisitor = {
  enter(node, parent, scope, state) {
    checkNode(state.stack, node, scope);
  }
};

function checkNode(stack, node, scope) {
  each(stack, function (pass) {
    if (pass.shouldRun || pass.ran) return;
    pass.checkNode(node, scope);
  });
}

export default class File {
  constructor(opts) {
    this.dynamicImportedNoDefault = [];
    this.dynamicImportIds         = {};
    this.dynamicImported          = [];
    this.dynamicImports           = [];

    this.usedHelpers = {};
    this.dynamicData = {};
    this.data        = {};

    this.lastStatements = [];
    this.opts           = this.normalizeOptions(opts);
    this.log            = new Logger(this);
    this.ast            = {};

    this.buildTransformers();
  }

  static helpers = [
    "inherits",
    "defaults",
    "create-class",
    "create-computed-class",
    "apply-constructor",
    "tagged-template-literal",
    "tagged-template-literal-loose",
    "interop-require",
    "to-array",
    "to-consumable-array",
    "sliced-to-array",
    "object-without-properties",
    "has-own",
    "slice",
    "bind",
    "define-property",
    "async-to-generator",
    "interop-require-wildcard",
    "typeof",
    "extends",
    "get",
    "set",
    "class-call-check",
    "object-destructuring-empty",
    "temporal-undefined",
    "temporal-assert-defined",
    "self-global"
  ];

  static validOptions = [
    "filename",
    "filenameRelative",

    "blacklist",
    "whitelist",
    "optional",

    "loose",
    "playground",
    "experimental",

    "modules",
    "moduleIds",
    "moduleId",
    "resolveModuleSource",
    "keepModuleIdExtensions",

    "code",
    "ast",

    "comments",
    "compact",

    "auxiliaryComment",
    "externalHelpers",
    "returnUsedHelpers",

    "inputSourceMap",
    "sourceMap",
    "sourceMapName",
    "sourceFileName",
    "sourceRoot",
    "moduleRoot",

    // legacy
    "format",
    "reactCompat",

    // these are used by plugins
    "ignore",
    "only",
    "extensions",
    "accept"
  ];

  normalizeOptions(opts: Object) {
    opts = assign({}, opts);

    for (var key in opts) {
      if (key[0] !== "_" && File.validOptions.indexOf(key) < 0) {
        throw new ReferenceError(`Unknown option: ${key}`);
      }
    }

    defaults(opts, {
      keepModuleIdExtensions: false,
      resolveModuleSource:    null,
      returnUsedHelpers:      false,
      externalHelpers:        false,
      auxilaryComment:        "",
      inputSourceMap:         null,
      experimental:           false,
      reactCompat:            false,
      playground:             false,
      moduleIds:              false,
      blacklist:              [],
      whitelist:              [],
      sourceMap:              false,
      optional:               [],
      comments:               true,
      filename:               "unknown",
      modules:                "common",
      compact:                "auto",
      loose:                  [],
      code:                   true,
      ast:                    true
    });

    if (opts.inputSourceMap) {
      opts.sourceMap = true;
    }

    // normalize windows path separators to unix
    opts.filename = slash(opts.filename);
    if (opts.sourceRoot) {
      opts.sourceRoot = slash(opts.sourceRoot);
    }

    if (opts.moduleId) {
      opts.moduleIds = true;
    }

    opts.basename = path.basename(opts.filename, path.extname(opts.filename));

    opts.blacklist = util.arrayify(opts.blacklist);
    opts.whitelist = util.arrayify(opts.whitelist);
    opts.optional  = util.arrayify(opts.optional);
    opts.compact   = util.booleanify(opts.compact);
    opts.loose     = util.arrayify(opts.loose);

    if (includes(opts.loose, "all") || includes(opts.loose, true)) {
      opts.loose = Object.keys(transform.transformers);
    }

    defaults(opts, {
      moduleRoot: opts.sourceRoot
    });

    defaults(opts, {
      sourceRoot: opts.moduleRoot
    });

    defaults(opts, {
      filenameRelative: opts.filename
    });

    defaults(opts, {
      sourceFileName: opts.filenameRelative,
      sourceMapName:  opts.filenameRelative
    });

    if (opts.playground) {
      opts.experimental = true;
    }

    if (opts.externalHelpers) {
      this.set("helpersNamespace", t.identifier("babelHelpers"));
    }

    opts.blacklist = transform._ensureTransformerNames("blacklist", opts.blacklist);
    opts.whitelist = transform._ensureTransformerNames("whitelist", opts.whitelist);
    opts.optional  = transform._ensureTransformerNames("optional", opts.optional);
    opts.loose     = transform._ensureTransformerNames("loose", opts.loose);

    if (opts.reactCompat) {
      opts.optional.push("reactCompat");
      console.error("The reactCompat option has been moved into the optional transformer `reactCompat`");
    }

    var ensureEnabled = function (key) {
      var namespace = transform.transformerNamespaces[key];
      if (namespace === "es7") opts.experimental = true;
      if (namespace === "playground") opts.playground = true;
    };

    each(opts.whitelist, ensureEnabled);
    each(opts.optional, ensureEnabled);

    return opts;
  };

  isLoose(key: string) {
    return includes(this.opts.loose, key);
  }

  buildTransformers() {
    var file = this;

    var transformers = {};

    var secondaryStack = [];
    var stack = [];

    each(transform.transformers, function (transformer, key) {
      var pass = transformers[key] = transformer.buildPass(file);

      if (pass.canRun(file)) {
        stack.push(pass);

        if (transformer.secondPass) {
          secondaryStack.push(pass);
        }

        if (transformer.manipulateOptions) {
          transformer.manipulateOptions(file.opts, file);
        }
      }
    });

    this.transformerStack = stack.concat(secondaryStack);
    this.transformers = transformers;
  }

  getModuleFormatter(type: string) {
    var ModuleFormatter = isFunction(type) ? type : transform.moduleFormatters[type];

    if (!ModuleFormatter) {
      var loc = util.resolve(type);
      if (loc) ModuleFormatter = require(loc);
    }

    if (!ModuleFormatter) {
      throw new ReferenceError(`Unknown module formatter type ${JSON.stringify(type)}`);
    }

    return new ModuleFormatter(this);
  }

  parseInputSourceMap(code: string) {
    var opts = this.opts;

    if (opts.inputSourceMap !== false) {
      var inputMap = convertSourceMap.fromSource(code);
      if (inputMap) {
        opts.inputSourceMap = inputMap.toObject();
        code = convertSourceMap.removeComments(code);
      }
    }

    return code;
  }

  parseShebang(code: string) {
    var shebangMatch = shebangRegex.exec(code);

    if (shebangMatch) {
      this.shebang = shebangMatch[0];

      // remove shebang
      code = code.replace(shebangRegex, "");
    }

    return code;
  }

  set(key: string, val): any {
    return this.data[key] = val;
  };

  setDynamic(key: string, fn: Function) {
    this.dynamicData[key] = fn;
  }

  get(key: string): any {
    var data = this.data[key];
    if (data) {
      return data;
    } else {
      var dynamic = this.dynamicData[key];
      if (dynamic) {
        return this.set(key, dynamic());
      }
    }
  }

  addImport(source: string, name?: string, noDefault?: boolean): Object {
    name ||= source;
    var id = this.dynamicImportIds[name];

    if (!id) {
      id = this.dynamicImportIds[name] = this.scope.generateUidIdentifier(name);

      var specifiers = [t.importSpecifier(t.identifier("default"), id)];
      var declar = t.importDeclaration(specifiers, t.literal(source));
      declar._blockHoist = 3;

      this.dynamicImported.push(declar);
      if (noDefault) this.dynamicImportedNoDefault.push(declar);

      if (this.transformers["es6.modules"].canRun()) {
        this.moduleFormatter.importSpecifier(specifiers[0], declar, this.dynamicImports);
      } else {
        this.dynamicImports.push(declar);
      }
    }

    return id;
  }

  isConsequenceExpressionStatement(node: Object): boolean {
    return t.isExpressionStatement(node) && this.lastStatements.indexOf(node) >= 0;
  }

  attachAuxiliaryComment(node: Object): Object {
    var comment = this.opts.auxiliaryComment;
    if (comment) {
      node.leadingComments ||= [];
      node.leadingComments.push({
        type: "Line",
        value: " " + comment
      });
    }
    return node;
  }

  addHelper(name: string): Object {
    if (!includes(File.helpers, name)) {
      throw new ReferenceError(`Unknown helper ${name}`);
    }

    var program = this.ast.program;

    var declar = program._declarations && program._declarations[name];
    if (declar) return declar.id;

    this.usedHelpers[name] = true;

    var generator = this.get("helperGenerator");
    var runtime = this.get("helpersNamespace");
    if (generator) {
      return generator(name);
    } else if (runtime) {
      var id = t.identifier(t.toIdentifier(name));
      return t.memberExpression(runtime, id);
    } else {
      var ref = util.template(name);
      ref._compact = true;
      var uid = this.scope.generateUidIdentifier(name);
      this.scope.push({
        key: name,
        id: uid,
        init: ref
      });
      return uid;
    }
  }

  errorWithNode(node, msg, Error = SyntaxError) {
    var loc = node.loc.start;
    var err = new Error(`Line ${loc.line}: ${msg}`);
    err.loc = loc;
    return err;
  }

  addCode(code: string) {
    code = (code || "") + "";
    code = this.parseInputSourceMap(code);
    this.code = code;
    return this.parseShebang(code);
  }

  parse(code: string) {
    code = this.addCode(code);

    var opts = this.opts;

    opts.allowImportExportEverywhere = this.isLoose("es6.modules");
    opts.strictMode = this.transformers.strict.canRun();

    return parse(opts, code, (tree) => {
      this.transform(tree);
      return this.generate();
    });
  }

  transform(ast) {
    this.log.debug();

    this.ast = ast;
    this.lastStatements = t.getLastStatements(ast.program);
    this.scope = new Scope(ast.program, ast, null, this);

    var modFormatter = this.moduleFormatter = this.getModuleFormatter(this.opts.modules);
    if (modFormatter.init && this.transformers["es6.modules"].canRun()) {
      modFormatter.init();
    }

    this.checkNode(ast);

    this.call("pre");

    each(this.transformerStack, function (pass) {
      pass.transform();
    });

    this.call("post");
  }

  call(key: string) {
    var stack = this.transformerStack;
    for (var i = 0; i < stack.length; i++) {
      var transformer = stack[i].transformer;
      if (transformer[key]) {
        transformer[key](this);
      }
    }
  }

  checkNode(node, scope) {
    if (Array.isArray(node)) {
      for (var i = 0; i < node.length; i++) {
        this.checkNode(node[i], scope);
      }
      return;
    }

    var stack = this.transformerStack;
    scope ||= this.scope;

    checkNode(stack, node, scope);

    scope.traverse(node, checkTransformerVisitor, {
      stack: stack
    });
  }

  mergeSourceMap(map: Object) {
    var opts = this.opts;

    var inputMap = opts.inputSourceMap;

    if (inputMap) {
      map.sources[0] = inputMap.file;

      var inputMapConsumer = new sourceMap.SourceMapConsumer(inputMap);
      var outputMapConsumer = new sourceMap.SourceMapConsumer(map);
      var outputMapGenerator = sourceMap.SourceMapGenerator.fromSourceMap(outputMapConsumer);
      outputMapGenerator.applySourceMap(inputMapConsumer);

      var mergedMap = outputMapGenerator.toJSON();
      mergedMap.sources = inputMap.sources
      mergedMap.file = inputMap.file;
      return mergedMap;
    }

    return map;
  }

  generate(): {
    code: string;
    map?: Object;
    ast?: Object;
  } {
    var opts = this.opts;
    var ast  = this.ast;

    var result = {
      code: "",
      map: null,
      ast: null
    };

    if (this.opts.returnUsedHelpers) {
      result.usedHelpers = Object.keys(this.usedHelpers);
    }

    if (opts.ast) result.ast = ast;
    if (!opts.code) return result;

    var _result = generate(ast, opts, this.code);
    result.code = _result.code;
    result.map  = _result.map;

    if (this.shebang) {
      // add back shebang
      result.code = `${this.shebang}\n${result.code}`;
    }

    result.map = this.mergeSourceMap(result.map);

    if (opts.sourceMap === "inline" || opts.sourceMap === "both") {
      result.code += "\n" + convertSourceMap.fromObject(result.map).toComment();
    }

    if (opts.sourceMap === "inline") {
      result.map = null;
    }

    return result;
  }
}
