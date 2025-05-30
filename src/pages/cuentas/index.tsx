import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  Modal,
  message,
  Dropdown,
  Space,
  Tag,
  Empty,
  Divider,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  BankOutlined,
  WalletOutlined,
  CreditCardOutlined,
  TrophyOutlined,
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useApp } from '@/src/context/AppContext';
import { Cuenta, TipoCuenta, Moneda, CrearCuentaInput } from '@/types';
import FormularioCuenta from '@/src/components/forms/FormularioCuenta';
import Head from 'next/head';

const { Title, Text } = Typography;

const PaginaCuentas: React.FC = () => {
  const { cuentas, crearCuenta, cargando } = useApp();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cuentaEditando, setCuentaEditando] = useState<Cuenta | undefined>();
  const [mostrarSaldos, setMostrarSaldos] = useState(true);

  // Función para formatear moneda
  const formatearMoneda = (monto: number, moneda: Moneda) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda,
    }).format(monto);
  };

  // Obtener icono por tipo de cuenta
  const obtenerIconoTipo = (tipo: TipoCuenta) => {
    const iconos = {
      [TipoCuenta.EFECTIVO]: <WalletOutlined />,
      [TipoCuenta.BANCO]: <BankOutlined />,
      [TipoCuenta.TARJETA_CREDITO]: <CreditCardOutlined />,
      [TipoCuenta.INVERSION]: <TrophyOutlined />,
      [TipoCuenta.OTRO]: <SettingOutlined />,
    };
    return iconos[tipo] || <BankOutlined />;
  };

  // Obtener nombre legible del tipo
  const obtenerNombreTipo = (tipo: TipoCuenta) => {
    const nombres = {
      [TipoCuenta.EFECTIVO]: 'Efectivo',
      [TipoCuenta.BANCO]: 'Banco',
      [TipoCuenta.TARJETA_CREDITO]: 'Tarjeta de Crédito',
      [TipoCuenta.INVERSION]: 'Inversión',
      [TipoCuenta.OTRO]: 'Otro',
    };
    return nombres[tipo] || tipo;
  };

  // Calcular totales por moneda
  const totalesPorMoneda = cuentas
    .filter(cuenta => cuenta.activa)
    .reduce((acc, cuenta) => {
      acc[cuenta.moneda] = (acc[cuenta.moneda] || 0) + cuenta.saldo;
      return acc;
    }, {} as Record<Moneda, number>);

  // Agrupar cuentas por moneda
  const cuentasPorMoneda = cuentas.reduce((acc, cuenta) => {
    if (!acc[cuenta.moneda]) acc[cuenta.moneda] = [];
    acc[cuenta.moneda].push(cuenta);
    return acc;
  }, {} as Record<Moneda, Cuenta[]>);

  const manejarNuevaCuenta = () => {
    setCuentaEditando(undefined);
    setMostrarFormulario(true);
  };

  const manejarEditarCuenta = (cuenta: Cuenta) => {
    setCuentaEditando(cuenta);
    setMostrarFormulario(true);
  };

  const manejarGuardarCuenta = async (datos: CrearCuentaInput): Promise<boolean> => {
    try {
      if (cuentaEditando) {
        // TODO: Implementar actualización
        message.info('Funcionalidad de edición pendiente');
        return false;
      } else {
        const resultado = await crearCuenta(datos);
        if (resultado) {
          setMostrarFormulario(false);
          return true;
        }
      }
      return false;
    } catch (error) {
      message.error('Error al guardar la cuenta');
      return false;
    }
  };

  const manejarCancelarFormulario = () => {
    setMostrarFormulario(false);
    setCuentaEditando(undefined);
  };

  const manejarEliminarCuenta = (cuenta: Cuenta) => {
    Modal.confirm({
      title: '¿Eliminar cuenta?',
      content: (
        <div>
          <p>¿Estás seguro de que deseas eliminar la cuenta <strong>"{cuenta.nombre}"</strong>?</p>
          <p style={{ color: '#ff4d4f', marginBottom: 0 }}>
            Esta acción no se puede deshacer y se eliminarán todas las transacciones asociadas.
          </p>
        </div>
      ),
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk() {
        // TODO: Implementar eliminación
        message.info('Funcionalidad de eliminación pendiente');
      },
    });
  };

  const toggleMostrarSaldos = () => {
    setMostrarSaldos(!mostrarSaldos);
  };

  return (
    <>
      <Head>
        <title>Cuentas - Mi ERP Personal</title>
        <meta name="description" content="Gestiona tus cuentas bancarias, efectivo e inversiones" />
      </Head>

      <div style={{ padding: '0' }}>
        {/* Encabezado */}
        <div style={{ 
          marginBottom: '24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Cuentas
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Gestiona tus cuentas bancarias, efectivo e inversiones
            </Text>
          </div>
          <Space>
            <Button
              type="text"
              icon={mostrarSaldos ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={toggleMostrarSaldos}
              size="large"
            >
              {mostrarSaldos ? 'Ocultar Saldos' : 'Mostrar Saldos'}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={manejarNuevaCuenta}
              size="large"
            >
              Nueva Cuenta
            </Button>
          </Space>
        </div>

        {/* Resumen de saldos totales */}
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          {Object.entries(totalesPorMoneda).map(([moneda, total]) => (
            <Col xs={24} sm={12} lg={8} key={moneda}>
              <Card>
                <Statistic
                  title={`Patrimonio Total ${moneda}`}
                  value={mostrarSaldos ? total : 0}
                  precision={2}
                  prefix={<DollarOutlined style={{ color: '#1890ff' }} />}
                  formatter={(value) => mostrarSaldos ? formatearMoneda(Number(value), moneda as Moneda) : '•••••••'}
                  valueStyle={{ 
                    color: total >= 0 ? '#52c41a' : '#ff4d4f',
                    fontSize: '24px',
                    fontWeight: 'bold'
                  }}
                />
                <Text type="secondary">
                  {cuentasPorMoneda[moneda as Moneda]?.filter(c => c.activa).length || 0} cuenta(s) activa(s)
                </Text>
              </Card>
            </Col>
          ))}
          
          {/* Tarjeta de nueva cuenta si no hay cuentas */}
          {cuentas.length === 0 && (
            <Col xs={24} sm={12} lg={8}>
              <Card 
                style={{ 
                  border: '2px dashed #d9d9d9',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                onClick={manejarNuevaCuenta}
                hoverable
              >
                <div style={{ padding: '20px 0' }}>
                  <PlusOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '16px' }} />
                  <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                    Crear Primera Cuenta
                  </Title>
                  <Text type="secondary">
                    Comienza agregando tu primera cuenta
                  </Text>
                </div>
              </Card>
            </Col>
          )}
        </Row>

        {/* Lista de cuentas por moneda */}
        {Object.entries(cuentasPorMoneda).map(([moneda, cuentasMoneda]) => (
          <div key={moneda} style={{ marginBottom: '32px' }}>
            <Title level={4} style={{ marginBottom: '16px' }}>
              Cuentas en {moneda === 'ARS' ? 'Pesos Argentinos' : 'Dólares Estadounidenses'}
            </Title>
            
            {cuentasMoneda.length > 0 ? (
              <Row gutter={[16, 16]}>
                {cuentasMoneda.map(cuenta => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={cuenta.id}>
                    <Card
                      style={{
                        borderLeft: `4px solid ${cuenta.color}`,
                        opacity: cuenta.activa ? 1 : 0.6,
                      }}
                      actions={[
                        <Tooltip key="editar" title="Editar cuenta">
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => manejarEditarCuenta(cuenta)}
                          />
                        </Tooltip>,
                        <Dropdown
                          key="mas"
                          menu={{
                            items: [
                              {
                                key: 'eliminar',
                                icon: <DeleteOutlined />,
                                label: 'Eliminar',
                                danger: true,
                                onClick: () => manejarEliminarCuenta(cuenta),
                              },
                            ],
                          }}
                          trigger={['click']}
                        >
                          <Button type="text" icon={<MoreOutlined />} />
                        </Dropdown>,
                      ]}
                    >
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ marginRight: '8px', fontSize: '20px', color: cuenta.color }}>
                            {obtenerIconoTipo(cuenta.tipo)}
                          </span>
                          <Title level={5} style={{ margin: 0, flex: 1 }}>
                            {cuenta.nombre}
                          </Title>
                        </div>
                        
                        <Tag color={cuenta.color} style={{ marginBottom: '8px' }}>
                          {obtenerNombreTipo(cuenta.tipo)}
                        </Tag>
                        
                        {!cuenta.activa && (
                          <Tag color="default">Inactiva</Tag>
                        )}
                      </div>

                      <Divider style={{ margin: '12px 0' }} />

                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary" style={{ display: 'block', marginBottom: '4px' }}>
                          Saldo Actual
                        </Text>
                        <Text 
                          strong 
                          style={{ 
                            fontSize: '20px',
                            color: cuenta.saldo >= 0 ? '#52c41a' : '#ff4d4f'
                          }}
                        >
                          {mostrarSaldos 
                            ? formatearMoneda(cuenta.saldo, cuenta.moneda)
                            : '•••••••'
                          }
                        </Text>
                      </div>

                      {cuenta.descripcion && (
                        <>
                          <Divider style={{ margin: '12px 0' }} />
                          <Text type="secondary" style={{ fontSize: '14px' }}>
                            {cuenta.descripcion}
                          </Text>
                        </>
                      )}
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty 
                description={`No hay cuentas en ${moneda}`}
                style={{ padding: '40px 0' }}
              />
            )}
          </div>
        ))}

        {/* Si no hay cuentas en absoluto */}
        {cuentas.length === 0 && (
          <Card style={{ textAlign: 'center', padding: '40px' }}>
            <Empty
              image={<BankOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
              description={
                <div>
                  <Title level={4}>No tienes cuentas registradas</Title>
                  <Text type="secondary" style={{ fontSize: '16px' }}>
                    Comienza creando tu primera cuenta para gestionar tus finanzas
                  </Text>
                </div>
              }
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={manejarNuevaCuenta}
                size="large"
              >
                Crear Primera Cuenta
              </Button>
            </Empty>
          </Card>
        )}

        {/* Modal del formulario */}
        <Modal
          title={cuentaEditando ? 'Editar Cuenta' : 'Nueva Cuenta'}
          open={mostrarFormulario}
          onCancel={manejarCancelarFormulario}
          footer={null}
          width={700}
          destroyOnClose
        >
          <FormularioCuenta
            cuenta={cuentaEditando}
            onGuardar={manejarGuardarCuenta}
            onCancelar={manejarCancelarFormulario}
            cargando={cargando}
          />
        </Modal>
      </div>
    </>
  );
};

export default PaginaCuentas;