const chatbots = new Map();

// Função para adicionar ou atualizar um chatbot
export function setChatbot(phoneNumber, config) {
    const formattedNumber = formatPhoneNumber(phoneNumber);
    chatbots.set(formattedNumber, {
        ...config,
        isActive: true,
        createdAt: new Date(),
        lastUpdated: new Date()
    });
}

// Função para remover um chatbot
export function removeChatbot(phoneNumber) {
    const formattedNumber = formatPhoneNumber(phoneNumber);
    chatbots.delete(formattedNumber);
}

// Função para ativar/desativar um chatbot
export function toggleChatbot(phoneNumber, isActive) {
    const formattedNumber = formatPhoneNumber(phoneNumber);
    const chatbot = chatbots.get(formattedNumber);
    if (chatbot) {
        chatbot.isActive = isActive;
        chatbot.lastUpdated = new Date();
    }
}

// Função para obter um chatbot
export function getChatbot(phoneNumber) {
    const formattedNumber = formatPhoneNumber(phoneNumber);
    return chatbots.get(formattedNumber);
}

// Função para listar todos os chatbots
export function listChatbots() {
    return Array.from(chatbots.entries()).map(([phone, config]) => ({
        phone,
        ...config
    }));
}

// Função auxiliar para formatar número de telefone
function formatPhoneNumber(phone) {
    let cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('55')) {
        cleaned = '55' + cleaned;
    }
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
        cleaned = cleaned.slice(0, 5) + cleaned.slice(6);
    }
    return cleaned;
} 