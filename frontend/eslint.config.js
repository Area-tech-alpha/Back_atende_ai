const globals = require("globals");
const pluginJs = require("@eslint/js");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const pluginReact = require("eslint-plugin-react");
const pluginReactHooks = require("eslint-plugin-react-hooks");

module.exports = [
  {
    // A configuração para arquivos .js, .jsx, .ts, .tsx
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["node_modules/", "dist/", "build/"],

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node, // Adicionado para reconhecer 'module' e '__dirname'
      },
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
      "react": pluginReact,
      "react-hooks": pluginReactHooks
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      // --- Ajustes para desativar regras problemáticas ---
      "no-unused-vars": "off", // Desativa para todas as linguagens
      "@typescript-eslint/no-unused-vars": "off", // Desativa para TypeScript
      "react/react-in-jsx-scope": "off", // Desativa a regra obsoleta do React
      "react/jsx-uses-react": "off", // Desativa a regra obsoleta do React
      "@typescript-eslint/ban-ts-comment": ["error", { "ts-ignore": "allow-with-description" }], // Permite @ts-ignore, mas com uma descrição
      "@typescript-eslint/no-explicit-any": "off", // Desativa a regra de `any`
      "no-empty": "off", // Desativa a regra de blocos vazios
      "no-undef": "error"
      // --- Fim dos ajustes ---
    }
  },
  pluginJs.configs.recommended,
  {
    rules: {
      // Regras personalizadas adicionais
    },
  },
];
