const axios = require('axios');

class MistralService {
    constructor() {
        this.apiKey = process.env.MISTRAL_API_KEY;
        this.apiUrl = 'https://api.mistral.ai/v1/chat/completions';
    }

    async generateResponse(message, personality) {
        try {
            const systemPrompt = this.getSystemPrompt(personality);
            
            const response = await axios.post(
                this.apiUrl,
                {
                    model: "mistral-tiny",
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('Erro ao gerar resposta do Mistral:', error);
            return "Desculpe, não consegui processar sua mensagem no momento. Por favor, tente novamente mais tarde.";
        }
    }

    getSystemPrompt(personality) {
        const prompts = {
            'pizzaria': `Você é um atendente de pizzaria amigável e prestativo. 
            Sua função é:
            - Receber pedidos de pizza
            - Informar sobre os sabores disponíveis
            - Explicar as promoções do dia
            - Tirar dúvidas sobre ingredientes
            - Calcular valores dos pedidos
            - Confirmar endereços de entrega
            
            Mantenha suas respostas concisas e profissionais, sempre no contexto de uma pizzaria.
            Use emojis ocasionalmente para tornar a conversa mais amigável.`,
            
            'padaria': `Você é um atendente de padaria simpático e atencioso.
            Sua função é:
            - Atender pedidos de pães e doces
            - Informar sobre produtos frescos do dia
            - Explicar promoções
            - Tirar dúvidas sobre ingredientes
            - Calcular valores dos pedidos
            
            Mantenha suas respostas concisas e profissionais, sempre no contexto de uma padaria.
            Use emojis ocasionalmente para tornar a conversa mais amigável.`,
            
            'default': `Você é um assistente virtual amigável e prestativo. 
            Responda de forma concisa e útil.`
        };

        return prompts[personality] || prompts.default;
    }
}

module.exports = new MistralService(); 