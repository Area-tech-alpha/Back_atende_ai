import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QRCodeSVG } from 'qrcode.react';
// Ícones do Lucide para manter a consistência do tema
import { QrCode, CheckCircle, AlertTriangle, Loader2, X } from 'lucide-react';

const ConnectWhatsApp: React.FC = () => {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'Desconectado' | 'Conectando...' | 'Aguardando QR' | 'Conectado'>('Desconectado');
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionName, setConnectionName] = useState('');
  
  // Pega a URL da API a partir das variáveis de ambiente para corrigir o erro 404
  const API_URL = import.meta.env.VITE_API_URL;

  // Função para buscar o QR code do backend de forma insistente
  const pollQrCode = async (deviceId: string) => {
    let attempts = 0;
    // Tenta por até 30 segundos
    while (attempts < 15) {
      try {
        const res = await fetch(`${API_URL}/api/whatsapp/qr/${deviceId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.qr) {
            setQrCode(data.qr);
            setOpenQRDialog(true);
            setConnectionStatus('Aguardando QR');
            setIsLoading(false); // Para o loading principal
            return; // Sucesso, sai da função
          }
        }
      } catch (e) {
        console.error("Falha ao buscar QR code, tentando novamente...", e);
      }
      await new Promise(r => setTimeout(r, 2000));
      attempts++;
    }
    // Se o loop terminar sem sucesso
    setError("Não foi possível obter o QR Code do servidor. Verifique se o backend está rodando e tente novamente.");
    setConnectionStatus('Desconectado');
    setIsLoading(false);
  };

  // Inicia o processo de conexão
  const handleConnect = async () => {
    if (!phoneNumber) {
      toast.error('Por favor, insira um número de telefone no formato 55619... ');
      return;
    }

    setIsLoading(true);
    setQrCode(null);
    setError(null);
    setConnectionStatus('Conectando...');

    try {
      const response = await fetch(`${API_URL}/api/whatsapp/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          deviceId: phoneNumber,
          connectionName: connectionName || `Conexão de ${phoneNumber}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro desconhecido ao iniciar conexão.');
      }
      
      // Inicia a busca pelo QR Code após o comando de conexão ser aceito
      await pollQrCode(phoneNumber);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Falha ao conectar. Verifique o console.';
      setError(errorMessage);
      toast.error(errorMessage);
      setConnectionStatus('Desconectado');
      setIsLoading(false);
    }
  };

  // Verifica periodicamente se a conexão foi estabelecida (após o QR ser lido)
  const checkConnectionStatus = async () => {
    if (!phoneNumber) return;
    try {
      const response = await fetch(`${API_URL}/api/whatsapp/status/${phoneNumber}`);
      const data = await response.json();
      if (data.status === 'connected') {
        setConnectionStatus('Conectado');
        setOpenQRDialog(false);
        toast.success('WhatsApp conectado com sucesso!');
      }
    } catch (err) {
        console.log("Verificação de status falhou, tentando novamente...");
    }
  };

  // Efeito para rodar o checkConnectionStatus em intervalo
  useEffect(() => {
    if (connectionStatus === 'Aguardando QR') {
      const interval = setInterval(checkConnectionStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [connectionStatus, phoneNumber]);

  return (
    <>
      <div className="flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-secondary p-8 rounded-2xl border border-secondary-dark shadow-soft flex flex-col items-center">
          <QrCode className="w-12 h-12 text-primary mb-2" />
          <h1 className="text-2xl font-bold text-accent mb-2 text-center">Conectar WhatsApp</h1>
          <p className="text-accent/60 mb-6 text-center text-sm">
            Crie uma nova conexão para disparar suas campanhas.
          </p>

          <div className="w-full space-y-4 mb-6">
            <div>
              <label htmlFor="connectionName"className="block text-sm font-medium text-accent mb-1">Nome da Conexão</label>
              <input
                id="connectionName"
                type="text"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                placeholder="Ex: WhatsApp Comercial"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-accentmb-1">Número do WhatsApp (com DDI e DDD)</label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ex: 5561999999999"
                className="input"
              />
            </div>
          </div>
          
          <button
            onClick={handleConnect}
            disabled={isLoading || connectionStatus === 'Conectado'}
            className="btn btn-primary w-full flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Gerar QR Code'}
          </button>

          <div className="mt-4 w-full text-center h-10">
            {error && (
              <div className="flex items-center justify-center gap-2 text-red-400 bg-red-400/10 p-2 rounded-lg text-sm">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}
            {connectionStatus === 'Conectado' && (
               <div className="flex items-center justify-center gap-2 text-green-400 bg-green-400/10 p-2 rounded-lg text-sm">
                <CheckCircle size={18} />
                <span>Conectado com sucesso!</span>
              </div>
            )}
          </div>

        </div>
      </div>
      
      {openQRDialog && (
        <div className="fixed inset-0 bg-accent/75 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="card p-8 relative">
             <button 
                onClick={() => setOpenQRDialog(false)} 
              className="absolute top-4 right-4 text-accent/60  hover:text-text-primary transition-colors"
             >
                <X size={24} />
             </button>
            <h2 className="text-xl font-bold text-text-primary mb-2">Escaneie para Conectar</h2>
            <p className="text-accent/60 mb-6 text-center text-sm">Abra o WhatsApp no seu celular e conecte um novo aparelho.</p>

            <div className="bg-white p-4 rounded-lg border-2 border-primary">
              {qrCode ? (
                <QRCodeSVG value={qrCode} size={256} level="H" />
              ) : (
                <div className="w-[256px] h-[256px] flex items-center justify-center">
                    <Loader2 className="animate-spin w-16 h-16 text-primary"/>
                </div>
              )}
            </div>
            <p className="mt-4 text-text-secondary text-sm">{connectionStatus === 'Aguardando QR' ? "Aguardando leitura do QR Code..." : connectionStatus}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default ConnectWhatsApp;
