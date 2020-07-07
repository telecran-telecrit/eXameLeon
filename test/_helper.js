var esvalid = require("esvalid");
var util    = require("../lib/babel/util");
var path    = require("path");
var fs      = require("fs");
var _       = require("lodash");

var humanize = function (val, noext) {
  if (noext) val = path.basename(val, path.extname(val));
  return val.replace(/-/g, " ");
};

var readFile = exports.readFile = function (filename) {
  if (fs.existsSync(filename)) {
    var file = fs.readFileSync(filename, "utf8").trim();
    file = file.replace(/\r\n/g, "\n");
    return file;
  } else {
    return "";
  }
};

exports.esvalid = function (ast, code, loc) {
  var errors = esvalid.errors(ast);
  if (errors.length) {
    var msg = [];
    _.each(errors, function (err) {
      msg.push(err.message + " - " + util.inspect(err.node));
    });
    throw new Error(loc + ": " + msg.join(". ") + "\n" + code);
  }
};

exports.assertVendor = function (name) {
  if (!fs.existsSync(__dirname + "/../vendor/" + name)) {
    console.error("No vendor/" + name + " - run `make bootstrap`");
    process.exit(1);
  }
};

exports.get = function (entryName, entryLoc) {
  if (exports.cache[entryName]) return exports.cache[entryName];

  var suites = [];
  var entryLoc = entryLoc || __dirname + "/fixtures/" + entryName;

  _.each(fs.readdirSync(entryLoc), function (suiteName) {
    if (suiteName[0] === ".") return;

    var suite = {
      options: {},
      tests: [],
      title: humanize(suiteName),
      filename: entryLoc + "/" + suiteName
    };
    suites.push(suite);

    var suiteOptsLoc = util.resolve(suite.filename + "/options");
    if (suiteOptsLoc) suite.options = require(suiteOptsLoc);

    if (fs.statSync(suite.filename).isFile()) {
      push(suiteName, suite.filename);
    } else {
      _.each(fs.readdirSync(suite.filename), function (taskName) {
        var taskDir = suite.filename + "/" + taskName;
        push(taskName, taskDir);
      });
    }

    function push(taskName, taskDir) {
      // tracuer error tests
      if (taskName.indexOf("Error_") >= 0) return;

      var actualLocAlias = suiteName + "/" + taskName + "/actual.js";
      var expectLocAlias = suiteName + "/" + taskName + "/expected.js";
      var execLocAlias   = suiteName + "/" + taskName + "/exec.js";

      var actualLoc = taskDir + "/actual.js";
      var expectLoc = taskDir + "/expected.js";
      var execLoc   = taskDir + "/exec.js";

      if (fs.statSync(taskDir).isFile()) {
        var ext = path.extname(taskDir);
        if (ext !== ".js" && ext !== ".module.js") return;

        execLoc = taskDir;
      }

      var taskOpts = _.merge({
        filenameRelative: expectLocAlias,
        sourceFileName:   actualLocAlias,
        sourceMapName:    expectLocAlias
      }, _.cloneDeep(suite.options));

      var taskOptsLoc = util.resolve(taskDir + "/options");
      if (taskOptsLoc) _.merge(taskOpts, require(taskOptsLoc));

      var test = {
        title: humanize(taskName, true),
        disabled: taskName[0] === ".",
        options: taskOpts,
        exec: {
          loc: execLoc,
          code: readFile(execLoc),
          filename: execLocAlias,
        },
        actual: {
          loc: actualLoc,
          code: readFile(actualLoc),
          filename: actualLocAlias,
        },
        expect: {
          loc: expectLoc,
          code: readFile(expectLoc),
          filename: expectLocAlias
        }
      };

      // traceur checks

      var shouldSkip = function (code) {
        return code.indexOf("// Error:") >= 0 || code.indexOf("// Skip.") >= 0;
      };

      if (shouldSkip(test.actual.code) || shouldSkip(test.exec.code)) {
        return;
      } else if (test.exec.code.indexOf("// Async.") >= 0) {
        //test.options.asyncExec = true;
      }

      suite.tests.push(test);

      var sourceMappingsLoc = taskDir + "/source-mappings.json";
      if (fs.existsSync(sourceMappingsLoc)) {
        test.options.sourceMap = true;
        test.sourceMappings = require(sourceMappingsLoc);
      }

      var sourceMap = taskDir + "/source-map.json";
      if (fs.existsSync(sourceMap)) {
        test.options.sourceMap = true;
        test.sourceMap = require(sourceMap);
      }
    }
  });

  return exports.cache[entryName] = suites;
};

try {
  exports.cache = require("../tests.json");
} catch (err) {
  if (err.code !== "MODULE_NOT_FOUND") throw err;

  var cache = exports.cache = {};
  cache.transformation = exports.get("transformation");
  cache.generation     = exports.get("generation");
  cache.esnext         = exports.get("esnext");
}
