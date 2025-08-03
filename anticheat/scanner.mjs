import fs from 'fs';
import parser from '@babel/parser';
import babelTraverse from '@babel/traverse';
const traverse = babelTraverse.default;
//import { default as traverse } from '@babel/traverse';
//const traverse = require('@babel/traverse').default;

const colors = {
    reset: "\x1b[0m",
    white: "\x1b[37m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
};

const code = fs.readFileSync(process.argv[2], 'utf-8');
const lines = code.split(/\r?\n/);

const allowed_imports = JSON.parse(fs.readFileSync("./allowed.json", 'utf-8')).allowed;

console.log(allowed_imports);

const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
});

const imports = [];

traverse(ast, {
    ImportDeclaration({ node }) {
        imports.push({name: node.source.value, position: node.loc});
    },
    CallExpression({ node }) {
        if (
            node.callee.name === 'require' &&
            node.arguments.length === 1 &&
            node.arguments[0].type === 'StringLiteral'
        ) {
            imports.push({name: node.arguments[0].value, position: node.loc});
        }
    },
});

var passed = true;

for (let imp of imports) {

    if (!allowed_imports.includes(imp.name)) {
        passed = false;

        console.log(`\n${colors.white}Dissallowed import '${colors.white}${imp.name}${colors.white}' at (${colors.yellow}${imp.position.start.line}:${imp.position.start.column}${colors.white}) in ${colors.cyan}${process.argv[2]}${colors.white}:`);

        const startLine = imp.position.start.line;
        const endLine = imp.position.end.line;
        const startCol = imp.position.start.column;
        const endCol = imp.position.end.column;

        if (startLine === endLine) {
            console.log(`${colors.yellow}${startLine}${colors.white} | ${colors.white}` + lines[startLine - 1]);
            console.log(colors.red + ' '.repeat(startCol + ('' + startLine).length + 3) + '^' + '~'.repeat(endCol - startCol - 2) + '^' + colors.reset);
            continue;
        }

        for (let i = startLine; i <= endLine; i++) {
            const line = lines[i - 1];

            console.log(`${colors.yellow}${i}${colors.white} | ${colors.white}` + line);

            if (i === startLine) {
                console.log(colors.red + ' '.repeat(startCol + ('' + i).length + 3) + '^' + '~'.repeat(line.length - startCol - 2) + colors.reset);
            } else if (i === endLine) {
                console.log(colors.red + ' '.repeat(('' + i).length + 3) + '~'.repeat(endCol - 1) + '^' + colors.reset);
            } else {
                console.log(colors.red + ' '.repeat(('' + i).length + 3) + '~'.repeat(line.length) + colors.reset);
            }
        }
    }
}

if (!passed) {
    console.log(`${colors.white}Your submission failed...`);
    console.log("Remove the imports listed above to continue with your submission." + colors.reset);
    process.exit(0);
}

console.log(colors.white + 'Your submission passed...' + colors.reset);
