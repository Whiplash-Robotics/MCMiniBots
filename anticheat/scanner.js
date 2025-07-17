const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const code = fs.readFileSync(process.argv[2], 'utf-8');
const allowed = JSON.parse(fs.readFileSync("./allowed.json", 'utf-8')).allowed;

const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
});

const imports = [];

traverse(ast, {
    ImportDeclaration({ node }) {
        imports.push(node.source.value);
    },
    CallExpression({ node }) {
        if (
            node.callee.name === 'require' &&
            node.arguments.length === 1 &&
            node.arguments[0].type === 'StringLiteral'
        ) {
            imports.push(node.arguments[0].value);
        }
    },
});

var passed = true;

for (imp of imports) {

    if (!allowed.includes(imp)) {
        console.log(`Dissallowed import: ${imp}`);
        passed = false;
    }

}

console.log(imports);

if (!passed) {

    console.log('Your submission failed...');
    console.log("Remove the imports listed above to continue with your submission.");
    process.exit(0);

}


console.log('Your submission passed...');
