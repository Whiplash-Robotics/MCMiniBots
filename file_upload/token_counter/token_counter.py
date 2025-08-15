import os
import sys
import esprima
import tiktoken

# --- Config ---
ENCODING = tiktoken.get_encoding("cl100k_base")
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


# --- Token Counting ---
# This function counts tokens in JavaScript code, separating code tokens and string tokens.
def count_tokens(javascript_code):
    code_tokens = []
    string_tokens = []

    tokens = esprima.tokenize(javascript_code, ESPRIMA_OPTIONS)

    for token in tokens:
        if token.type == "String":
            token.value = token.value.strip('"').strip("'")
            string_tokens = ENCODING.encode(token.value)
            for tok in string_tokens:
                string_tokens.append(ENCODING.decode([tok]))
        else:
            code_tokens.append(token)

    return len(code_tokens), len(string_tokens)


def tokenize_file(file_path):
    code = read_file(file_path)
    return count_tokens(code)


# --- Entry Point ---
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python token_counter.py <file_path>")
        sys.exit(1)

    file_path = sys.argv[1]

    try:
        code_tokens, string_tokens = tokenize_file(file_path)
        sys.stdout.write(f"Total code tokens: {code_tokens}\n")
        sys.stdout.write(f"Total string tokens: {string_tokens}\n")
    except Exception as e:
        sys.stderr.write(f"Error: {str(e)}\n")
        sys.exit(1)
