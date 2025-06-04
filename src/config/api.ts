const isDevelopment = process.env.NODE_ENV === 'development';

export const API_URL = isDevelopment 
  ? 'http://lionchat.tech'
  : 'https://lionchat.tech';

export const API_ENDPOINTS = {
  whatsapp: {
    connect: `${API_URL}/api/whatsapp/connect`,
    status: (deviceId: string) => `${API_URL}/api/whatsapp/status/${deviceId}`,
    devices: `${API_URL}/api/whatsapp/devices`,
    send: `${API_URL}/api/whatsapp/send`,
  },
}; 