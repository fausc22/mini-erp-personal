import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Spin } from 'antd';
import { useApp } from '@/src/context/AppContext';
import ResumenDashboard from '@/src/components/dashboard/ResumenDashboard';
import Head from 'next/head';

const PaginaDashboard: React.FC = () => {
  const { usuarioActual, cargando } = useApp();
  const router = useRouter();

  useEffect(() => {
    // Redirigir al login si no hay usuario autenticado
    if (!cargando && !usuarioActual) {
      router.push('/login');
    }
  }, [usuarioActual, cargando, router]);

  // Mostrar spinner mientras se verifica la autenticación
  if (cargando || !usuarioActual) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh' 
        }}
      >
        <Spin size="large" tip="Cargando dashboard..." />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - Mi ERP Personal</title>
        <meta 
          name="description" 
          content="Panel principal de tu sistema de gestión personal" 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <ResumenDashboard />
    </>
  );
};

export default PaginaDashboard;