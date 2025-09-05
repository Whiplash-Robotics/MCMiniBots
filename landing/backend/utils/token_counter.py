import esprima
import tiktoken

ENCODING = "cl100k_base"
ESPRIMA_OPTIONS = {
    "comment": False,
    "tolerant": False,
    "loc": False,
    "range": False,
}

def count_tokens_from_code(javascript_code):
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
                # Extract string content (remove quotes)
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

def count_tokens_from_file(file_path):
    """
    Count tokens from a JavaScript file.
    
    Args:
        file_path (str): Path to the JavaScript file
        
    Returns:
        tuple: (code_tokens_count, string_tokens_count)
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            code = file.read()
        return count_tokens_from_code(code)
    except FileNotFoundError:
        raise FileNotFoundError(f"File not found: {file_path}")
    except Exception as e:
        raise ValueError(f"Failed to read file {file_path}: {str(e)}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python token_counter.py <file_path>")
        sys.exit(1)

    file_path = sys.argv[1]

    try:
        code_tokens, string_tokens = count_tokens_from_file(file_path)
        print(f"Total code tokens: {code_tokens}")
        print(f"Total string tokens: {string_tokens}")
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)