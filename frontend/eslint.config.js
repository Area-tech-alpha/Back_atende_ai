import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";

import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    // Define os arquivos que o ESLint deve verificar
    files: ["**/*.{js,jsx,ts,tsx}"],
    // Ignora pastas comuns para evitar problemas de desempenho
    ignores: ["node_modules/", "dist/", "build/"],

    languageOptions: { 
      globals: globals.browser,
      parser: tsParser, 
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules, 
    }
  },
  pluginJs.configs.recommended,
  pluginReactConfig,
  {
    rules: {
      // Adicione suas regras personalizadas aqui, se necess\u00e1rio
    },
  },
];
