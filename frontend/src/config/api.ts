const API_URL = import.meta.env.VITE_API_URL;

export const API_ENDPOINTS = {
  whatsapp: {
    connect: `${API_URL}/baileys/connect`,
    keepAlive: `${API_URL}/baileys/keep-alive`,
    devices: `${API_URL}/whatsapp/devices`,
    status: (deviceId: string) => `${API_URL}/whatsapp/status/${deviceId}`,
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
