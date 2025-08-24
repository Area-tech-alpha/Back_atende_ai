import { getSupabaseClient } from '../src/services/whatsappService';

const supabase = getSupabaseClient();

export async function findAndFixDuplicateSends() {
  console.log('🔍 Verificando envios duplicados...');

  try {
    // Busca todos os envios
    const { data: sends, error } = await supabase
      .from('envio_evolution')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar envios:', error);
      return;
    }

    if (!sends || sends.length === 0) {
      console.log('ℹ️ Nenhum envio encontrado.');
      return;
    }

    console.log(`📊 Total de envios encontrados: ${sends.length}`);

    // Agrupa por campanha e contato
    const groupedSends = {};
    const duplicates = [];

    for (const send of sends) {
      const key = `${send.id_mensagem}_${send.contato}`;

      if (!groupedSends[key]) {
        groupedSends[key] = [];
      }

      groupedSends[key].push(send);

      // Se há mais de um envio para o mesmo contato na mesma campanha
      if (groupedSends[key].length > 1) {
        duplicates.push({
          key,
          sends: groupedSends[key]
        });
      }
    }

    if (duplicates.length === 0) {
      console.log('✅ Nenhum envio duplicado encontrado.');
      return;
    }

    console.log(`⚠️ Encontrados ${duplicates.length} grupos de envios duplicados.`);

    let totalRemoved = 0;

    for (const duplicate of duplicates) {
      const { sends } = duplicate;

      // Mantém apenas o primeiro envio (mais antigo)
      const toKeep = sends[0];
      const toRemove = sends.slice(1);

      console.log(`\n📝 Grupo: ${duplicate.key}`);
      console.log(`   Manter: ID ${toKeep.id} (${toKeep.created_at})`);
      console.log(`   Remover: ${toRemove.length} envios duplicados`);

      // Remove os envios duplicados
      for (const send of toRemove) {
        const { error: deleteError } = await supabase.from('envio_evolution').delete().eq('id', send.id);

        if (deleteError) {
          console.error(`   ❌ Erro ao remover envio ${send.id}:`, deleteError);
        } else {
          console.log(`   ✅ Removido envio ${send.id}`);
          totalRemoved++;
        }
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   Total de envios duplicados removidos: ${totalRemoved}`);
    console.log(`   Grupos processados: ${duplicates.length}`);
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

// Executa a verificação
findAndFixDuplicateSends()
  .then(() => {
    console.log('✅ Verificação concluída.');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
