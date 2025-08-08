const API_URL = import.meta.env.VITE_API_URL;

// Adicionado para debug. Você pode remover após a correção.
console.log("API_URL from .env:", API_URL);

export const API_ENDPOINTS = {
  whatsapp: {
    connect: `${API_URL}/whatsapp/connect`,
    keepAlive: `${API_URL}/baileys/keep-alive`,
    devices: `${API_URL}/whatsapp/devices`,
    status: (deviceId: string) => `${API_URL}/whatsapp/status/${deviceId}`,
    send: `${API_URL}/whatsapp/send`,
    qr: (deviceId: string) => `${API_URL}/whatsapp/qr/${deviceId}`,
    deleteSession: (deviceId: string) =>
      `${API_URL}/whatsapp/session/${deviceId}`,
    deleteAuth: (deviceId: string) =>
      `${API_URL}/whatsapp/devices/${deviceId}/auth`,
  },
  campaigns: {
    list: `${API_URL}/campaigns`,
    create: `${API_URL}/campaigns`,
    update: (id: string) => `${API_URL}/campaigns/${id}`,
    delete: (id: string) => `${API_URL}/campaigns/${id}`,
  },
  contacts: {
    list: `${API_URL}/contacts`,
    create: `${API_URL}/contacts`,
    update: (id: string) => `${API_URL}/contacts/${id}`,
    delete: (id: string) => `${API_URL}/contacts/${id}`,
  },
  chatbots: {
    create: `${API_URL}/chatbots`,
    list: `${API_URL}/chatbots`,
    toggle: (phoneNumber: string) =>
      `${API_URL}/chatbots/${phoneNumber}/toggle`,
    remove: (phoneNumber: string) => `${API_URL}/chatbots/${phoneNumber}`,
  },
  mistral: {
    agents: `${API_URL}/mistral/agents`,
    createAgent: `${API_URL}/mistral/agents`,
    models: `${API_URL}/mistral/models`,
  },
  debug: {
    autoCleanup: `${API_URL}/debug/auto-cleanup`,
    caches: `${API_URL}/debug/caches`,
  },
  scheduledMessages: {
    process: `${API_URL}/processScheduledMessages`,
  },
  health: `${API_URL}/health`,
};
