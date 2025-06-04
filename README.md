# Atende AI - Sistema de Atendimento Automatizado

## Visão Geral
Este é um projeto full-stack que implementa um sistema de atendimento automatizado integrado com WhatsApp.

## Tecnologias Utilizadas

### Frontend
- **React**: Framework JavaScript para construção da interface
- **TypeScript**: Superset do JavaScript que adiciona tipagem estática
- **Vite**: Build tool e servidor de desenvolvimento
- **Tailwind CSS**: Framework CSS para estilização
- **Material-UI**: Biblioteca de componentes React
- **Socket.IO**: Para comunicação em tempo real

### Backend
- **Node.js**: Runtime JavaScript
- **Express**: Framework web para Node.js
- **Baileys**: Biblioteca para integração com WhatsApp
- **Supabase**: Plataforma de backend como serviço (BaaS)

## Estrutura do Projeto

### Diretórios Principais

#### `/src` - Frontend
- `/components`: Componentes React reutilizáveis
- `/pages`: Páginas da aplicação
- `/contexts`: Contextos React para gerenciamento de estado
- `/lib`: Utilitários e funções auxiliares
- `/config`: Arquivos de configuração

#### `/api` - Backend
- Endpoints da API REST
- Integrações com serviços externos

#### `/auth` - Autenticação
- Lógica de autenticação e autorização

### Arquivos Importantes

1. **`server.js`**: Servidor principal da aplicação
2. **`processScheduledMessages.js`**: Processamento de mensagens agendadas
3. **`vite.config.ts`**: Configuração do Vite
4. **`tailwind.config.js`**: Configuração do Tailwind CSS
5. **`Dockerfile`**: Configuração para containerização
6. **`railway.toml`**: Configuração para deploy no Railway

## Banco de Dados
O projeto utiliza o Supabase como banco de dados principal, que é uma plataforma open-source que oferece:
- Banco de dados PostgreSQL
- Autenticação
- Armazenamento de arquivos
- APIs em tempo real

## Funcionalidades Principais

### Frontend
- Interface de usuário moderna e responsiva
- Gerenciamento de conversas
- Visualização de QR Code para conexão com WhatsApp
- Sistema de autenticação
- Notificações em tempo real

### Backend
- Integração com WhatsApp via Baileys
- Processamento de mensagens agendadas
- API REST para comunicação com o frontend

## Scripts Disponíveis
- `npm start`: Inicia o servidor e o processador de mensagens
- `npm run dev`: Inicia o servidor de desenvolvimento
- `npm run build`: Compila o projeto para produção
- `npm run dev:all`: Inicia tanto o servidor quanto o frontend em modo de desenvolvimento

## Requisitos do Sistema
- Node.js >= 18.0.0
- NPM ou Yarn para gerenciamento de dependências

## Deploy
O projeto está configurado para deploy no Railway, com suporte a Docker para containerização.

## Segurança
- Autenticação via Supabase
- Variáveis de ambiente para configurações sensíveis
- CORS configurado para segurança

## Desenvolvimento
O projeto utiliza várias ferramentas de desenvolvimento:
- ESLint para linting
- TypeScript para tipagem estática
- PostCSS e Tailwind para estilização
- Vite para build e desenvolvimento
