# 🐳 Teste do Dockerfile

## 📋 **Comandos para Testar**

### **1. Build da Imagem**
```bash
docker build -t atende-ai-test .
```

### **2. Testar Container Local**
```bash
docker run -p 3000:3000 --env-file .env atende-ai-test
```

### **3. Verificar Logs**
```bash
docker logs <container_id>
```

### **4. Testar Health Check**
```bash
curl http://localhost:3000/api/health
```

## 🔍 **Possíveis Problemas**

### **1. Health Check**
- **Problema**: Endpoint `/api/health` pode não existir
- **Solução**: Verificar se o endpoint está implementado

### **2. Frontend Build**
- **Problema**: Caminho do frontend pode estar errado
- **Solução**: Verificar se `frontend/dist` existe

### **3. Dependências**
- **Problema**: Algumas dependências podem estar faltando
- **Solução**: Verificar `package.json`

## 🚀 **Comandos Rápidos**

```bash
# 1. Build
docker build -t atende-ai-test .

# 2. Run
docker run -p 3000:3000 atende-ai-test

# 3. Test
curl http://localhost:3000/health
curl http://localhost:3000/api/health
```

## 📊 **Verificações**

### **✅ Estrutura Correta**
- ✅ Multi-stage build
- ✅ Health check
- ✅ Dependências do sistema
- ✅ Permissões corretas

### **⚠️ Pontos de Atenção**
- ⚠️ Endpoint `/api/health` deve existir
- ⚠️ Frontend deve estar em `frontend/`
- ⚠️ Backend deve estar em `backend/`
- ⚠️ Variáveis de ambiente devem estar configuradas 