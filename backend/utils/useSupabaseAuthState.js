import { proto, BufferJSON } from '@whiskeysockets/baileys';

// Função principal que será usada no whatsappService.js
export async function useSupabaseAuthState(supabase, sessionId) {
  const KEY_MAP = {
    'pre-key': 'preKeys',
    session: 'sessions',
    'sender-key': 'senderKeys',
    'app-state-sync-key': 'appStateSyncKeys',
    'app-state-sync-version': 'appStateVersions',
    'sender-key-memory': 'senderKeyMemory',
  };

  // Função para ler os dados do Supabase
  const readData = async (id) => {
    try {
      const { data, error } = await supabase
        .from('baileys_auth_store')
        .select('session_data')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = 'not found'
        throw new Error(`Erro ao ler sessão do Supabase: ${error.message}`);
      }
      
      if (data) {
        // Usa o BufferJSON.reviver para converter os dados de volta para o formato do Baileys
        return JSON.parse(JSON.stringify(data.session_data), BufferJSON.reviver);
      }
      return null;
    } catch (e) {
      console.error("Falha ao ler dados do Supabase", e);
      return null;
    }
  };

  // Função para escrever os dados no Supabase
  const writeData = async (data, id) => {
    try {
      // Usa o BufferJSON.replacer para converter os dados para um formato JSON seguro
      const jsonData = JSON.parse(JSON.stringify(data, BufferJSON.replacer));
      await supabase
        .from('baileys_auth_store')
        .upsert({ id: id, session_data: jsonData });
    } catch (e) {
      console.error("Falha ao escrever dados no Supabase", e);
    }
  };

  // Função para remover os dados do Supabase
  const removeData = async (id) => {
    try {
      await supabase.from('baileys_auth_store').delete().eq('id', id);
    } catch (e) {
      console.error("Falha ao remover dados do Supabase", e);
    }
  };

  // Carrega as credenciais iniciais
  const creds = (await readData(`${sessionId}-creds`)) || proto.Message.InteractiveMessage.create();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${sessionId}-${KEY_MAP[type]}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          for (const key in data) {
            for (const id in data[key]) {
              const value = data[key][id];
              const idWithPrefix = `${sessionId}-${KEY_MAP[key]}-${id}`;
              await writeData(value, idWithPrefix);
            }
          }
        },
      },
    },
    saveCreds: () => {
      return writeData(creds, `${sessionId}-creds`);
    },
   clearState: async () => {
      try {
        // Deleta todas as entradas no banco de dados que começam com o sessionId
        await supabase
          .from('baileys_auth_store')
          .delete()
          .like('id', `${sessionId}-%`);
      } catch (e) {
        console.error("Falha ao limpar o estado da sessão do Supabase", e);
      }
    }
  };
}
