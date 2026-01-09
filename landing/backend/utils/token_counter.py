import os
import sys
import esprima
import tiktoken
import tempfile
import re

# --- Config ---
IGNORE_DECORATOR = "//@token-ignore"
ENCODING = "cl100k_base"
ESPRIMA_OPTIONS = {
    "comment": False,
    "tolerant": False,
    "loc": False,
    "range": False,
}


# --- Utility ---
def read_file(file_path):
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"Error: File not found: {file_path}")
    with open(file_path, "r", encoding="utf-8") as file:
        return file.read()


# --- Ignore Decorator Detection ---
def detect_ignore_decorator(code):
    """
    Check if the code contains any ignore decorators.

    Returns:
        bool: True if ignore decorator is found, False otherwise
    """
    return IGNORE_DECORATOR in code


# --- Temporary File Creation ---
def create_filtered_code(code, allow_ignore=True):
    """
    Create filtered code, optionally removing lines marked with the ignore decorator.

    Args:
        code (str): The JavaScript code
        allow_ignore (bool): If True, apply ignore decorators. If False, ignore them.

    Returns:
        str: Filtered code
    """
    if not allow_ignore:
        # Don't filter anything, return original code
        return code

    lines = code.splitlines()
    filtered_lines = []
    ignoring = False

    for line in lines:
        stripped = line.strip()

        if stripped.startswith(IGNORE_DECORATOR):
            ignoring = True
            continue

        if ignoring:
            # Stop ignoring when blank line is found
            if stripped == "":
                ignoring = False

            continue

        filtered_lines.append(line)

    return "\n".join(filtered_lines)


# --- Token Counting ---
def count_tokens(javascript_code):
    """
    Count tokens in JavaScript code, separating code tokens and string tokens.

    Args:
        javascript_code (str): The JavaScript code to analyze

    Returns:
        tuple: (code_tokens_count, string_tokens_count)
    """
    if not javascript_code or not javascript_code.strip():
        return 0, 0

    encoding = tiktoken.get_encoding(ENCODING)
    code_tokens = []
    string_tokens = []

    try:
        tokens = esprima.tokenize(javascript_code, ESPRIMA_OPTIONS)

        for token in tokens:
            if token.type == "String":
                string_content = token.value[1:-1] if len(token.value) >= 2 else ""

                if not string_content:
                    string_tokens.append(0)
                else:
                    encoded_tokens = encoding.encode(string_content)
                    string_tokens.extend(encoded_tokens)
            else:
                code_tokens.append(token)

        return len(code_tokens), len(string_tokens)

    except Exception as e:
        raise ValueError(f"Failed to tokenize JavaScript code: {str(e)}")


def count_tokens_from_code(javascript_code, allow_ignore=True):
    """
    Count tokens in JavaScript code with optional ignore decorator support.

    Args:
        javascript_code (str): The JavaScript code to analyze
        allow_ignore (bool): If True, apply //@token-ignore decorators.
                            If False, count everything and warn if decorators detected.

    Returns:
        dict: {
            'code_tokens': int,
            'string_tokens': int,
            'total_tokens': int,
            'warning': str or None (warning message if ignore decorator detected but not allowed)
        }
    """
    if not javascript_code or not javascript_code.strip():
        return {
            'code_tokens': 0,
            'string_tokens': 0,
            'total_tokens': 0,
            'warning': None
        }

    # Check if ignore decorators are present
    has_ignore_decorator = detect_ignore_decorator(javascript_code)

    # Create filtered code based on allow_ignore flag
    filtered_code = create_filtered_code(javascript_code, allow_ignore)

    # Count tokens
    code_tokens, string_tokens = count_tokens(filtered_code)

    # Generate warning if decorator detected but not allowed
    warning = None
    if has_ignore_decorator and not allow_ignore:
        warning = "Warning: //@token-ignore decorators detected but are not allowed for submissions. All code will be counted."

    return {
        'code_tokens': code_tokens,
        'string_tokens': string_tokens,
        'total_tokens': code_tokens + string_tokens,
        'warning': warning
    }


def count_tokens_from_file(file_path, allow_ignore=True):
    """
    Count tokens from a JavaScript file with optional ignore decorator support.

    Args:
        file_path (str): Path to the JavaScript file
        allow_ignore (bool): If True, apply //@token-ignore decorators.
                            If False, count everything.

    Returns:
        dict: Same as count_tokens_from_code
    """
    try:
        code = read_file(file_path)
        return count_tokens_from_code(code, allow_ignore)
    except FileNotFoundError:
        raise FileNotFoundError(f"File not found: {file_path}")
    except Exception as e:
        raise ValueError(f"Failed to read file {file_path}: {str(e)}")


# --- Entry Point ---
if __name__ == "__main__":
    if len(sys.argv) < 2 or len(sys.argv) > 3:
        print("Usage: python token_counter.py <file_path> [--no-ignore]")
        sys.exit(1)

    file_path = sys.argv[1]
    allow_ignore = True

    if len(sys.argv) == 3 and sys.argv[2] == "--no-ignore":
        allow_ignore = False

    try:
        result = count_tokens_from_file(file_path, allow_ignore)
        sys.stdout.write(f"Total code tokens: {result['code_tokens']}\n")
        sys.stdout.write(f"Total string tokens: {result['string_tokens']}\n")
        sys.stdout.write(f"Total tokens: {result['total_tokens']}\n")

        if result['warning']:
            sys.stdout.write(f"\n{result['warning']}\n")
    except Exception as e:
        sys.stderr.write(f"Error: {str(e)}\n")
        sys.exit(1)
