import esprima


test = '/*const b = 2 */ \n const a = "abcfafasf";' #const b = 2; const c = 3; const d = a + b + c; console.log(d);'
tokens = esprima.tokenize(test, )

print(f'Tokens: {len(tokens)}')

for token in tokens:
    print(token)

