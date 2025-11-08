import os
import sys
import esprima
import tiktoken
import tempfile

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


# --- Temporary File Creation ---
# This function creates a temporary JavaScript file excluding lines marked with the ignore decorator.
def create_temp_ignored_file(code):
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

    # Create temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=True, suffix=".js", mode="w", encoding="utf-8")
    temp_file.write("\n".join(filtered_lines))
    temp_file.close()

    return temp_file.name


# --- Token Counting ---
# This function counts tokens in JavaScript code, separating code tokens and string tokens.
def count_tokens(javascript_code):
    encoding = tiktoken.get_encoding(ENCODING)
    code_tokens = []
    string_tokens = []

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


def tokenize_file(file_path):
    code = read_file(file_path)
    temp_path = create_temp_ignored_file(code)
    filtered_code = read_file(temp_path)
    return count_tokens(filtered_code)


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