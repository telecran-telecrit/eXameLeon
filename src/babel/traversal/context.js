import TraversalPath from "./path";
import flatten from "lodash/array/flatten";
import compact from "lodash/array/compact";
import * as t from "../types";

export default class TraversalContext {
  constructor(scope, opts, state, parentPath) {
    this.shouldFlatten = false;
    this.parentPath    = parentPath;
    this.scope         = scope;
    this.state         = state;
    this.opts          = opts;
  }

  flatten() {
    this.shouldFlatten = true;
  }

  visitNode(node, obj, key) {
    var iteration = TraversalPath.get(this.parentPath, this, node, obj, key);
    return iteration.visit();
  }

  visit(node, key) {
    var nodes = node[key];
    if (!nodes) return;

    if (!Array.isArray(nodes)) {
      return this.visitNode(node, node, key);
    }

    // nothing to traverse!
    if (nodes.length === 0) {
      return;
    }

    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i] && this.visitNode(node, nodes, i)) {
        return true;
      }
    }

    if (this.shouldFlatten) {
      node[key] = flatten(node[key]);

      if (t.FLATTENABLE_KEYS.indexOf(key) >= 0) {
        // we can safely compact this
        node[key] = compact(node[key]);
      }
    }
  }
}
