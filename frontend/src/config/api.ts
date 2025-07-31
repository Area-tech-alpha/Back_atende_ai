const isDevelopment = process.env.NODE_ENV === 'development';

export const API_URL = isDevelopment 
  ? '/api'  // Usa proxy do Vite em desenvolvimento
  : 'https://lionchat.tech'; // URL de produção

export const API_ENDPOINTS = {
  whatsapp: {
    connect: `${API_URL}/whatsapp/connect`,
    status: (deviceId: string) => `${API_URL}/whatsapp/status/${deviceId}`,
    devices: `${API_URL}/whatsapp/devices`,
    send: `${API_URL}/whatsapp/send`,
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
  health: `${API_URL}/health`,
}; 