import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogTitle, TextField, Button, Box, Typography, CircularProgress } from '@mui/material';
import { API_ENDPOINTS } from '../config/api';
import { CheckCircle, ErrorOutline, QrCode2 } from '@mui/icons-material';

const YELLOW = '#FFD600';
const YELLOW_DARK = '#FFC400';
const GRAY_BG = '#FFFDE7';

const ConnectWhatsApp: React.FC = () => {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Desconectado');
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionName, setConnectionName] = useState('');
  const [connectMode, setConnectMode] = useState<'qr' | 'pairing' | null>(null);

  const pollQrCode = async (deviceId: string) => {
    let attempts = 0;
    let lastPairingCode = null;
    let lastQrCode = null;
    while (attempts < 30) {
      try {
        const res = await fetch(`/api/whatsapp/qr/${deviceId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.qr && data.qr !== lastQrCode) {
            setQrCode(data.qr);
            lastQrCode = data.qr;
          }
          if (data.pairingCode && data.pairingCode !== lastPairingCode) {
            setPairingCode(data.pairingCode);
            lastPairingCode = data.pairingCode;
          }
          setOpenQRDialog(true);
          setConnectionStatus('Aguardando escaneamento do QR Code...');
        }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 4000));
      attempts++;
    }
  };

  const handleConnect = async () => {
    if (!phoneNumber) {
      toast.error('Por favor, insira um número de telefone');
      return;
    }
    if (!connectMode) {
      toast.error('Escolha o modo de conexão');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_ENDPOINTS.whatsapp.connect, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          deviceId: phoneNumber,
          connectionName: connectionName || `WhatsApp ${phoneNumber}`,
          mode: connectMode,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao conectar');
      }
      setConnectionStatus('Conectando...');
      pollQrCode(phoneNumber);
      checkConnectionStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar');
      toast.error('Erro ao conectar WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.whatsapp.status(phoneNumber));
      const data = await response.json();
      if (data.status === 'connected') {
        setConnectionStatus('Conectado');
        setOpenQRDialog(false);
        toast.success('WhatsApp conectado com sucesso!');
      } else if (data.status === 'connecting') {
        setConnectionStatus('Conectando...');
      } else if (data.status === 'pending') {
        setConnectionStatus('Aguardando escaneamento do QR Code...');
      }
    } catch (err) {
      // Silenciar erro
    }
  };

  useEffect(() => {
    if (openQRDialog || connectionStatus === 'Conectando...') {
      const interval = setInterval(checkConnectionStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [openQRDialog, connectionStatus]);

  return (
    <Box sx={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto', p: 4, background: '#fff', borderRadius: 4, boxShadow: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <QrCode2 sx={{ fontSize: 48, color: YELLOW, mb: 1 }} />
        <Typography variant="h4" sx={{ fontWeight: 700, color: YELLOW_DARK, mb: 2, textAlign: 'center', letterSpacing: 1 }}>
          Conectar WhatsApp
        </Typography>
        <Typography variant="body1" sx={{ color: '#444', mb: 3, textAlign: 'center' }}>
          Insira o número do WhatsApp para conectar sua conta e enviar campanhas.
        </Typography>
        <TextField
          fullWidth
          label="Número do WhatsApp"
          variant="outlined"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Ex: 556199999999"
          sx={{ mb: 2, background: '#FFFDE7', borderRadius: 2 }}
        />
        <TextField
          fullWidth
          label="Nome da Conexão"
          variant="outlined"
          value={connectionName}
          onChange={(e) => setConnectionName(e.target.value)}
          placeholder="Ex: WhatsApp Comercial"
          sx={{ mb: 2, background: '#FFFDE7', borderRadius: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 2, width: '100%', mb: 2 }}>
          <Button
            variant={connectMode === 'qr' ? 'contained' : 'outlined'}
            onClick={() => setConnectMode('qr')}
            sx={{ flex: 1, fontWeight: 700, background: connectMode === 'qr' ? YELLOW : undefined, color: connectMode === 'qr' ? '#222' : YELLOW_DARK, borderColor: YELLOW_DARK }}
          >
            QR Code
          </Button>
          <Button
            variant={connectMode === 'pairing' ? 'contained' : 'outlined'}
            onClick={() => setConnectMode('pairing')}
            sx={{ flex: 1, fontWeight: 700, background: connectMode === 'pairing' ? YELLOW : undefined, color: connectMode === 'pairing' ? '#222' : YELLOW_DARK, borderColor: YELLOW_DARK }}
          >
            Código de Pareamento
          </Button>
        </Box>
        <Button
          variant="contained"
          onClick={handleConnect}
          disabled={isLoading}
          fullWidth
          sx={{
            background: YELLOW,
            color: '#222',
            fontWeight: 700,
            fontSize: 18,
            py: 1.5,
            borderRadius: 2,
            boxShadow: '0 2px 8px 0 #FFD60033',
            '&:hover': { background: YELLOW_DARK }
          }}
        >
          {isLoading ? <CircularProgress size={24} sx={{ color: YELLOW_DARK }} /> : 'Conectar WhatsApp'}
        </Button>
        {error && (
          <Box sx={{ mt: 2, width: '100%', display: 'flex', alignItems: 'center', color: '#D32F2F', background: '#FFF3E0', borderRadius: 2, p: 1.5 }}>
            <ErrorOutline sx={{ mr: 1 }} />
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}
        <Box sx={{ mt: 3, width: '100%' }}>
          {connectionStatus === 'Conectado' && (
            <Box sx={{ display: 'flex', alignItems: 'center', color: '#388E3C', background: '#F1F8E9', borderRadius: 2, p: 1.5, justifyContent: 'center' }}>
              <CheckCircle sx={{ mr: 1 }} />
              <Typography variant="body2">WhatsApp conectado com sucesso!</Typography>
            </Box>
          )}
          {connectionStatus === 'Conectando...' && (
            <Box sx={{ display: 'flex', alignItems: 'center', color: YELLOW_DARK, background: '#FFFDE7', borderRadius: 2, p: 1.5, justifyContent: 'center' }}>
              <CircularProgress size={18} sx={{ color: YELLOW_DARK, mr: 1 }} />
              <Typography variant="body2">Conectando ao WhatsApp...</Typography>
            </Box>
          )}
        </Box>
      </Box>
      <Dialog 
        open={openQRDialog} 
        onClose={() => setOpenQRDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: `3px solid ${YELLOW}`,
            background: '#fffde7',
            boxShadow: '0 8px 32px 0 #FFD60055',
            p: 2
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', color: YELLOW_DARK, fontWeight: 700, fontSize: 28, letterSpacing: 1 }}>
          Escaneie o QR Code
        </DialogTitle>
        <DialogContent>
          <Box className="flex flex-col items-center p-4" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {qrCode && (
              <Box sx={{ background: '#fff', p: 3, borderRadius: 3, boxShadow: 2, border: `2px solid ${YELLOW_DARK}`, mb: 2 }}>
                <QRCodeSVG
                  value={qrCode}
                  size={220}
                  level="H"
                  style={{ marginBottom: 12 }}
                />
                <Typography variant="subtitle2" sx={{ color: YELLOW_DARK, fontWeight: 700, mt: 1 }}>
                  QR Code
                </Typography>
              </Box>
            )}
            {pairingCode && (
              <Box sx={{ mt: 2, mb: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ color: YELLOW_DARK, fontWeight: 700, mb: 0.5 }}>
                  Código de Pareamento
                </Typography>
                <Typography variant="h5" sx={{ fontFamily: 'monospace', letterSpacing: 2, color: '#222', background: '#FFFDE7', borderRadius: 2, px: 2, py: 1 }}>
                  {pairingCode}
                </Typography>
              </Box>
            )}
            <Typography variant="body1" sx={{ color: '#444', mt: 3, textAlign: 'center' }}>
              {connectionStatus}
            </Typography>
            <Typography variant="body2" sx={{ color: YELLOW_DARK, textAlign: 'center', mt: 1 }}>
              Abra o WhatsApp no seu celular {'>'} Menu {'>'} Dispositivos conectados {'>'} Conectar um dispositivo
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ConnectWhatsApp; 