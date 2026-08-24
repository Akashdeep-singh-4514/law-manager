import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
    eslint.configs.recommended,

    ...tseslint.configs.recommended,

    {
        files: ["**/*.ts", "**/*.tsx"],

        rules: {
            // TypeScript
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],

            // General JS
            "no-console": "warn",
            "no-duplicate-imports": "error",
            "prefer-const": "error",
            "no-var": "error",
        },
    },

    // Disable rules that conflict with Prettier
    prettier,

    {
        ignores: [
            "node_modules/",
            "dist/",
            "build/",
            "coverage/",
            ".env",
            "*.config.js",
            "./tests/*"
        ],
    },
);