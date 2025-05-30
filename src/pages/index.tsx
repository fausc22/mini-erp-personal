import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Spin, Typography } from 'antd';
import { useApp } from '@/context/AppContext';
import Head from 'next/head';

const { Title, Text } = Typography;

const PaginaInicio: React.FC = () => {
  const { usuarioActual, cargando } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!cargando) {
      if (usuarioActual) {
        // Usuario autenticado: ir al dashboard
        router.push('/dashboard');
      } else {
        // Usuario no autenticado: ir al login
        router.push('/login');
      }
    }
  }, [usuarioActual, cargando, router]);

  return (
    <>
      <Head>
        <title>Mi ERP Personal</title>
        <meta name="description" content="Sistema de gestión personal para finanzas e inventario" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px'
        }}
      >
        <div style={{ 
          textAlign: 'center', 
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: '16px' }}>
            Mi ERP Personal
          </Title>
          
          <Text style={{ fontSize: '16px', color: '#666', display: 'block', marginBottom: '24px' }}>
            Sistema de gestión personal para finanzas e inventario
          </Text>
          
          <Spin size="large" tip="Cargando..." />
          
          <Text style={{ fontSize: '14px', color: '#999', display: 'block', marginTop: '16px' }}>
            Verificando sesión...
          </Text>
        </div>
      </div>
    </>
  );
};

export default PaginaInicio;