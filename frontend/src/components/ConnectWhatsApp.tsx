import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  TextField,
  Button,
} from "@mui/material";

import { QRCodeSVG } from "qrcode.react";

const API_URL = "https://atende-ai-z2n7.onrender.com/api";

const ConnectWhatsApp: React.FC = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [phoneNumberInput, setPhoneNumberInput] = useState<string>("");
  const [startConnection, setStartConnection] = useState(false);

  useEffect(() => {
    let storedDeviceId = localStorage.getItem("deviceId");
    if (!storedDeviceId) {
      storedDeviceId = crypto.randomUUID();
      localStorage.setItem("deviceId", storedDeviceId);
    }
    setDeviceId(storedDeviceId);
  }, []);

  useEffect(() => {
    if (!deviceId || !startConnection) return;

    const connect = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const connectEndpoint = `${API_URL}/whatsapp/connect`;
        console.log("URL de conexão (POST):", connectEndpoint);
        const response = await fetch(connectEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: deviceId,
            phoneNumber: phoneNumberInput,
          }),
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

    const interval = setInterval(async () => {
      if (isConnected) return;

      const qrEndpoint = `${API_URL}/whatsapp/qr/${deviceId}`;
      console.log("URL para buscar QR (GET):", qrEndpoint);

      try {
        const response = await fetch(qrEndpoint);
        if (response.ok) {
          const data = await response.json();
          if (data.qr) {
            setQrCode(data.qr);
          }
        }

        const keepAliveEndpoint = `${API_URL}/whatsapp/keep-alive`;
        const keepAliveResponse = await fetch(keepAliveEndpoint);
        const keepAliveData = await keepAliveResponse.json();
        if (keepAliveData.status === "Connected") setIsConnected(true);
      } catch (err) {
        console.error("Erro na verificação de status:", err);
      }
    }, 5000);

    connect();
    return () => clearInterval(interval);
  }, [isConnected, deviceId, startConnection, phoneNumberInput]);

  const handleConnectClick = () => {
    if (phoneNumberInput) {
      setStartConnection(true);
    } else {
      setError("Por favor, insira um número de telefone.");
    }
  };

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

      {!startConnection && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <TextField
            label="Número de Telefone (com DDD)"
            variant="outlined"
            value={phoneNumberInput}
            onChange={(e) => setPhoneNumberInput(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Button variant="contained" onClick={handleConnectClick}>
            Conectar
          </Button>
        </Box>
      )}

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
          {/* O componente agora se chama QRCodeSVG */}
          <QRCodeSVG value={qrCode} size={256} level="H" includeMargin={true} />
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
