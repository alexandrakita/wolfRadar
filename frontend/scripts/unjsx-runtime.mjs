/**
 * Rewrites react/jsx-runtime _jsx/_jsxs call chains into normal JSX in .js sources.
 * Run: node scripts/unjsx-runtime.mjs <file-or-dir>
 */
import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";

function jsxNameFromArg(arg) {
  if (t.isIdentifier(arg)) return t.jsxIdentifier(arg.name);
  if (t.isStringLiteral(arg)) return t.jsxIdentifier(arg.value);
  if (t.isMemberExpression(arg)) {
    const { object, property } = arg;
    if (t.isIdentifier(object) && t.isIdentifier(property)) {
      return t.jsxMemberExpression(t.jsxIdentifier(object.name), t.jsxIdentifier(property.name));
    }
  }
  return t.jsxIdentifier("Unknown");
}

function valueToJsxAttrValue(expr) {
  if (t.isStringLiteral(expr)) {
    return expr;
  }
  if (t.isJSXElement(expr) || t.isJSXFragment(expr)) {
    return t.jsxExpressionContainer(expr);
  }
  return t.jsxExpressionContainer(expr);
}

/** @param {import('@babel/types').ObjectExpression | null | undefined} obj */
function propsToJsxAttrsAndChildren(obj) {
  const attributes = [];
  let childrenNode = null;
  if (!obj || !t.isObjectExpression(obj)) {
    return { attributes, childrenNode: null };
  }
  for (const prop of obj.properties) {
    if (t.isSpreadElement(prop)) {
      attributes.push(t.jsxSpreadAttribute(prop.argument));
      continue;
    }
    if (!t.isObjectProperty(prop) && !t.isObjectMethod(prop)) continue;
    if (t.isObjectMethod(prop)) continue;
    const key = prop.key;
    let name;
    if (t.isIdentifier(key)) name = key.name;
    else if (t.isStringLiteral(key)) name = key.value;
    else continue;
    if (name === "children") {
      childrenNode = prop.value;
      continue;
    }
    const jsxName = t.jsxIdentifier(name);
    if (name === "key" && t.isStringLiteral(prop.value)) {
      attributes.push(t.jsxAttribute(jsxName, t.stringLiteral(prop.value.value)));
      continue;
    }
    attributes.push(t.jsxAttribute(jsxName, valueToJsxAttrValue(prop.value)));
  }
  return { attributes, childrenNode };
}

function expressionToJsxChildren(expr) {
  if (!expr) return [];
  if (t.isArrayExpression(expr)) {
    const out = [];
    for (const el of expr.elements) {
      if (el == null) continue;
      if (t.isSpreadElement(el)) {
        out.push(t.jsxSpreadChild(el.argument));
        continue;
      }
      const c = expressionToJsxChildren(el);
      if (c.length) out.push(...c);
      else out.push(t.jsxExpressionContainer(el));
    }
    return out;
  }
  if (t.isCallExpression(expr)) {
    const replaced = tryReplaceJsxCall(expr);
    if (replaced) return [replaced];
  }
  if (t.isJSXElement(expr) || t.isJSXFragment(expr)) return [expr];
  if (t.isLogicalExpression(expr) && expr.operator === "&&") {
    return [t.jsxExpressionContainer(expr)];
  }
  if (t.isConditionalExpression(expr)) {
    return [t.jsxExpressionContainer(expr)];
  }
  if (t.isStringLiteral(expr) || t.isNumericLiteral(expr)) {
    return [t.jsxExpressionContainer(expr)];
  }
  return [t.jsxExpressionContainer(expr)];
}

