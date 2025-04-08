class Node {
  toString() {
    return "";
  }
  evaluate() {
    throw new Error("Evaluate not implemented");
  }
  solve() {
    return this;
  }
  simplify() {
    return this;
  }
}

class SymbolNode extends Node {
  constructor(value) {
    super();
    this.value = value;
  }
  toString() {
    return this.value;
  }
  evaluate(variables = {}) {
    return variables[this.value] || 0;
  }
  simplify() {
    return this;
  }
}

class NumberNode extends Node {
  constructor(value) {
    super();
    this.value = value;
  }
  toString() {
    return this.value.toString();
  }
  evaluate() {
    return this.value;
  }
  simplify() {
    return this;
  }
}

class plusNode extends Node {
  constructor(left, right) {
    super();
    this.left = left;
    this.right = right;
  }
  toString() {
    const rightStr = this.right.toString();
    if (rightStr.startsWith("-")) {
      return `${this.left.toString()} - ${rightStr.slice(1)}`;
    }
    return `(${this.left.toString()} + ${rightStr})`;
  }
  evaluate(variables = {}) {
    return this.left.evaluate(variables) + this.right.evaluate(variables);
  }
  simplify() {
    const left = this.left.simplify();
    const right = this.right.simplify();

    const terms = collectTerms(this);
    const xCoef = terms.x || 0; // Fixed: Default to 0, not 1
    const constant = terms.constant || 0;

    if (xCoef === 0 && constant === 0) return new NumberNode(0);
    if (xCoef === 0) return new NumberNode(constant);
    if (constant === 0)
      return new multiplyNode(new NumberNode(xCoef), new SymbolNode("x"));

    const xTerm = new multiplyNode(new NumberNode(xCoef), new SymbolNode("x"));
    return new plusNode(xTerm, new NumberNode(constant));
  }
}

class minusNode extends Node {
  constructor(left, right) {
    super();
    this.left = left;
    this.right = right;
  }
  toString() {
    return `(${this.left.toString()} - ${this.right.toString()})`;
  }
  evaluate(variables = {}) {
    return this.left.evaluate(variables) - this.right.evaluate(variables);
  }
  simplify() {
    const left = this.left.simplify();
    const right = this.right.simplify();
    return new plusNode(
      left,
      new multiplyNode(new NumberNode(-1), right)
    ).simplify();
  }
}

class multiplyNode extends Node {
  constructor(left, right) {
    super();
    this.left = left;
    this.right = right;
  }
  toString() {
    if (
      this.left instanceof NumberNode &&
      this.left.value === -1 &&
      this.right instanceof SymbolNode
    ) {
      return `-${this.right.toString()}`;
    }
    return `(${this.left.toString()} * ${this.right.toString()})`;
  }
  evaluate(variables = {}) {
    return this.left.evaluate(variables) * this.right.evaluate(variables);
  }
  simplify() {
    const left = this.left.simplify();
    const right = this.right.simplify();
    if (right instanceof NumberNode && right.value === 1) return left;
    if (left instanceof NumberNode && left.value === 1) return right;
    if (right instanceof NumberNode && right.value === 0)
      return new NumberNode(0);
    if (left instanceof NumberNode && left.value === 0)
      return new NumberNode(0);
    if (left instanceof NumberNode && right instanceof NumberNode) {
      return new NumberNode(left.value * right.value);
    }
    return new multiplyNode(left, right);
  }
}

class EquationSolver {
  constructor(left, right) {
    this.left = left;
    this.right = right;
    console.log("EquationSolver initialized");
    console.log("Left side:", left.toString());
    console.log("Right side:", right.toString());
  }
  solveLinear() {
    const simplifiedLeft = this.left.simplify();
    const rightValue = this.right.evaluate();
    console.log("Simplified left:", simplifiedLeft.toString());

    if (!(simplifiedLeft instanceof plusNode)) {
      throw new Error("Left side must simplify to ax + b");
    }
    const term1 = simplifiedLeft.left;
    const term2 = simplifiedLeft.right;
    if (
      term1 instanceof multiplyNode &&
      term1.left instanceof NumberNode &&
      term1.right instanceof SymbolNode &&
      term2 instanceof NumberNode
    ) {
      const a = term1.left.evaluate();
      const b = term2.evaluate();
      if (a === 0) throw new Error("Coefficient 'a' cannot be zero");
      const x = (rightValue - b) / a;
      console.log("Solution found: x =", x);
      return x;
    }
    throw new Error("Equation not in solvable form (ax + b = c)");
  }
}

