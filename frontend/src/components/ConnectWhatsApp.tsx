import React, { useState, useEffect } from 'react';
// @ts-ignore
import QRCode from 'qrcode.react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { API_ENDPOINTS } from '../config/api'; // Caminho corrigido

const ConnectWhatsApp: React.FC = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Iniciar conexão quando o componente montar
  useEffect(() => {
    const connect = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Usando o endpoint de conexão da API
        const response = await fetch(API_ENDPOINTS.whatsapp.connect, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        if (data.qrCode) setQrCode(data.qrCode);
        if (data.connected) setIsConnected(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao conectar');
      } finally {
        setIsLoading(false);
      }
    };
    connect();
  }, []);

  // Verificar status da conexão periodicamente
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Usando o endpoint de keep-alive da API
        const response = await fetch(API_ENDPOINTS.whatsapp.keepAlive);
        const data = await response.json();
        if (data.status === 'Connected') setIsConnected(true);
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Conectar WhatsApp
      </Typography>

      {isLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={20} />
          <Typography>Conectando...</Typography>
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
      )}

      {qrCode && !isConnected && (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Escaneie o QR Code com seu WhatsApp
          </Typography>
          <QRCode value={qrCode} size={256} level="H" includeMargin={true} />
        </Paper>
      )}

      {isConnected && (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light' }}>
          <Typography variant="body1" color="white">
            WhatsApp conectado com sucesso!
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ConnectWhatsApp;