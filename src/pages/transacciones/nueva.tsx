import React from 'react';
import { useRouter } from 'next/router';
import { Typography, Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useApp } from '@/src/context/AppContext';
import { CrearTransaccionInput } from '@/src/types';
import FormularioTransaccion from '@/src/components/forms/FormularioTransaccion';
import Head from 'next/head';

const { Title, Text } = Typography;

const PaginaNuevaTransaccion: React.FC = () => {
  const router = useRouter();
  const { crearTransaccion, cargando } = useApp();

  const manejarGuardar = async (datos: CrearTransaccionInput): Promise<boolean> => {
    try {
      const resultado = await crearTransaccion(datos);
      if (resultado) {
        // Redirigir a la lista de transacciones
        router.push('/transacciones');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al crear transacción:', error);
      return false;
    }
  };

  const manejarCancelar = () => {
    router.push('/transacciones');
  };

  const volverAtras = () => {
    router.back();
  };

  return (
    <>
      <Head>
        <title>Nueva Transacción - Mi ERP Personal</title>
        <meta name="description" content="Registra un nuevo ingreso o gasto" />
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
                Nueva Transacción
              </Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                Registra un nuevo ingreso o gasto en tu sistema
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
          <FormularioTransaccion
            onGuardar={manejarGuardar}
            onCancelar={manejarCancelar}
            cargando={cargando}
          />
        </div>
      </div>
    </>
  );
};

export default PaginaNuevaTransaccion;