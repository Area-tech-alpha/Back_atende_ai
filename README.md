# Atende AI - Sistema de Disparo de Mensagens em Massa

## 🎯 Visão Geral
Este é um sistema completo de **disparo de mensagens em massa via WhatsApp** com funcionalidades avançadas de automação, chatbots e gerenciamento de campanhas. O projeto foi estruturado como um **monorepo** dividido em duas partes principais: **frontend** (React/TypeScript) e **backend** (Node.js/Express).

## 🏗️ Estrutura do Monorepo

```
atende_ai/
├── frontend/          # Aplicação React/TypeScript
│   ├── src/
│   │   ├── pages/     # Páginas da aplicação
│   │   ├── components/ # Componentes reutilizáveis
│   │   ├── contexts/  # Gerenciamento de estado
│   │   ├── lib/       # Utilitários e configurações
│   │   └── config/    # Configurações da aplicação
│   ├── package.json   # Dependências do frontend
│   └── vite.config.ts # Configuração do Vite
├── backend/           # Servidor Node.js/Express
│   ├── src/
│   │   ├── services/  # Serviços externos
│   │   ├── config/    # Configurações
│   │   └── lib/       # Utilitários
│   ├── utils/         # Utilitários do backend
│   ├── server.js      # Servidor principal
│   ├── processScheduledMessages.js # Worker de mensagens
│   └── package.json   # Dependências do backend
├── api/               # Endpoints da API
├── auth/              # Sistema de autenticação
├── Dockerfile         # Containerização completa
└── railway.toml       # Configuração Railway
```

## 🛠️ Stack Tecnológica

### **Frontend (React/TypeScript)**
- **React 18** + **TypeScript** - Interface moderna e tipada
- **Vite** - Build tool e servidor de desenvolvimento
- **Tailwind CSS** - Estilização utilitária
- **Material-UI** - Componentes React
- **React Router** - Navegação SPA
- **React Toastify** - Notificações
- **Lucide React** - Ícones

### **Backend (Node.js/Express)**
- **Node.js 20** - Runtime JavaScript
- **Express** - Framework web
- **Baileys** - Integração WhatsApp
- **Supabase** - Banco de dados PostgreSQL
- **Axios** - Cliente HTTP
- **QRCode** - Geração de QR Codes

### **Infraestrutura**
- **Railway** - Deploy e hospedagem
- **Docker** - Containerização
- **Supabase** - Backend as a Service
- **Mistral AI** - IA para chatbots

## 🗄️ Banco de Dados (Supabase)

### **Tabelas Principais**

#### **`login_evolution`** - Usuários
```sql
- id, email, senha, nome_da_instancia, apikey, id_instancia
```

#### **`mensagem_evolution`** - Campanhas
```sql
- id, name, texto, imagem, status, contatos, scheduled_date, delay
```

#### **`contato_evolution`** - Listas de Contatos
```sql
- id, name, contatos (JSON), relacao_login
```

#### **`envio_evolution`** - Envios
```sql
- id, id_mensagem, numero, status, delivered_at, error_message
```

## 🔧 Funcionalidades Principais

### **1. Sistema de Autenticação**
- Login/registro via Supabase
- Controle de sessão
- Proteção de rotas

### **2. Gerenciamento de Campanhas**
- Criação de campanhas
- Upload de contatos (CSV)
- Agendamento de envios
- Rascunhos salvos
- Templates de mensagens

### **3. Conexão WhatsApp**
- Múltiplas instâncias
- QR Code para conexão
- Status de conexão
- Reconexão automática

### **4. Disparo de Mensagens**
- Envio em massa
- Controle de duplicidade
- Retry automático
- Delay configurável
- Imagens e mídia

### **5. Chatbots Automáticos**
- Integração Mistral AI
- Personalidades configuráveis
- Respostas automáticas
- Contexto de conversa

### **6. Dashboard e Analytics**
- Estatísticas de envio
- Taxa de entrega
- Gráficos de performance
- Histórico de campanhas

## 🚀 Scripts Disponíveis

### **Desenvolvimento Local**
```bash
# Frontend
cd frontend
npm run dev          # Inicia servidor de desenvolvimento (porta 4000)

# Backend
cd backend
npm run dev          # Inicia servidor de desenvolvimento (porta 3001)
npm start            # Inicia servidor de produção
npm run start:worker # Inicia worker de mensagens agendadas
```

