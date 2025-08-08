import React, { useState, useEffect } from "react";
// @ts-ignore
import QRCode from "qrcode.react";
import { Box, Typography, CircularProgress, Paper } from "@mui/material";
import { API_ENDPOINTS } from "../config/api"; 

const API_URL = import.meta.env.VITE_API_URL;

const ConnectWhatsApp: React.FC = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar o QR Code
  const fetchQRCode = async (deviceId: string) => {
    // Usando a URL completa do backend
    const endpoint = `${API_URL}/whatsapp/qr/${deviceId}`;
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        if (data.qr) {
          setQrCode(data.qr);
        }
      } else {
        // Se a resposta não for OK, algo pode estar errado no backend
        console.error("Erro ao buscar QR Code:", response.statusText);
      }
    } catch (err) {
      console.error("Erro na requisição para o QR Code:", err);
    }
  };

  // Iniciar conexão quando o componente montar
  useEffect(() => {
    const connect = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const deviceId = "61991862232"; // Exemplo, ajuste conforme sua lógica

        // Usando o endpoint de conexão da API com a URL completa
        const connectEndpoint = `${API_URL}${API_ENDPOINTS.whatsapp.connect}`;
        const response = await fetch(connectEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: deviceId, phoneNumber: deviceId }),
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        if (data.qrCode) {
          setQrCode(data.qrCode);
        }
        if (data.connected) {
          setIsConnected(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao conectar");
      } finally {
        setIsLoading(false);
      }
    };
    connect();
  }, []);

  // Verificar status da conexão periodicamente
  useEffect(() => {
    if (isConnected) return;
    const interval = setInterval(async () => {
      // Ajuste o deviceId para o valor correto
      const deviceId = "61991862232";
      await fetchQRCode(deviceId);

      try {
        // Usando o endpoint de keep-alive da API com a URL completa
        const keepAliveEndpoint = `${API_URL}${API_ENDPOINTS.whatsapp.keepAlive}`;
        const response = await fetch(keepAliveEndpoint);
        const data = await response.json();
        if (data.status === "Connected") setIsConnected(true);
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [isConnected, fetchQRCode]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        p: 3,
      }}
    >
      <Typography variant="h5" gutterBottom>
        Conectar WhatsApp
      </Typography>

      {isLoading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <CircularProgress size={20} />
          <Typography>Conectando...</Typography>
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {qrCode && !isConnected && (
        <Paper elevation={3} sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Escaneie o QR Code com seu WhatsApp
          </Typography>
          <QRCode value={qrCode} size={256} level="H" includeMargin={true} />
        </Paper>
      )}

      {isConnected && (
        <Paper
          elevation={3}
          sx={{ p: 3, textAlign: "center", bgcolor: "success.light" }}
        >
          <Typography variant="body1" color="white">
            WhatsApp conectado com sucesso!
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ConnectWhatsApp;
