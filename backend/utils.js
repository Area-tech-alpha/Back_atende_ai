import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Garante que o diretório auth existe
 */
export function ensureAuthDirExists() {
  const authDir = path.join(__dirname, 'auth');
  
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
    console.log('✅ Diretório auth criado');
  } else {
    console.log('✅ Diretório auth já existe');
  }
}

/**
 * Formata número de telefone para o padrão brasileiro
 */
export function formatPhoneNumber(phone) {
  let cleaned = String(phone || "").replace(/\D/g, "");
  if (!cleaned.startsWith("55")) {
    cleaned = "55" + cleaned;
  }
  return cleaned;
}

/**
 * Normaliza número de telefone
 */
export function normalizeNumber(phone) {
  let cleaned = String(phone || "").replace(/\D/g, "");
  if (!cleaned.startsWith("55")) cleaned = "55" + cleaned;
  // regra opcional: se vier 13 dígitos (55 + DDD + 9 + número), remove o 9
  if (cleaned.length === 13 && cleaned.startsWith("55")) {
    cleaned = cleaned.slice(0, 4) + cleaned.slice(5);
  }
  return cleaned;
}

/**
 * Obtém data e hora atual formatada
 */
export function getCurrentDateTime() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Valida se um número de telefone é válido
 */
export function isValidPhoneNumber(phone) {
  const cleaned = String(phone || "").replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 13;
}

/**
 * Gera um ID único
 */
export function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Limpa dados de autenticação de um dispositivo
 */
export function cleanupAuthData(deviceId) {
  const authFolder = path.join(__dirname, "auth", deviceId);
  
  if (fs.existsSync(authFolder)) {
    fs.rmSync(authFolder, { recursive: true, force: true });
    console.log(`🧹 Dados de autenticação limpos para deviceId=${deviceId}`);
    return true;
  }
  
  return false;
}

/**
 * Verifica se as credenciais estão válidas
 */
export function validateCredentials(deviceId) {
  const authFolder = path.join(__dirname, "auth", deviceId);
  const credsFile = path.join(authFolder, "creds.json");
  
  if (!fs.existsSync(credsFile)) {
    return false;
  }
  
  try {
    const credsData = JSON.parse(fs.readFileSync(credsFile, "utf8"));
    return !!(credsData.me && credsData.me.id);
  } catch (error) {
    console.error(`❌ Erro ao validar credenciais para ${deviceId}:`, error);
    return false;
  }
}
