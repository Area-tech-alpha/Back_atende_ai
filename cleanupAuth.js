import fs from 'fs';
import path from 'path';
import { supabase } from './src/lib/supabase-backend.js';

console.log("=== LIMPEZA DE AUTENTICAÇÃO ===");

// Função para limpar pasta de autenticação
function cleanupAuthFolder(deviceId) {
  const authFolder = path.join(process.cwd(), "auth", deviceId);
  
  if (fs.existsSync(authFolder)) {
    try {
      fs.rmSync(authFolder, { recursive: true, force: true });
      console.log(`✅ Pasta de autenticação removida para: ${deviceId}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao remover pasta ${deviceId}:`, error.message);
      return false;
    }
  } else {
    console.log(`ℹ️ Pasta não encontrada para: ${deviceId}`);
    return true;
  }
}

// Função para verificar campanhas no banco
async function checkCampaigns() {
  console.log("\n=== VERIFICANDO CAMPANHAS NO BANCO ===");
  
  try {
    // Verificar todas as campanhas
    const { data: allCampaigns, error: allError } = await supabase
      .from("mensagem_evolution")
      .select("id, name, status, data_de_envio, device_id");
    
    if (allError) {
      console.error("❌ Erro ao buscar campanhas:", allError);
      return;
    }
    
    console.log(`📊 Total de campanhas no banco: ${allCampaigns?.length || 0}`);
    
    if (allCampaigns && allCampaigns.length > 0) {
      console.log("\n📋 Campanhas encontradas:");
      allCampaigns.forEach(campaign => {
        console.log(`  - ID: ${campaign.id} | Nome: ${campaign.name} | Status: ${campaign.status} | Device: ${campaign.device_id}`);
      });
      
      // Verificar campanhas com status null ou Scheduled
      const pendingCampaigns = allCampaigns.filter(c => c.status === null || c.status === 'Scheduled');
      console.log(`\n⏳ Campanhas pendentes (null/Scheduled): ${pendingCampaigns.length}`);
      
      if (pendingCampaigns.length > 0) {
        console.log("📋 Campanhas pendentes:");
        pendingCampaigns.forEach(campaign => {
          console.log(`  - ID: ${campaign.id} | Nome: ${campaign.name} | Status: ${campaign.status} | Device: ${campaign.device_id}`);
        });
      }
    }
    
  } catch (error) {
    console.error("❌ Erro ao verificar campanhas:", error);
  }
}

// Função principal
async function main() {
  console.log("🧹 Iniciando limpeza de autenticação...");
  
  // Listar pastas de autenticação
  const authDir = path.join(process.cwd(), "auth");
  if (fs.existsSync(authDir)) {
    const deviceFolders = fs.readdirSync(authDir);
    console.log(`📁 Pastas de autenticação encontradas: ${deviceFolders.length}`);
    
    for (const deviceId of deviceFolders) {
      console.log(`\n🔍 Verificando: ${deviceId}`);
      cleanupAuthFolder(deviceId);
    }
  } else {
    console.log("📁 Pasta auth não encontrada");
  }
  
  // Verificar campanhas
  await checkCampaigns();
  
  console.log("\n✅ Limpeza concluída!");
}

// Executar
main().catch(console.error); 