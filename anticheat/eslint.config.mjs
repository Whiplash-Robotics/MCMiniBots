import { defineConfig } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";

export default defineConfig([{
    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        globals: {
            ...globals.node,
        },

        parser: tsParser,
    },

    rules: {
        "no-restricted-imports": ["error", {
            paths: [{
                name: "*",
                message: "This import is not allowed. Use only: lodash, axios",
            }],

            patterns: ["*"],
        }],
    },
}, {
    files: ["**/*.js", "**/*.ts"],

    rules: {
        "no-restricted-imports": ["error", {
            paths: [],
            patterns: ["!lodash", "!axios", "*"],
        }],
    },
}]);