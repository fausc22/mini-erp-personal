import React from 'react';
import type { AppProps } from 'next/app';
import { ConfigProvider } from 'antd';
import { AppProvider } from '@/src/context/AppContext';
import LayoutPrincipal from '@/src/components/layout/MainLayout';
import { useRouter } from 'next/router';
import esES from 'antd/locale/es_ES';
import 'antd/dist/reset.css';
import '@/styles/globals.css';

// Configuración del tema para Ant Design
const temaConfig = {
  token: {
    // Colores principales
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    
    // Tipografía mejorada para accesibilidad
    fontSize: 16,
    fontSizeLG: 18,
    fontSizeXL: 20,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    
    // Espaciado y bordes
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusXS: 4,
    
    // Alturas mínimas para mejor usabilidad táctil
    controlHeight: 44,
    controlHeightLG: 48,
    controlHeightSM: 40,
    
    // Colores de fondo
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f5f5f5',
    
    // Espaciado
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    
    // Líneas y sombras
    lineWidth: 1,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    boxShadowSecondary: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  components: {
    // Configuración específica para componentes
    Button: {
      fontWeight: 600,
      borderRadius: 6,
    },
    Card: {
      borderRadius: 8,
      paddingLG: 24,
    },
    Input: {
      borderRadius: 6,
      fontSize: 16,
    },
    Select: {
      borderRadius: 6,
      fontSize: 16,
    },
    Menu: {
      fontSize: 16,
      itemHeight: 48,
      subMenuItemBorderRadius: 6,
    },
    Table: {
      borderRadius: 8,
      headerBg: '#fafafa',
    },
    Modal: {
      borderRadius: 12,
    },
    Drawer: {
      borderRadius: 12,
    },
  },
};

// Rutas que no necesitan autenticación
const rutasPublicas = ['/login', '/registro', '/'];

// Rutas que no necesitan el layout principal
const rutasSinLayout = ['/login', '/registro'];

function MiApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const rutaActual = router.pathname;

  // Determinar si la ruta necesita layout
  const necesitaLayout = !rutasSinLayout.includes(rutaActual);

  return (
    <ConfigProvider
      locale={esES}
      theme={temaConfig}
      componentSize="large"
    >
      <AppProvider>
        {necesitaLayout ? (
          <LayoutPrincipal>
            <Component {...pageProps} />
          </LayoutPrincipal>
        ) : (
          <Component {...pageProps} />
        )}
      </AppProvider>
    </ConfigProvider>
  );
}

export default MiApp;