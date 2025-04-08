// test.mjs
import { parseExpression, EquationSolver } from "./ast.mjs";

const expr = parseExpression("2 * x + 3 * x + 3 - 4");
console.log("Original:", expr.toString());
console.log("Simplified:", expr.simplify().toString());

const eq = parseExpression("2 * x + 3 * x + 3 - 4 = 0");
const solver = new EquationSolver(eq.left, eq.right);
console.log("Solution:", solver.solveLinear());
