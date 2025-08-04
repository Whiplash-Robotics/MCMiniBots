import fs from "fs";
import parser from "@babel/parser";
import traverse from "@babel/traverse";
//const traverse = babelTraverse.default;

//0 - success
//1 - fail
//2 - invalid file
export function scanFile(filepath, allowedFilepath) {
  console.log(filepath);
  const colors = {
    reset: "\x1b[0m",
    white: "\x1b[37m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
  };

  const filePath = filepath; //process.argv[2];
  if (!filePath) {
    console.error(
      `${colors.red}Error: Please provide a file path to check.${colors.reset}`
    );
    return 2;
  }

  const code = fs.readFileSync(filePath, "utf-8");
  const lines = code.split(/\r?\n/);

  // Default to an empty allow-list if the file doesn't exist or is invalid
  let allowed_imports = [];
  try {
    allowed_imports = JSON.parse(
      fs.readFileSync(allowedFilepath, "utf-8")
    ).allowed;
  } catch (error) {
    console.error(
      `${colors.yellow}Warning: Could not read './allowed.json'. No imports will be allowed.${colors.reset}`
    );
  }

  console.log(
    `${colors.white}🔍 Checking ${colors.cyan}${filePath}${colors.white}...`
  );
  console.log(
    `${colors.white}Allowed imports: ${colors.yellow}[${allowed_imports.join(
      ", "
    )}]${colors.reset}`
  );

  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx", "dynamicImport"],
  });

  const illegalNodes = [];

  traverse(ast, {
    // Catches: import ... from '...'
    ImportDeclaration(path) {
      const { node } = path;
      const importName = node.source.value;
      if (!allowed_imports.includes(importName)) {
        illegalNodes.push({
          name: importName,
          position: node.loc,
          reason: "Disallowed import",
        });
      }
    },

    // Catches: require('...'), global.require('...'), eval(), and older forms of import()
    CallExpression(path) {
      const { node } = path;
      const callee = path.get("callee");

      // Handle `import()` which can be parsed as a CallExpression.
      // Modern Babel versions use the `ImportExpression` visitor instead.
      // This makes the script robust across different Babel versions.
      if (callee.isImport()) {
        if (
          node.arguments.length === 1 &&
          node.arguments[0].type === "StringLiteral"
        ) {
          const importName = node.arguments[0].value;
          if (!allowed_imports.includes(importName)) {
            illegalNodes.push({
              name: `import('${importName}')`,
              position: node.loc,
              reason: "Disallowed dynamic import",
            });
          }
        } else {
          illegalNodes.push({
            name: "import()",
            position: node.loc,
            reason: "Disallowed dynamic import with non-string argument",
          });
        }
        return; // Handled, no need for further checks on this node.
      }

      // Check for eval()
      if (callee.isIdentifier({ name: "eval" })) {
        illegalNodes.push({
          name: "eval()",
          position: node.loc,
          reason: "Forbidden call to eval",
        });
        return;
      }

      // Check for require()
      let isRequireCall = false;
      if (callee.isIdentifier({ name: "require" })) {
        isRequireCall = true;
      } else if (callee.isMemberExpression()) {
        const property = callee.get("property");
        const propValue = property.evaluate();
        if (propValue.confident && propValue.value === "require") {
          isRequireCall = true;
        }
      }

      if (isRequireCall) {
        if (
          node.arguments.length === 1 &&
          node.arguments[0].type === "StringLiteral"
        ) {
          const importName = node.arguments[0].value;
          if (!allowed_imports.includes(importName)) {
            illegalNodes.push({
              name: `require('${importName}')`,
              position: node.loc,
              reason: "Disallowed require",
            });
          }
        } else {
          illegalNodes.push({
            name: "require()",
            position: node.loc,
            reason: "Disallowed dynamic require",
          });
        }
      }
    },

    // Catches: import('...') in modern Babel versions
    ImportExpression(path) {
      const { node } = path;

      // Case 1: The import argument is not a simple string (e.g., import(variable))
      if (node.source.type !== "StringLiteral") {
        illegalNodes.push({
          name: "import([...])",
          position: node.loc,
          reason: "Disallowed dynamic import with a non-string argument",
        });
        return; // Exit, we've flagged this as illegal
      }

      // Case 2: The import argument is a string, so we check it against the allowlist
      const importName = node.source.value;
      if (!allowed_imports.includes(importName)) {
        illegalNodes.push({
          name: `import('${importName}')`,
          position: node.loc,
          reason: "Disallowed dynamic import",
        });
      }
    },
  });

  if (illegalNodes.length > 0) {
    console.log(
      `\n${colors.red}Your submission failed with ${illegalNodes.length} error(s)...${colors.reset}`
    );

    for (const issue of illegalNodes) {
      console.log(
        `\n${colors.white}${issue.reason} '${colors.yellow}${issue.name}${colors.white}' at (${colors.yellow}${issue.position.start.line}:${issue.position.start.column}${colors.white}) in ${colors.cyan}${filePath}${colors.white}:`
      );

      const startLine = issue.position.start.line;
      const endLine = issue.position.end.line;
      const startCol = issue.position.start.column;
      const endCol = issue.position.end.column;

      for (let i = startLine; i <= endLine; i++) {
        const line = lines[i - 1];
        if (line === undefined) continue;
        const gutter = `${colors.yellow}${i}${colors.white} | ${colors.white}`;
        const gutterWidth = `${i} | `.length;
        console.log(gutter + line);

        let highlight = "";
        if (startLine === endLine) {
          highlight =
            " ".repeat(startCol) +
            "^" +
            "~".repeat(Math.max(0, endCol - startCol - 1));
        } else if (i === startLine) {
          highlight =
            " ".repeat(startCol) +
            "^" +
            "~".repeat(Math.max(0, line.length - startCol));
        } else if (i === endLine) {
          highlight = "^" + "~".repeat(Math.max(0, endCol - 1));
        } else {
          highlight = "^" + "~".repeat(Math.max(0, line.length));
        }
        console.log(
          " ".repeat(gutterWidth) + colors.red + highlight + colors.reset
        );
      }
    }

    console.log(
      `\n${colors.red}Please fix the issues listed above to continue with your submission.${colors.reset}`
    );
    return 1;
  }

  console.log(`\n${colors.white}✅ Your submission passed...${colors.reset}`);
  return 0;
}