/** @param {import('@babel/types').CallExpression} call */
function tryReplaceJsxCall(call) {
  if (!t.isIdentifier(call.callee)) return null;
  if (call.callee.name !== "_jsx" && call.callee.name !== "_jsxs") return null;
  const isJsxs = call.callee.name === "_jsxs";
  const typeArg = call.arguments[0];
  const propsArg = call.arguments[1];
  const keyArg = call.arguments[2];

  const name = jsxNameFromArg(typeArg);
  let { attributes, childrenNode } = propsToJsxAttrsAndChildren(
    t.isObjectExpression(propsArg) ? propsArg : null,
  );

  if (keyArg && t.isStringLiteral(keyArg)) {
    attributes.push(t.jsxAttribute(t.jsxIdentifier("key"), t.stringLiteral(keyArg.value)));
  }

  let children = [];
  if (childrenNode) {
    if (isJsxs && t.isArrayExpression(childrenNode)) {
      for (const el of childrenNode.elements) {
        if (el == null) continue;
        if (t.isCallExpression(el)) {
          const inner = tryReplaceJsxCall(el);
          if (inner) children.push(inner);
          else children.push(t.jsxExpressionContainer(el));
        } else if (t.isLogicalExpression(el) && el.operator === "&&") {
          children.push(t.jsxExpressionContainer(el));
        } else if (t.isConditionalExpression(el)) {
          children.push(t.jsxExpressionContainer(el));
        } else if (t.isJSXElement(el) || t.isJSXFragment(el)) {
          children.push(el);
        } else if (t.isStringLiteral(el) || t.isNumericLiteral(el)) {
          children.push(t.jsxExpressionContainer(el));
        } else {
          children.push(t.jsxExpressionContainer(el));
        }
      }
    } else {
      children = expressionToJsxChildren(childrenNode);
    }
  }

  const selfClosing = children.length === 0;
  const opening = t.jsxOpeningElement(name, attributes, selfClosing);
  if (selfClosing) {
    return t.jsxElement(opening, null, [], true);
  }
  const closing = t.jsxClosingElement(name);
  return t.jsxElement(opening, closing, children, false);
}

function stripPureComment(node) {
  if (node.leadingComments) {
    node.leadingComments = node.leadingComments.filter(
      (c) => !String(c.value).includes("__PURE__"),
    );
  }
}

function processFile(filePath) {
  const code = fs.readFileSync(filePath, "utf8");
  if (!code.includes("_jsx") && !code.includes("_jsxs")) {
    return false;
  }
  const ast = parse(code, {
    sourceType: "module",
    plugins: ["jsx"],
  });

  traverse.default(ast, {
    CallExpression(path) {
      stripPureComment(path.node);
    },
  });

  let mutated = false;
  traverse.default(ast, {
    Program(path) {
      path.scope.crawl();
      path.traverse({
        CallExpression(callPath) {
          const { node } = callPath;
          if (!t.isIdentifier(node.callee)) return;
          if (node.callee.name !== "_jsx" && node.callee.name !== "_jsxs") return;
          const replacement = tryReplaceJsxCall(node);
          if (replacement) {
            callPath.replaceWith(replacement);
            mutated = true;
          }
        },
      });
    },
  });

  // Drop jsx-runtime imports (named jsx/jsxs/jsxDEV only)
  traverse.default(ast, {
    ImportDeclaration(path) {
      const src = path.node.source.value;
      if (src !== "react/jsx-runtime" && src !== "react/jsx-dev-runtime") return;
      mutated = true;
      path.remove();
    },
  });

  if (!mutated) return false;

  const out = generate.default(ast, { retainLines: false, compact: false }, code).code;
  fs.writeFileSync(filePath, out + "\n", "utf8");
  return true;
}

function walkDir(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith(".")) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".next") continue;
      walkDir(full, files);
    } else if (ent.isFile() && ent.name.endsWith(".js")) {
      files.push(full);
    }
  }
  return files;
}

const target = process.argv[2] || path.join("src", "components");
const abs = path.isAbsolute(target) ? target : path.join(process.cwd(), target);

let count = 0;
if (fs.statSync(abs).isDirectory()) {
  for (const f of walkDir(abs)) {
    if (processFile(f)) {
      count++;
      console.log("rewrote", path.relative(process.cwd(), f));
    }
  }
} else {
  if (processFile(abs)) {
    count++;
    console.log("rewrote", path.relative(process.cwd(), abs));
  }
}
console.log("done,", count, "files");
