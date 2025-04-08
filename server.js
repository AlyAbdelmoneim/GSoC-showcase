// server.js
import express from "express";
import { parseExpression, EquationSolver } from "./ast.mjs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Serve static files (e.g., index.html)
app.use(express.static("public")); // if index.html, script.js are in /public

// Middleware to parse JSON bodies
app.use(express.json());

// API endpoint for simplification
app.post("/simplify", (req, res) => {
  const { expression } = req.body;
  try {
    const parsed = parseExpression(expression);
    // If it's an equation, simplify the left side; otherwise, simplify the whole expression
    console.log("Parsed expression:", parsed.toString());
    const expr = parsed;
    console.log("Expression to simplify:", expr.toString());
    const simplified = expr.simplify();
    res.json({ result: simplified.toString() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// API endpoint for solving
app.post("/solve", (req, res) => {
  const { expression } = req.body;
  try {
    const parsed = parseExpression(expression);
    if (!parsed.left || !parsed.right) {
      throw new Error("Enter an equation with '='");
    }
    console.log("Parsed equation:", parsed);
    const solver = new EquationSolver(parsed.left, parsed.right);
    const solution = solver.solveLinear();
    res.json({ result: `x = ${solution}` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
