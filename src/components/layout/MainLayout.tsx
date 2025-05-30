'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography, Badge } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  WalletOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  BarChartOutlined,
  MenuOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BankOutlined,
  TagsOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface PropiedadesLayoutPrincipal {
  children: React.ReactNode;
}

const LayoutPrincipal: React.FC<PropiedadesLayoutPrincipal> = ({ children }) => {
  const [colapsado, setColapsado] = useState(false);
  const [esMobile, setEsMobile] = useState(false);
  const [submenuAbiertos, setSubmenuAbiertos] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const { usuarioActual, cerrarSesion, articulos } = useApp();

  // Detectar si es móvil
  useEffect(() => {
    const detectarMobile = () => {
      const isMobile = window.innerWidth <= 768;
      setEsMobile(isMobile);
      
      if (isMobile) {
        // En móviles, empezar con submenús cerrados
        setSubmenuAbiertos([]);
        setColapsado(true);
      } else {
        // En desktop, mantener submenús abiertos por defecto
        setSubmenuAbiertos(['transacciones', 'inventario']);
      }
    };

    detectarMobile();
    window.addEventListener('resize', detectarMobile);
    
    return () => window.removeEventListener('resize', detectarMobile);
  }, []);

  // Cerrar menú en móviles al navegar
  useEffect(() => {
    if (esMobile) {
      setColapsado(true);
      setSubmenuAbiertos([]);
    }
  }, [pathname, esMobile]);

  // Calcular artículos con stock bajo (solo productos)
  const articulosStockBajo = articulos.filter(articulo => 
    articulo.activo && 
    articulo.tipo === 'PRODUCTO' && // ✅ Solo productos
    articulo.stock <= (articulo.stockMinimo || 0)
  ).length;

  // Manejar apertura/cierre de submenús
  const manejarSubmenu = (openKeys: string[]) => {
    if (esMobile) {
      // En móviles, solo permitir un submenú abierto a la vez
      const ultimaClave = openKeys[openKeys.length - 1];
      setSubmenuAbiertos(ultimaClave ? [ultimaClave] : []);
    } else {
      // En desktop, permitir múltiples submenús abiertos
      setSubmenuAbiertos(openKeys);
    }
  };

  // Manejar click en items del menú
  const manejarClickMenu = ({ key }: { key: string }) => {
    // Si es un ítem que navega, cerrar el menú en móviles
    if (esMobile && !key.includes('submenu')) {
      setColapsado(true);
      setSubmenuAbiertos([]);
    }
  };

  // Configuración de elementos del menú
  const elementosMenu: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined style={{ fontSize: '18px' }} />,
      label: <Link href="/dashboard">Dashboard</Link>,
    },
    {
      key: 'transacciones',
      icon: <WalletOutlined style={{ fontSize: '18px' }} />,
      label: 'Transacciones',
      children: [
        {
          key: '/transacciones',
          label: <Link href="/transacciones">Ver Todas</Link>,
        },
        {
          key: '/transacciones/nueva',
          icon: <PlusOutlined />,
          label: <Link href="/transacciones/nueva">Nueva Transacción</Link>,
        },
      ],
    },
    {
      key: '/cuentas',
      icon: <BankOutlined style={{ fontSize: '18px' }} />,
      label: <Link href="/cuentas">Cuentas</Link>,
    },
    {
      key: 'inventario',
      icon: articulosStockBajo > 0 ? (
        <Badge count={articulosStockBajo} size="small">
          <ShoppingCartOutlined style={{ fontSize: '18px' }} />
        </Badge>
      ) : (
        <ShoppingCartOutlined style={{ fontSize: '18px' }} />
      ),
      label: 'Inventario',
      children: [
        {
          key: '/articulos',
          label: <Link href="/articulos">Ver Artículos</Link>,
        },
        {
          key: '/articulos/nuevo',
          icon: <PlusOutlined />,
          label: <Link href="/articulos/nuevo">Nuevo Artículo</Link>,
        },
      ],
    },
    {
      key: '/categorias',
      icon: <TagsOutlined style={{ fontSize: '18px' }} />,
      label: <Link href="/categorias">Categorías</Link>,
    },
    {
      key: '/reportes',
      icon: <BarChartOutlined style={{ fontSize: '18px' }} />,
      label: <Link href="/reportes">Reportes</Link>,
    },
  ];

  // Menú desplegable del usuario
  const elementosMenuUsuario: MenuProps['items'] = [
    {
      key: 'perfil',
      icon: <UserOutlined />,
      label: 'Mi Perfil',
    },
    {
      key: 'configuracion',
      icon: <SettingOutlined />,
      label: 'Configuración',
    },
    {
      type: 'divider',
    },
    {
      key: 'cerrar-sesion',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      danger: true,
    },
  ];

  const manejarClickMenuUsuario: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'perfil':
        router.push('/perfil');
        break;
      case 'configuracion':
        router.push('/configuracion');
        break;
      case 'cerrar-sesion':
        cerrarSesion();
        router.push('/login');
        break;
    }
  };

  // Manejar overlay para cerrar menú en móviles
  const manejarOverlay = () => {
    if (esMobile && !colapsado) {
      setColapsado(true);
      setSubmenuAbiertos([]);
    }
  };

  // Si no hay usuario autenticado, no mostrar el layout
  if (!usuarioActual) {
    return <>{children}</>;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Overlay para móviles */}
      {esMobile && !colapsado && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            zIndex: 999,
          }}
          onClick={manejarOverlay}
        />
      )}

      {/* Barra lateral */}
      <Sider
        trigger={null}
        collapsible
        collapsed={colapsado}
        collapsedWidth={esMobile ? 0 : 80}
        width={280}
        style={{
          position: esMobile ? 'fixed' : 'relative',
          height: '100vh',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
          background: '#fff',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        }}
      >
        {/* Logo */}
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          margin: '0 16px',
        }}>
          <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
            Mi ERP Personal
          </Text>
        </div>

        {/* Menú de navegación */}
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          openKeys={submenuAbiertos}
          onOpenChange={manejarSubmenu}
          onClick={manejarClickMenu}
          items={elementosMenu}
          style={{
            border: 'none',
            fontSize: '16px',
            marginTop: '16px',
          }}
        />
      </Sider>

      {/* Layout principal */}
      <Layout style={{ marginLeft: esMobile ? 0 : (colapsado ? 80 : 280) }}>
        {/* Encabezado */}
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          {/* Botón de menú */}
          <Button
            type="text"
            icon={<MenuOutlined style={{ fontSize: '18px' }} />}
            onClick={() => setColapsado(!colapsado)}
            style={{
              fontSize: '16px',
              width: 48,
              height: 48,
            }}
          />

          {/* Sección del usuario */}
          <Space size="middle">
            {articulosStockBajo > 0 && (
              <Badge 
                count={articulosStockBajo} 
                title={`${articulosStockBajo} producto(s) con stock bajo`}
              >
                <Button 
                  type="text" 
                  icon={<ShoppingCartOutlined />}
                  onClick={() => router.push('/articulos?stockBajo=true')}
                  style={{ color: '#ff4d4f' }}
                >
                  {!esMobile && 'Stock Bajo'}
                </Button>
              </Badge>
            )}
            
            {!esMobile && (
              <Text style={{ fontSize: '16px' }}>
                Bienvenido, <strong>{usuarioActual.nombre}</strong>
              </Text>
            )}
            
            <Dropdown
              menu={{
                items: elementosMenuUsuario,
                onClick: manejarClickMenuUsuario,
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button
                type="text"
                style={{
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Avatar
                  size={32}
                  style={{ backgroundColor: '#1890ff' }}
                >
                  {usuarioActual.nombre.charAt(0).toUpperCase()}
                </Avatar>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        {/* Contenido */}
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#fff',
            borderRadius: '8px',
            minHeight: 'calc(100vh - 112px)',
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </Layout>

      {/* Estilos personalizados */}
      <style jsx global>{`
        /* Mejorar interacción táctil */
        .ant-menu-item {
          height: 48px !important;
          line-height: 48px !important;
          margin: 4px 0 !important;
          border-radius: 6px !important;
          font-size: 16px !important;
        }
        
        .ant-menu-submenu-title {
          height: 48px !important;
          line-height: 48px !important;
          margin: 4px 0 !important;
          border-radius: 6px !important;
          font-size: 16px !important;
        }

        .ant-menu-submenu .ant-menu-item {
          margin-left: 0 !important;
          padding-left: 24px !important;
        }

        /* Transiciones suaves */
        .ant-layout-sider {
          transition: all 0.3s ease !important;
        }

        /* Estilos específicos para móviles */
        @media (max-width: 768px) {
          .ant-layout-content {
            margin: 16px !important;
            padding: 16px !important;
          }

          .ant-menu-item, .ant-menu-submenu-title {
            font-size: 18px !important;
            height: 52px !important;
            line-height: 52px !important;
          }

          .ant-btn {
            min-height: 48px !important;
            font-size: 16px !important;
          }
        }
      `}</style>
    </Layout>
  );
};

export default LayoutPrincipal;