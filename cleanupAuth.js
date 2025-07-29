import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script para limpar pastas de autenticação corrompidas do Baileys
 * Executar quando houver problemas de sincronização de estado
 */

const authDir = path.join(__dirname, 'auth');

console.log('🔧 Iniciando limpeza de autenticação do Baileys...');

if (!fs.existsSync(authDir)) {
  console.log('📁 Pasta auth não encontrada, criando...');
  fs.mkdirSync(authDir, { recursive: true });
  console.log('✅ Pasta auth criada com sucesso');
  process.exit(0);
}

try {
  const deviceFolders = fs.readdirSync(authDir);
  
  if (deviceFolders.length === 0) {
    console.log('📁 Pasta auth está vazia');
    process.exit(0);
  }

  console.log(`📁 Encontradas ${deviceFolders.length} pastas de dispositivos:`);
  
  let cleanedCount = 0;
  let keptCount = 0;

  for (const deviceId of deviceFolders) {
    const devicePath = path.join(authDir, deviceId);
    const credsFile = path.join(devicePath, 'creds.json');
    
    console.log(`\n🔍 Verificando dispositivo: ${deviceId}`);
    
    // Verificar se a pasta tem arquivos de credenciais válidos
    if (fs.existsSync(credsFile)) {
      try {
        const credsData = JSON.parse(fs.readFileSync(credsFile, 'utf8'));
        
        if (credsData.me && credsData.me.id) {
          console.log(`✅ Dispositivo ${deviceId}: Credenciais válidas encontradas`);
          keptCount++;
        } else {
          console.log(`❌ Dispositivo ${deviceId}: Credenciais inválidas, removendo...`);
          fs.rmSync(devicePath, { recursive: true, force: true });
          cleanedCount++;
        }
      } catch (error) {
        console.log(`❌ Dispositivo ${deviceId}: Erro ao ler credenciais, removendo...`);
        fs.rmSync(devicePath, { recursive: true, force: true });
        cleanedCount++;
      }
    } else {
      console.log(`❌ Dispositivo ${deviceId}: Arquivo de credenciais não encontrado, removendo...`);
      fs.rmSync(devicePath, { recursive: true, force: true });
      cleanedCount++;
    }
  }

  console.log(`\n📊 Resumo da limpeza:`);
  console.log(`✅ Dispositivos mantidos: ${keptCount}`);
  console.log(`🗑️ Dispositivos removidos: ${cleanedCount}`);
  console.log(`📁 Total de dispositivos processados: ${deviceFolders.length}`);

  if (cleanedCount > 0) {
    console.log('\n⚠️ ATENÇÃO: Alguns dispositivos foram removidos.');
    console.log('📱 Será necessário reconectar esses dispositivos via QR Code.');
  }

} catch (error) {
  console.error('❌ Erro durante a limpeza:', error);
  process.exit(1);
}

console.log('\n✅ Limpeza concluída com sucesso!'); 