import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";
import prettier from "eslint-config-prettier/flat";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "lib/**",
      "**/dist/**",
      "docs/.vitepress/cache/**",
      "coverage/**",
      "packages/overlay/heatmap/vendor/**",
      "test-results/**",
      ".artifacts/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs["flat/recommended"],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, T: "readonly", VT: "readonly" },
      parserOptions: { parser: tseslint.parser }
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-expressions": ["error", { allowShortCircuit: true, allowTernary: true }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { args: "none", argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "vue/require-render-return": "off",
      "vue/require-explicit-emits": "off",
      "vue/multi-word-component-names": "off"
    }
  },
  { files: ["**/*.d.ts"], rules: { "@typescript-eslint/no-unused-vars": "off" } },
  prettier
);
