import axios from 'axios';

const API_URL = 'https://lionchat.tech';

export async function sendMessageWithRetry(deviceId, number, message, imagemUrl = null, maxRetries = 3) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 Tentativa ${attempt}/${maxRetries} - Enviando mensagem para ${number}...`);
      
      const response = await axios.post(`${API_URL}/api/whatsapp/send`, {
        deviceId,
        number,
        message,
        imagemUrl
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000 // 30 segundos de timeout
      });

      console.log(`📥 Resposta recebida: HTTP ${response.status}`);

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(response.data)}`);
      }

      // Verifica se a resposta indica sucesso
      const responseData = response.data;
      console.log(`✅ Confirmação de envio recebida:`, responseData);

      if (responseData.success === false) {
        throw new Error(responseData.error || 'Erro desconhecido no envio');
      }

      return { 
        success: true, 
        data: responseData,
        messageId: responseData.messageId 
      };
    } catch (error) {
      lastError = error;
      console.error(`[TENTATIVA ${attempt}/${maxRetries}] Erro ao enviar mensagem para ${number}:`, error.message);
      
      // Aguarda um tempo crescente entre as tentativas (1s, 2s, 4s)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ Aguardando ${delay/1000} segundos antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return { 
    success: false, 
    error: lastError instanceof Error ? lastError.message : String(lastError)
  };
} 