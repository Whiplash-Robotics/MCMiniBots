import os
import sys
import esprima
import tiktoken

# --- Config ---
ENCODING = tiktoken.get_encoding("cl100k_base")
ESPRIMA_OPTIONS = {
    'comment': False,
    'tolerant': False,
    'loc': False,
    'range': False,
}

# --- Utility ---
def read_file(file_path):
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"Error: File not found: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()

# --- Token Counting ---
# This function counts tokens in JavaScript code, separating code tokens and string tokens.
def count_tokens(javascript_code):
    total_code_tokens = []
    total_string_tokens = []

    tokens = esprima.tokenize(javascript_code, ESPRIMA_OPTIONS)

    for token in tokens:
        if token.type == 'String':
            string_tokens = ENCODING.encode(token.value)
            for tok in string_tokens:
                total_string_tokens.append(ENCODING.decode([tok]))
        else:
            total_code_tokens.append(token)

    return total_code_tokens, total_string_tokens

def tokenize_file(file_path):
    code = read_file(file_path)
    return count_tokens(code)

# --- Entry Point ---
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python token_counter.py <file_path>")
        sys.exit(1)

    file_path = sys.argv[1]
    code_tokens, string_tokens = tokenize_file(file_path)
    print(f"Total code tokens: {len(code_tokens)}")
    print(f"Total string tokens: {len(string_tokens)}")