function collectTerms(node) {
  let xCoef = 0;
  let constant = 0;

  function traverse(n) {
    if (n instanceof plusNode) {
      traverse(n.left);
      traverse(n.right);
    } else if (n instanceof minusNode) {
      traverse(n.left);
      traverse(new multiplyNode(new NumberNode(-1), n.right));
    } else if (n instanceof multiplyNode) {
      if (
        n.left instanceof NumberNode &&
        n.right instanceof SymbolNode &&
        n.right.value === "x"
      ) {
        xCoef += n.left.value;
      } else if (
        n.left instanceof NumberNode &&
        n.right instanceof NumberNode
      ) {
        constant += n.left.value * n.right.value;
      }
    } else if (n instanceof NumberNode) {
      constant += n.value;
    } else if (n instanceof SymbolNode && n.value === "x") {
      xCoef += 1; // Fixed: Treat standalone x as 1 * x
    }
  }

  traverse(node);
  return { x: xCoef, constant };
}

function parseExpression(str) {
  str = str.trim();
  if (str.includes("=")) {
    console.log("Equation detected");
    const [left, right] = str.split("=").map((s) => s.trim());
    console.log("Left side:", left);
    console.log("Right side:", right);
    return {
      left: parseComplex(left),
      right: new NumberNode(parseFloat(right) || 0),
    };
  }
  return parseComplex(str);
}

function parseComplex(str) {
  if (!str) throw new Error("Empty expression");

  const tokens = tokenize(str);
  console.log("Tokens:", tokens);
  if (tokens.length === 0) throw new Error("No valid tokens");

  let root = parseTerm(tokens, 0);
  let i = root.tokensConsumed;

  while (i < tokens.length) {
    if (tokens[i] === "+" || tokens[i] === "-") {
      const nextTerm = parseTerm(tokens, i + 1);
      root =
        tokens[i] === "+"
          ? new plusNode(root, nextTerm)
          : new minusNode(root, nextTerm);
      i += 1 + nextTerm.tokensConsumed;
    } else {
      throw new Error(`Unexpected token: ${tokens[i]}`);
    }
  }

  return root;
}

function tokenize(str) {
  const operators = ["+", "-", "*", "="];
  const tokens = [];
  let current = "";

  for (let i = 0; i < str.length; i++) {
    if (operators.includes(str[i])) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      if (
        str[i] === "-" &&
        (i === 0 || operators.includes(str[i - 1])) &&
        i + 1 < str.length &&
        /\d/.test(str[i + 1])
      ) {
        current = "-";
      } else {
        tokens.push(str[i]);
      }
    } else {
      current += str[i];
    }
  }
  if (current) tokens.push(current);

  return tokens.filter((t) => t !== "");
}

function parseTerm(tokens, start) {
  if (start >= tokens.length) throw new Error("Invalid term: no tokens left");

  if (start + 2 < tokens.length && tokens[start + 1] === "*") {
    const coef = new NumberNode(parseFloat(tokens[start]));
    const varX = new SymbolNode(tokens[start + 2]);
    const node = new multiplyNode(coef, varX);
    node.tokensConsumed = 3;
    return node;
  } else {
    const value = parseFloat(tokens[start]);
    const node = isNaN(value)
      ? new SymbolNode(tokens[start])
      : new NumberNode(value);
    node.tokensConsumed = 1;
    return node;
  }
}

export {
  SymbolNode,
  NumberNode,
  plusNode,
  minusNode,
  multiplyNode,
  EquationSolver,
  parseExpression,
};
