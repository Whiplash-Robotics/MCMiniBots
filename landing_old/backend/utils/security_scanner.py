import json
import tempfile
import os
from typing import Dict, List, Any

# Default allowed imports - can be overridden by allowed.json file
DEFAULT_ALLOWED_IMPORTS = [
    "mineflayer",
    "pathfinding",
    "vec3",
    "util"
]

def scan_code(javascript_code: str, allowed_imports: List[str] = None) -> Dict[str, Any]:
    """
    Scan JavaScript code for security issues and disallowed imports.
    
    Args:
        javascript_code (str): The JavaScript code to scan
        allowed_imports (List[str]): List of allowed import names
        
    Returns:
        Dict containing scan results with status and errors
    """
    if allowed_imports is None:
        allowed_imports = DEFAULT_ALLOWED_IMPORTS.copy()
    
    try:
        # Create temporary file for the code
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as temp_file:
            temp_file.write(javascript_code)
            temp_file_path = temp_file.name
        
        # Create temporary allowed.json file
        allowed_json = {"allowed": allowed_imports}
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as allowed_file:
            json.dump(allowed_json, allowed_file)
            allowed_file_path = allowed_file.name
        
        # Import the scanning logic (adapted from the provided client-side script)
        result = _scan_javascript_file(temp_file_path, allowed_file_path)
        
        # Clean up temporary files
        os.unlink(temp_file_path)
        os.unlink(allowed_file_path)
        
        return result
        
    except Exception as e:
        return {
            'status': 2,
            'message': 'Failed to scan code',
            'error': str(e)
        }

def _scan_javascript_file(file_path: str, allowed_file_path: str) -> Dict[str, Any]:
    """
    Internal function to scan a JavaScript file using similar logic to the client-side scanner.
    This is a simplified Python version of the JavaScript scanner provided.
    """
    import re
    
    try:
        # Read the code
        with open(file_path, 'r', encoding='utf-8') as f:
            code = f.read()
            
        # Read allowed imports
        with open(allowed_file_path, 'r', encoding='utf-8') as f:
            allowed_data = json.load(f)
            allowed_imports = allowed_data.get('allowed', [])
    
        # Simple regex-based scanning for common patterns
        # This is a simplified version - the full implementation would use AST parsing
        
        issues = []
        lines = code.split('\n')
        
        for line_num, line in enumerate(lines, 1):
            # Check for require() calls
            require_matches = re.findall(r"require\s*\(\s*['\"]([^'\"]+)['\"]\s*\)", line)
            for match in require_matches:
                if match not in allowed_imports:
                    issues.append({
                        'line': line_num,
                        'type': 'disallowed_require',
                        'import': match,
                        'reason': f"Disallowed require('{match}')"
                    })
            
            # Check for import statements
            import_matches = re.findall(r"import\s+.*?\s+from\s+['\"]([^'\"]+)['\"]", line)
            for match in import_matches:
                if match not in allowed_imports:
                    issues.append({
                        'line': line_num,
                        'type': 'disallowed_import',
                        'import': match,
                        'reason': f"Disallowed import from '{match}'"
                    })
            
            # Check for dynamic imports
            dynamic_import_matches = re.findall(r"import\s*\(\s*['\"]([^'\"]+)['\"]\s*\)", line)
            for match in dynamic_import_matches:
                if match not in allowed_imports:
                    issues.append({
                        'line': line_num,
                        'type': 'disallowed_dynamic_import',
                        'import': match,
                        'reason': f"Disallowed dynamic import('{match}')"
                    })
            
            # Check for eval()
            if re.search(r'\beval\s*\(', line):
                issues.append({
                    'line': line_num,
                    'type': 'forbidden_eval',
                    'reason': "Forbidden call to eval()"
                })
        
        if issues:
            return {
                'status': 1,  # Failed scan
                'message': f'Code scan failed with {len(issues)} issue(s)',
                'errors': issues
            }
        else:
            return {
                'status': 0,  # Success
                'message': 'Code scan passed'
            }
            
    except Exception as e:
        return {
            'status': 2,  # Invalid/error
            'message': 'Failed to scan file',
            'error': str(e)
        }

def get_allowed_imports() -> List[str]:
    """Get the current list of allowed imports."""
    return DEFAULT_ALLOWED_IMPORTS.copy()

def update_allowed_imports(new_allowed: List[str]) -> None:
    """Update the list of allowed imports (for admin use)."""
    global DEFAULT_ALLOWED_IMPORTS
    DEFAULT_ALLOWED_IMPORTS = new_allowed.copy()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python security_scanner.py <file_path> [allowed_imports_file]")
        sys.exit(1)
    
    file_path = sys.argv[1]
    allowed_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Read code from file
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            code = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)
    
    # Read allowed imports if provided
    allowed_imports = None
    if allowed_file:
        try:
            with open(allowed_file, 'r', encoding='utf-8') as f:
                allowed_data = json.load(f)
                allowed_imports = allowed_data.get('allowed', [])
        except Exception as e:
            print(f"Warning: Could not read allowed imports file: {e}")
    
    result = scan_code(code, allowed_imports)
    
    if result['status'] == 0:
        print("✅ Code scan passed")
        sys.exit(0)
    else:
        print("❌ Code scan failed")
        print(result.get('message', ''))
        if 'errors' in result:
            for error in result['errors']:
                print(f"Line {error['line']}: {error['reason']}")
        sys.exit(1)