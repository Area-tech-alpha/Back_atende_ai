import globals from "globals";
import pluginJs from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

// Importa o plugin do React de forma mais robusta
import pluginReact from "eslint-plugin-react";

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
      "react": pluginReact, // Adiciona o plugin do React
    },
    rules: {
      ...tsPlugin.configs.recommended.rules, 
      ...pluginReact.configs.recommended.rules, // Usa a configura\u00e7\u00e3o recomendada do plugin do React
    }
  },
  pluginJs.configs.recommended,
  {
    rules: {
      // Adicione suas regras personalizadas aqui, se necess\u00e1rio
    },
  },
];
