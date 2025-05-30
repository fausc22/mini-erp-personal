'use client';

import React, { useState } from 'react';
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
import { useApp } from '../../context/AppContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface PropiedadesLayoutPrincipal {
  children: React.ReactNode;
}

const LayoutPrincipal: React.FC<PropiedadesLayoutPrincipal> = ({ children }) => {
  const [colapsado, setColapsado] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { usuarioActual, cerrarSesion, articulos } = useApp();

  // Calcular artículos con stock bajo
  const articulosStockBajo = articulos.filter(articulo => 
    articulo.activo && articulo.stock <= (articulo.stockMinimo || 0)
  ).length;

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

  // Si no hay usuario autenticado, no mostrar el layout
  if (!usuarioActual) {
    return <>{children}</>;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Barra lateral */}
      <Sider
        trigger={null}
        collapsible
        collapsed={colapsado}
        breakpoint="lg"
        collapsedWidth="0"
        width={280}
        style={{
          background: '#fff',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        }}
        onBreakpoint={(roto) => {
          setColapsado(roto);
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
          <Text strong style={{ fontSize: colapsado ? '16px' : '18px', color: '#1890ff' }}>
            {colapsado ? 'ERP' : 'Mi ERP Personal'}
          </Text>
        </div>

        {/* Menú de navegación */}
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          defaultOpenKeys={['transacciones', 'inventario']}
          items={elementosMenu}
          style={{
            border: 'none',
            fontSize: '16px',
            marginTop: '16px',
          }}
        />
      </Sider>

      {/* Layout principal */}
      <Layout>
        {/* Encabezado */}
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
            className="lg:hidden"
          />

          {/* Sección del usuario */}
          <Space size="middle">
            {articulosStockBajo > 0 && (
              <Badge 
                count={articulosStockBajo} 
                title={`${articulosStockBajo} artículo(s) con stock bajo`}
              >
                <Button 
                  type="text" 
                  icon={<ShoppingCartOutlined />}
                  onClick={() => router.push('/articulos?stockBajo=true')}
                  style={{ color: '#ff4d4f' }}
                >
                  Stock Bajo
                </Button>
              </Badge>
            )}
            
            <Text style={{ fontSize: '16px' }}>
              Bienvenido, <strong>{usuarioActual.nombre}</strong>
            </Text>
            
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
        /* Aumentar tamaños de fuente para mejor legibilidad */
        .ant-menu-item {
          height: 48px !important;
          line-height: 48px !important;
          margin: 4px 0 !important;
          border-radius: 6px !important;
        }
        
        .ant-menu-submenu-title {
          height: 48px !important;
          line-height: 48px !important;
          margin: 4px 0 !important;
          border-radius: 6px !important;
        }

        /* Botones más grandes para dispositivos táctiles */
        .ant-btn {
          min-height: 44px !important;
          font-size: 16px !important;
          border-radius: 6px !important;
        }

        .ant-btn-lg {
          min-height: 48px !important;
          font-size: 18px !important;
        }

        /* Mejor contraste para texto */
        .ant-typography {
          color: #262626 !important;
        }

        /* Ajustes responsivos */
        @media (max-width: 768px) {
          .ant-layout-content {
            margin: 16px !important;
            padding: 16px !important;
          }

          .ant-menu-item, .ant-menu-submenu-title {
            font-size: 18px !important;
          }

          .ant-btn {
            font-size: 18px !important;
          }
        }

        /* Alto contraste para mejor visibilidad */
        .ant-menu-item:hover,
        .ant-menu-submenu-title:hover {
          background-color: #e6f7ff !important;
          color: #1890ff !important;
        }

        .ant-menu-item-selected {
          background-color: #bae7ff !important;
          color: #0050b3 !important;
          font-weight: 600 !important;
        }

        /* Asegurar que los objetivos táctiles sean de al menos 44px */
        .ant-btn,
        .ant-input,
        .ant-select-selector,
        .ant-picker {
          min-height: 44px !important;
          font-size: 16px !important;
        }

        /* Mejorar visibilidad de badges */
        .ant-badge-count {
          font-size: 12px !important;
          min-width: 20px !important;
          height: 20px !important;
          line-height: 20px !important;
        }

        /* Espaciado mejorado para menús */
        .ant-menu-submenu-inline > .ant-menu {
          margin-left: 16px !important;
        }

        .ant-menu-submenu .ant-menu-item {
          margin-left: 0 !important;
          padding-left: 24px !important;
        }

        /* Mejoras para dropdowns */
        .ant-dropdown-menu-item {
          min-height: 40px !important;
          padding: 8px 16px !important;
          font-size: 16px !important;
        }
      `}</style>
    </Layout>
  );
};

export default LayoutPrincipal;