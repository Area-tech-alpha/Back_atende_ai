import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // precisa ser a service role se o worker faz inserts/updates sem RLS liberado

if (!supabaseUrl || !supabaseKey) {
  console.error('[supabase-backend] Variáveis de ambiente ausentes: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  throw new Error('Configuração do Supabase ausente');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
