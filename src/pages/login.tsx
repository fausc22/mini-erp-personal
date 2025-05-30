import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useApp } from '@/context/AppContext';
import FormularioLogin from '@/components/auth/LoginForm';
import Head from 'next/head';

const PaginaLogin: React.FC = () => {
  const { usuarioActual } = useApp();
  const router = useRouter();

  useEffect(() => {
    // Redirigir al dashboard si ya hay usuario autenticado
    if (usuarioActual) {
      router.push('/dashboard');
    }
  }, [usuarioActual, router]);

  // No mostrar el formulario si ya está autenticado
  if (usuarioActual) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Iniciar Sesión - Mi ERP Personal</title>
        <meta 
          name="description" 
          content="Accede a tu sistema de gestión personal" 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <FormularioLogin />
    </>
  );
};

export default PaginaLogin;