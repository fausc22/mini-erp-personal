import React from 'react';
import { useRouter } from 'next/router';
import { Typography, Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useApp } from '@/context/AppContext';
import { CrearArticuloInput } from '@/types';
import FormularioArticulo from '@/components/forms/FormularioArticulo';
import Head from 'next/head';

const { Title, Text } = Typography;

const PaginaNuevoArticulo: React.FC = () => {
  const router = useRouter();
  const { crearArticulo, cargando } = useApp();

  const manejarGuardar = async (datos: CrearArticuloInput): Promise<boolean> => {
    try {
      const resultado = await crearArticulo(datos);
      if (resultado) {
        // Redirigir a la lista de artículos
        router.push('/articulos');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al crear artículo:', error);
      return false;
    }
  };

  const manejarCancelar = () => {
    router.push('/articulos');
  };

  const volverAtras = () => {
    router.back();
  };

  return (
    <>
      <Head>
        <title>Nuevo Artículo - Mi ERP Personal</title>
        <meta name="description" content="Agrega un nuevo producto o servicio a tu inventario" />
      </Head>

      <div style={{ padding: '0' }}>
        {/* Encabezado con navegación */}
        <div style={{ marginBottom: '32px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />}
              onClick={volverAtras}
              style={{ 
                fontSize: '16px',
                height: '40px',
                padding: '0 16px',
                marginBottom: '8px'
              }}
            >
              Volver
            </Button>
            
            <div style={{ textAlign: 'center' }}>
              <Title level={2} style={{ margin: 0 }}>
                Nuevo Artículo
              </Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                Agrega un nuevo producto o servicio a tu inventario
              </Text>
            </div>
          </Space>
        </div>

        {/* Formulario */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          minHeight: 'calc(100vh - 200px)',
          alignItems: 'flex-start',
          paddingTop: '20px'
        }}>
          <FormularioArticulo
            onGuardar={manejarGuardar}
            onCancelar={manejarCancelar}
            cargando={cargando}
          />
        </div>
      </div>
    </>
  );
};

export default PaginaNuevoArticulo;