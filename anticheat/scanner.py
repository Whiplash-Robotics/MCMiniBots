import json
import sys
import esprima
import os

# ANSI color codes for terminal output
COLORS = {
    "reset": "\x1b[0m",
    "white": "\x1b[37m",
    "red": "\x1b[31m",
    "yellow": "\x1b[33m",
    "cyan": "\x1b[36m",
}


def scan_file(filepath, allowed_filepath):
    """
    Scans a JavaScript/TypeScript file for illegal imports, require calls, and eval usage.

    Args:
        filepath (str): The path to the file to scan.
        allowed_filepath (str): The path to the JSON file containing allowed imports.

    Returns:
        int: 0 for success, 1 for failure (illegal constructs found), 2 for invalid file path.
    """
    if not filepath or not os.path.exists(filepath):
        print(f"{COLORS['red']}Error: Please provide a valid file path to check.{COLORS['reset']}")
        return 2

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            code = f.read()
        lines = code.splitlines()
    except Exception as e:
        print(f"{COLORS['red']}Error: Could not read file '{filepath}': {e}{COLORS['reset']}")
        return 2

    allowed_imports = []
    try:
        with open(allowed_filepath, 'r', encoding='utf-8') as f:
            allowed_imports = json.load(f).get("allowed", [])
    except (FileNotFoundError, json.JSONDecodeError):
        print(
            f"{COLORS['yellow']}Warning: Could not read or parse '{allowed_filepath}'. No imports will be allowed.{COLORS['reset']}")

    print(f"{COLORS['white']}🔍 Checking {COLORS['cyan']}{filepath}{COLORS['white']}...")
    print(f"{COLORS['white']}Allowed imports: {COLORS['yellow']}[{', '.join(allowed_imports)}]{COLORS['reset']}")

    try:
        ast = esprima.parseModule(code, {'loc': True})
    except esprima.error.Error as e:
        print(f"\n{COLORS['red']}Your submission failed due to a syntax error...{COLORS['reset']}")
        print(f"{COLORS['white']}Error: {e.description} at (Line: {e.lineNumber}, Column: {e.column})")
        # You could add code snippet printing here as well if desired
        return 1

    illegal_nodes = []

    # --- AST Traversal and Node Visitors ---

    def visit(node):
        """Recursively visits each node in the AST."""
        if not isinstance(node, esprima.nodes.Node):
            return

        print(node)

        # --- Visitor Logic ---
        if node.type == 'ImportDeclaration':

            import_name = node.source.value
            if import_name not in allowed_imports:
                illegal_nodes.append({
                    "name": import_name,
                    "position": node.loc,
                    "reason": "Disallowed import"
                })

        elif node.type == 'ImportExpression':
            # Always disallow dynamic imports, whether awaited or not
            if node.source.type == 'Literal':
                import_name = node.source.value
                illegal_nodes.append({
                    "name": f"import('{import_name}')",
                    "position": node.loc,
                    "reason": "Disallowed dynamic import"
                })
            else:
                illegal_nodes.append({
                    "name": "import([...])",
                    "position": node.loc,
                    "reason": "Disallowed dynamic import (non-literal)"
                })

        elif node.type == "MemberExpression":
            # Example: window.alert, globalThis.setTimeout, etc.
            obj = node.object
            if obj.type == "Identifier" and obj.name in ["window", "globalThis", "global", "self"]:
                illegal_nodes.append({
                    "name": f"{obj.name}.{node.property.name if hasattr(node.property, 'name') else node.property.value}",
                    "position": node.loc,
                    "reason": "Disallowed access to global scope"
                })


        elif node.type == 'CallExpression':
            callee = node.callee

            if callee.type == "Import":
                illegal_nodes.append({
                    "name": "import(...)",
                    "position": node.loc,
                    "reason": "Disallowed dynamic import"
                })


            # Check for eval()
            if callee.type == 'Identifier' and callee.name == 'eval':
                illegal_nodes.append({
                    "name": "eval()",
                    "position": node.loc,
                    "reason": "Forbidden call to eval"
                })
                return  # Don't check children of an eval call

            # Check for require()
            is_require_call = False
            if callee.type == 'Identifier' and callee.name == 'require':
                is_require_call = True
            elif callee.type == 'MemberExpression':
                prop = callee.property
                # Catches obj.require
                is_direct_property = not callee.computed and prop.type == 'Identifier' and prop.name == 'require'
                # Catches obj['require']
                is_computed_property = callee.computed and prop.type == 'Literal' and prop.value == 'require'
                if is_direct_property or is_computed_property:
                    is_require_call = True

            if is_require_call:
                if len(node.arguments) == 1 and node.arguments[0].type == 'Literal':
                    import_name = node.arguments[0].value
                    if import_name not in allowed_imports:
                        illegal_nodes.append({
                            "name": f"require('{import_name}')",
                            "position": node.loc,
                            "reason": "Disallowed require"
                        })
                else:
                    illegal_nodes.append({
                        "name": "require()",
                        "position": node.loc,
                        "reason": "Disallowed dynamic require"
                    })

        # --- Recursive Traversal ---
        for key in dir(node):
            if not key.startswith('_'):
                child = getattr(node, key)
                if isinstance(child, list):
                    for item in child:
                        visit(item)
                else:
                    visit(child)

    visit(ast)

    # --- Reporting ---
    if illegal_nodes:
        print(f"\n{COLORS['red']}Your submission failed with {len(illegal_nodes)} error(s)...{COLORS['reset']}")
        for issue in illegal_nodes:
            pos = issue['position']
            start_line, end_line = pos.start.line, pos.end.line
            # Esprima columns are 0-indexed, matching string indexing
            start_col, end_col = pos.start.column, pos.end.column

            print(
                f"\n{COLORS['white']}{issue['reason']} '{COLORS['yellow']}{issue['name']}{COLORS['white']}' at ({COLORS['yellow']}{start_line}:{start_col}{COLORS['white']}) in {COLORS['cyan']}{filepath}{COLORS['white']}:")

            for i in range(start_line, end_line + 1):
                if i - 1 >= len(lines): continue
                line = lines[i - 1]
                gutter = f"{COLORS['yellow']}{i}{COLORS['white']} | {COLORS['white']}"
                gutter_width = len(f"{i} | ")
                print(gutter + line)

                highlight = ""
                if start_line == end_line:
                    highlight = ' ' * start_col + '^' + '~' * max(0, end_col - start_col - 1)
                elif i == start_line:
                    highlight = ' ' * start_col + '^' + '~' * max(0, len(line) - start_col)
                elif i == end_line:
                    highlight = '^' + '~' * max(0, end_col - 1)
                else:
                    highlight = '^' + '~' * max(0, len(line) - 1)

                print(' ' * gutter_width + COLORS['red'] + highlight + COLORS['reset'])

        print(f"\n{COLORS['red']}Please fix the issues listed above to continue with your submission.{COLORS['reset']}")
        return 1

    print(f"\n{COLORS['white']}✅ Your submission passed...{COLORS['reset']}")
    return 0


if __name__ == '__main__':
    # Example usage: python scan_imports.py ./my-file.js ./allowed.json
    if len(sys.argv) < 3:
        print(f"Usage: python {sys.argv[0]} <file_to_scan> <allowed_imports_json>")
        sys.exit(2)

    file_to_check = sys.argv[1]
    allowed_file = sys.argv[2]

    exit_code = scan_file(file_to_check, allowed_file)
    sys.exit(exit_code)
