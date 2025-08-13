import os
import sys
import esprima
import tiktoken

RELATIVE_PATH = '../uploads/'
ENCODING = tiktoken.get_encoding("cl100k_base")

script_dir = os.path.dirname(os.path.abspath(__file__))
file_name = sys.argv[1]
file_path = os.path.join(script_dir, RELATIVE_PATH, file_name)

if not os.path.isfile(file_path):
    print(f"Error: File not found: {file_path}")
    sys.exit(1)

with open(file_path, 'r', encoding='utf-8') as javascript_code:
    javascript_code = javascript_code.read()

total_tokens = []
total_string_tokens = []
tokens = esprima.tokenize(javascript_code, {
    'comment': False,
    'tolerant': False,
    'loc': False,
    'range': False,
    })

for token in tokens:
    if token.type == 'String':
        string_tokens = ENCODING.encode(token.value)
        for tok in string_tokens:
            total_string_tokens.append(ENCODING.decode([tok]))
    else:
        total_tokens.append(token)

print(f'Total code tokens (no strings): {len(total_tokens)}')
print(f'Total string tokens (no code): {len(total_string_tokens)}')

print(total_tokens)
print(total_string_tokens)