### **Build e Deploy**
```bash
# Build do frontend
cd frontend
npm run build

# Build completo (Docker)
docker build -t atende-ai .
```

## ⚙️ Configuração Local

### **1. Pré-requisitos**
- Node.js >= 20.0.0
- NPM ou Yarn
- Conta no Supabase
- Conta no Railway (para deploy)

### **2. Variáveis de Ambiente**

#### **Backend (.env)**
```env
SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico
MISTRAL_API_KEY=sua_chave_mistral
FRONTEND_URL=http://localhost:4000
PORT=3001
```

#### **Frontend (.env)**
```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

### **3. Setup Inicial**
```bash
# Clone o repositório
git clone <repository-url>
cd atende_ai

# Instalar dependências
cd frontend && npm install
cd ../backend && npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Iniciar desenvolvimento
cd ../frontend && npm run dev
cd ../backend && npm run dev
```

## 🐳 Deploy com Docker

### **Build da Imagem**
```bash
docker build -t atende-ai .
```

### **Executar Container**
```bash
docker run -p 3000:3000 \
  -e SUPABASE_URL=sua_url \
  -e SUPABASE_SERVICE_ROLE_KEY=sua_chave \
  -e MISTRAL_API_KEY=sua_chave_mistral \
  atende-ai
```

### **Railway Deploy**
O projeto está configurado para deploy automático no Railway:
- **Build**: Dockerfile multi-stage
- **Health Check**: `/health`
- **Restart Policy**: ON_FAILURE
- **Porta**: 3000

## 🔒 Segurança

### **Configurações de Segurança**
- **CORS** configurado para origens específicas
- **Variáveis de ambiente** para secrets
- **Autenticação** via Supabase
- **RLS** (Row Level Security) ativo
- **Rate limiting** implementado

### **Boas Práticas**
- Logs detalhados em todas as operações
- Controle de duplicidade em envios
- Retry automático com backoff exponencial
- Validação de dados em todas as APIs

## 📊 Monitoramento

### **Endpoints de Debug**
- `/api/health` - Status do servidor
- `/api/debug/caches` - Status dos caches
- `/api/debug/reconnections` - Status das reconexões
- `/api/debug/auto-cleanup` - Status do cleanup automático

### **Logs**
- Logs estruturados para todas as operações
- Rastreamento de erros centralizado
- Métricas de performance
- Alertas para falhas críticas

## 🚨 Limitações Conhecidas

### **Problemas Atuais**
- **Race conditions** em envios simultâneos
- **Cache local** pode causar inconsistências
- **Dependência** do Baileys para WhatsApp
- **Rate limiting** do WhatsApp

### **Melhorias Planejadas**
- **Constraint única** no banco para duplicidade
- **Lock distribuído** para concorrência
- **Monitoramento** mais robusto
- **Testes automatizados**
- **Plano de contingência** para Baileys

## 🛠️ Desenvolvimento

### **Estrutura de Desenvolvimento**
- **Frontend**: `http://localhost:4000`
- **Backend**: `http://localhost:3001`
- **Proxy**: Vite proxy para API
- **Hot Reload**: Configurado para ambos

### **Ferramentas de Desenvolvimento**
- **ESLint** - Linting de código
- **TypeScript** - Tipagem estática
- **PostCSS** - Processamento CSS
- **Tailwind** - Framework CSS
- **Vite** - Build e desenvolvimento

### **Fluxo de Desenvolvimento**
1. Desenvolvimento local com hot reload
2. Testes manuais das funcionalidades
3. Build de produção
4. Deploy automático no Railway
5. Monitoramento em produção

## 📚 Documentação Adicional

### **APIs Disponíveis**
- `/api/whatsapp/connect` - Conectar WhatsApp
- `/api/whatsapp/send` - Enviar mensagem
- `/api/whatsapp/status/:deviceId` - Status da conexão
- `/api/campaigns` - Gerenciar campanhas
- `/api/contacts` - Gerenciar contatos

### **Integrações**
- **Supabase** - Banco de dados e autenticação
- **Mistral AI** - Chatbots inteligentes
- **Railway** - Deploy e hospedagem
- **Baileys** - Integração WhatsApp

---

**Versão**: 2.0.0  
**Última Atualização**: Janeiro 2025  
**Licença**: MIT
