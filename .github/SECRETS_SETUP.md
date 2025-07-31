# 🔐 Configuração de Secrets para GitHub Actions

## Secrets Necessários

Para que o GitHub Actions funcione corretamente, você precisa configurar os seguintes secrets no seu repositório:

### 1. Railway Secrets
- **RAILWAY_TOKEN**: Token de autenticação do Railway
- **RAILWAY_PROJECT_ID**: ID do projeto no Railway

### Como Configurar:

1. Vá para seu repositório no GitHub
2. Clique em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione cada secret:

#### RAILWAY_TOKEN
```
Nome: RAILWAY_TOKEN
Valor: [Seu token do Railway]
```

#### RAILWAY_PROJECT_ID
```
Nome: RAILWAY_PROJECT_ID
Valor: [ID do seu projeto Railway]
```

### Como Obter os Valores:

#### Railway Token:
1. Acesse https://railway.app/
2. Vá em **Account** → **Tokens**
3. Clique em **New Token**
4. Copie o token gerado

#### Railway Project ID:
1. No Railway, vá para seu projeto
2. Clique em **Settings**
3. O Project ID estará visível na seção **General**

## Estrutura de Pastas do Projeto

```
atende_ai/
├── .github/
│   └── workflows/
│       ├── ci-cd.yml          # Pipeline principal
│       └── quick-deploy.yml   # Deploy rápido
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout/
│   │   │       └── Layout.tsx
│   │   ├── config/
│   │   │   └── api.ts
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   └── EvolutionContext.tsx
│   │   ├── lib/
│   │   │   └── supabase.ts
│   │   ├── pages/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.tsx
│   │   │   │   └── Signup.tsx
│   │   │   ├── Campaigns/
│   │   │   │   ├── components/
│   │   │   │   │   ├── CampaignCard.tsx
│   │   │   │   │   └── CampaignDetailsModal.tsx
│   │   │   │   ├── Campaigns.tsx
│   │   │   │   └── NewCampaign.tsx
│   │   │   ├── Contacts/
│   │   │   │   └── Contacts.tsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── components/
│   │   │   │   │   ├── CampaignTable.tsx
│   │   │   │   │   ├── OverviewChart.tsx
│   │   │   │   │   └── StatCard.tsx
│   │   │   │   └── Dashboard.tsx
│   │   │   ├── Settings/
│   │   │   │   └── Settings.tsx
│   │   │   ├── Templates/
│   │   │   │   └── Templates.tsx
│   │   │   ├── Chat.tsx
│   │   │   ├── Chat.css
│   │   │   ├── Chatbot.tsx
│   │   │   ├── ConnectWhatsApp.tsx
│   │   │   ├── Contacts.tsx
│   │   │   ├── CreateAgent.tsx
│   │   │   ├── Evolution.tsx
│   │   │   ├── EvolutionConfig.tsx
│   │   │   ├── NotFound.tsx
│   │   │   └── WhatsAppConnections.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.cjs
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── backend/
│   ├── auth/
│   │   └── 61991862232/
│   ├── assets/
│   │   └── modelo.csv
│   ├── routes/
│   │   └── api.js
│   ├── src/
│   │   ├── config/
│   │   │   └── chatbots.js
│   │   ├── lib/
│   │   └── services/
│   │       └── mistralService.js
│   ├── tests/
│   │   └── mistral-test.js
│   ├── utils/
│   │   ├── getCurrentDateTime.js
│   │   └── sendMessageWithRetry.js
│   ├── docker-test.md
│   ├── MUDANCAS_ESTRUTURA.md
│   ├── package.json
│   ├── package-lock.json
│   ├── Procfile
│   ├── quick-test.js
│   ├── railway.toml
│   ├── server.js
│   ├── supabase-backend.js
│   ├── utils.js
│   ├── processScheduledMessages.js
│   └── fixDuplicateSends.js
├── api/
│   └── whatsapp/
│       ├── connect.js
│       └── status/
│           └── [userId].js
├── dist/
│   ├── assets/
│   └── index.html
├── node_modules/
├── .gitignore
├── Dockerfile
└── README.md
```

## Jobs do GitHub Actions

### 1. **lint-and-type-check**
- Lint do frontend com ESLint
- Type check do TypeScript
- Verificação de sintaxe do backend

### 2. **build-frontend**
- Build do frontend com Vite
- Upload dos artefatos de build

### 3. **test-backend**
- Execução de testes do backend
- Verificação de saúde da API

### 4. **docker-build-test**
- Build da imagem Docker
- Teste da imagem com health checks

### 5. **deploy-railway**
- Deploy automático no Railway (apenas main)

### 6. **security-scan**
- Scan de vulnerabilidades com Trivy
- Upload dos resultados para GitHub Security

### 7. **dependency-check**
- Verificação de dependências desatualizadas

## Triggers

- **Push para main/develop**: Executa pipeline completo
- **Pull Request para main**: Executa testes e build
- **workflow_dispatch**: Execução manual
- **Push para develop/feature/***: Executa quick-deploy

## Cache

O workflow utiliza cache do npm para otimizar a instalação de dependências em todos os jobs. 