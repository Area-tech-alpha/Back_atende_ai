import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase';

interface OverviewChartProps {
  campaignId?: number | null;
  instanceName?: string;
}

const OverviewChart: React.FC<OverviewChartProps> = ({ campaignId, instanceName }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [chartData, setChartData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Mensagens Enviadas',
        data: [0, 0, 0, 0, 0, 0, 0],
        color: '#FFD700',
      },
      {
        label: 'Mensagens Entregues',
        data: [0, 0, 0, 0, 0, 0, 0],
        color: '#FFE44D',
      }
    ]
  });

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Buscar mensagens da campanha e/ou instância
        let messagesQuery = supabase
          .from('mensagem_evolution')
          .select('id, created_at, nome_da_instancia');

        if (campaignId) {
          messagesQuery = messagesQuery.eq('id', campaignId);
        }
        if (instanceName) {
          messagesQuery = messagesQuery.eq('nome_da_instancia', instanceName);
        }

        const { data: messagesData, error: messagesError } = await messagesQuery;
        if (messagesError) throw messagesError;

        // Buscar envios
        const messageIds = messagesData?.map(msg => msg.id) || [];
        const { data: enviosData, error: enviosError } = await supabase
          .from('envio_evolution')
          .select('id, id_mensagem, status, data_envio')
          .in('id_mensagem', messageIds);

        if (enviosError) throw enviosError;

        // Processar dados para o gráfico
        const now = new Date();
        const days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - (6 - i));
          return date;
        });

        const sentData = days.map(day => {
          const dayStart = new Date(day.setHours(0, 0, 0, 0));
          const dayEnd = new Date(day.setHours(23, 59, 59, 999));
          return enviosData?.filter(e => {
            const sentDate = new Date(e.data_envio);
            return sentDate >= dayStart && sentDate <= dayEnd;
          }).length || 0;
        });

        const deliveredData = days.map(day => {
          const dayStart = new Date(day.setHours(0, 0, 0, 0));
          const dayEnd = new Date(day.setHours(23, 59, 59, 999));
          return enviosData?.filter(e => {
            const sentDate = new Date(e.data_envio);
            return sentDate >= dayStart && sentDate <= dayEnd && 
                   (e.status === 'success' || e.status === 'read');
          }).length || 0;
        });

        setChartData({
          labels: days.map(d => d.toLocaleDateString('pt-BR', { weekday: 'short' })),
          datasets: [
            {
              label: 'Mensagens Enviadas',
              data: sentData,
              color: '#FFD700',
            },
            {
              label: 'Mensagens Entregues',
              data: deliveredData,
              color: '#FFE44D',
            }
          ]
        });
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    fetchChartData();
  }, [campaignId, instanceName]);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Set canvas dimensions
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Dimensions
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const graphWidth = width - (padding * 2);
    const graphHeight = height - (padding * 2);

    // Draw chart background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(padding, padding, graphWidth, graphHeight);

    // Draw grid lines
    ctx.beginPath();
    ctx.strokeStyle = '#F5F5F5';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    const yStep = graphHeight / 5;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * yStep);
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
    }

    // Vertical grid lines
    const xStep = graphWidth / (chartData.labels.length - 1);
    for (let i = 0; i < chartData.labels.length; i++) {
      const x = padding + (i * xStep);
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
    }
    ctx.stroke();

    // Draw x-axis labels
    ctx.fillStyle = '#1A1A1A';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    for (let i = 0; i < chartData.labels.length; i++) {
      const x = padding + (i * xStep);
      ctx.fillText(chartData.labels[i], x, height - padding + 20);
    }

    // Draw y-axis labels
    ctx.textAlign = 'right';
    const maxValue = Math.max(...chartData.datasets.flatMap(dataset => dataset.data));
    for (let i = 0; i <= 5; i++) {
      const y = height - padding - (i * yStep);
      const value = Math.round((maxValue / 5) * i);
      ctx.fillText(value.toString(), padding - 10, y + 5);
    }

    // Draw datasets
    chartData.datasets.forEach((dataset, ) => {
      ctx.beginPath();
      ctx.strokeStyle = dataset.color;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      
      // Plot line
      dataset.data.forEach((value, i) => {
        const x = padding + (i * xStep);
        const yRatio = value / maxValue;
        const y = height - padding - (yRatio * graphHeight);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      
      // Plot points
      dataset.data.forEach((value, i) => {
        const x = padding + (i * xStep);
        const yRatio = value / maxValue;
        const y = height - padding - (yRatio * graphHeight);
        
        ctx.beginPath();
        ctx.fillStyle = '#FFFFFF';
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = dataset.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });

    // Remover o desenho da legenda do canvas
  }, [chartData]);

  return (
    <div className="w-full h-[400px] flex flex-col items-center justify-end">
      <canvas 
        ref={canvasRef} 
        className="w-full h-[360px]"
      ></canvas>
      <div className="flex items-center justify-center mt-4 gap-4">
        <span className="flex items-center">
          <span className="inline-block w-4 h-4 rounded-full mr-2" style={{ background: '#FFD700' }}></span>
          <span className="text-accent font-medium">Mensagens Enviadas</span>
        </span>
      </div>
    </div>
  );
};

export default OverviewChart;