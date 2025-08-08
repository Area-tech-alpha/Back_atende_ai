const globals = require("globals");
const js = require("@eslint/js");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const reactPlugin = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");

module.exports = [
  // Habilita as regras recomendadas do JavaScript (ESLint padrão)
  js.configs.recommended,
  
  // Habilita as regras recomendadas do TypeScript
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json", // Importante para regras que precisam de tipagem
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
    },
  },

  // Habilita as regras recomendadas do React, seguindo a nova flat config
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ...reactPlugin.configs.flat.recommended,
    // Adiciona o suporte para o novo JSX transform
    ...reactPlugin.configs.flat['jsx-runtime'],
    
    // Configurações compartilhadas
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

    // Desativa as regras que estão causando os erros no seu código
    rules: {
      // Regras que o linter estava reclamando
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off", // Desativa a regra para @ts-ignore
      "no-empty": "off",
      
      // Regras de React
      "react/jsx-uses-vars": "error", // Mantém essa regra importante
      "react-hooks/rules-of-hooks": "error", // Mantém essa regra importante
      "react-hooks/exhaustive-deps": "warn", // Mantém essa regra importante
      "react/react-in-jsx-scope": "off", // Desativado pelo 'jsx-runtime' acima, mas mantemos aqui para garantir
      
      // Regra para 'module' e '__dirname'
      "no-undef": "error"
    },
  },
  
  // Configuração para react-hooks
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks
    },
    rules: {
      ...reactHooks.configs.recommended.rules
    }
  }
];
