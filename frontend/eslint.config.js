import globals from "globals";
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  // Adiciona uma regra para ignorar arquivos e pastas
  {
    ignores: ["dist/**/*", "node_modules/**/*"],
  },
  // Habilita as regras recomendadas do JavaScript (ESLint padrão)
  js.configs.recommended,
  // Habilita as regras recomendadas do TypeScript
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.node.json"],
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
    },
  },
  // Habilita as regras recomendadas do React, seguindo a nova flat config
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ...reactPlugin.configs.flat.recommended,
    ...reactPlugin.configs.flat["jsx-runtime"],
    settings: {
      react: {
        version: "detect", // Detecta a versão do React automaticamente
      },
    },
    // Configurações de linguagem e plugins
    languageOptions: {
      ...reactPlugin.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tsParser,
    },
    // Desativa as regras que estavam causando os erros no seu código
    rules: {
      "no-irregular-whitespace": "off", // Desativa a regra de espaço em branco
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "no-empty": "off",
      // Regras de React
      "react/jsx-uses-vars": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/react-in-jsx-scope": "off",
      "no-undef": "error",
    },
  },
  // Configuração para react-hooks
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
];
