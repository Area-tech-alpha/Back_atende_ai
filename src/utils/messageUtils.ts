import { supabase } from '../lib/supabase';

export async function checkDuplicateMessage(campaignId: number, phone: string): Promise<boolean> {
  const { data: existingSend } = await supabase
    .from('envio_evolution')
    .select('id')
    .eq('id_mensagem', campaignId)
    .eq('contato', phone)
    .single();
  
  return !!existingSend;
}

export function formatPhoneNumber(phone: string): string {
  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Garante que o número começa com 55 (código do Brasil)
  if (!cleaned.startsWith('55')) {
    return `55${cleaned}`;
  }
  
  return cleaned;
} 