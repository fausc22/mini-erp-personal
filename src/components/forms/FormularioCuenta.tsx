'use client';

import React, { useEffect, useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Space, 
  Select,
  InputNumber,
  ColorPicker,
  Divider,
  message,
  Row,
  Col
} from 'antd';
import {
  BankOutlined,
  SaveOutlined,
  DollarOutlined,
  WalletOutlined,
  CreditCardOutlined,
  TrophyOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { 
  TipoCuenta, 
  Moneda, 
  CrearCuentaInput, 
  Cuenta 
} from '@/types';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface PropiedadesFormularioCuenta {
  cuenta?: Cuenta; // Para edición
  onGuardar: (datos: CrearCuentaInput) => Promise<boolean>;
  onCancelar: () => void;
  cargando?: boolean;
}

const FormularioCuenta: React.FC<PropiedadesFormularioCuenta> = ({
  cuenta,
  onGuardar,
  onCancelar,
  cargando = false,
}) => {
  const [form] = Form.useForm();
  const [colorSeleccionado, setColorSeleccionado] = useState<string>('#1890ff');

  // Configuración de tipos de cuenta con iconos
  const tiposCuenta = [
    {
      value: TipoCuenta.EFECTIVO,
      label: 'Efectivo',
      icon: <WalletOutlined />,
      description: 'Dinero en efectivo'
    },
    {
      value: TipoCuenta.BANCO,
      label: 'Cuenta Bancaria',
      icon: <BankOutlined />,
      description: 'Cuenta corriente o caja de ahorro'
    },
    {
      value: TipoCuenta.TARJETA_CREDITO,
      label: 'Tarjeta de Crédito',
      icon: <CreditCardOutlined />,
      description: 'Línea de crédito disponible'
    },
    {
      value: TipoCuenta.INVERSION,
      label: 'Inversión',
      icon: <TrophyOutlined />,
      description: 'Fondos de inversión, acciones, etc.'
    },
    {
      value: TipoCuenta.OTRO,
      label: 'Otro',
      icon: <SettingOutlined />,
      description: 'Otro tipo de cuenta'
    },
  ];

  // Colores predefinidos
  const coloresPredefinidos = [
    '#1890ff', '#52c41a', '#faad14', '#f5222d', 
    '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16',
    '#096dd9', '#389e0d', '#d48806', '#cf1322',
    '#531dab', '#08979c', '#c41d7f', '#d46b08'
  ];

  useEffect(() => {
    if (cuenta) {
      // Modo edición: precargar datos
      form.setFieldsValue({
        nombre: cuenta.nombre,
        tipo: cuenta.tipo,
        descripcion: cuenta.descripcion,
        moneda: cuenta.moneda,
        saldoInicial: cuenta.saldo,
      });
      setColorSeleccionado(cuenta.color || '#1890ff');
    } else {
      // Modo creación: valores por defecto
      form.setFieldsValue({
        tipo: TipoCuenta.EFECTIVO,
        moneda: Moneda.ARS,
        saldoInicial: 0,
      });
    }
  }, [cuenta, form]);

  const manejarCambioColor = (color: any) => {
    const valorColor = typeof color === 'string' ? color : color.toHexString();
    setColorSeleccionado(valorColor);
  };

  const manejarEnvio = async (valores: any) => {
    try {
      const datosCuenta: CrearCuentaInput = {
        ...valores,
        color: colorSeleccionado,
      };

      const exito = await onGuardar(datosCuenta);
      
      if (exito) {
        message.success(
          cuenta 
            ? 'Cuenta actualizada exitosamente' 
            : 'Cuenta creada exitosamente'
        );
        
        if (!cuenta) {
          // Solo limpiar el formulario en modo creación
          form.resetFields();
          form.setFieldsValue({
            tipo: TipoCuenta.EFECTIVO,
            moneda: Moneda.ARS,
            saldoInicial: 0,
          });
          setColorSeleccionado('#1890ff');
        }
      }
    } catch (error) {
      message.error('Error al procesar la cuenta');
    }
  };

  const obtenerIconoTipo = (tipo: TipoCuenta) => {
    const tipoInfo = tiposCuenta.find(t => t.value === tipo);
    return tipoInfo?.icon || <BankOutlined />;
  };

  return (
    <Card
      style={{
        maxWidth: 600,
        margin: '0 auto',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0, textAlign: 'center' }}>
          {cuenta ? 'Editar Cuenta' : 'Nueva Cuenta'}
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', fontSize: '16px' }}>
          {cuenta ? 'Modifica los datos de la cuenta' : 'Agrega una nueva cuenta a tu sistema'}
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={manejarEnvio}
        size="large"
        disabled={cargando}
      >
        {/* Nombre de la cuenta */}
        <Form.Item
          name="nombre"
          label={<Text strong style={{ fontSize: '16px' }}>Nombre de la Cuenta</Text>}
          rules={[
            { required: true, message: 'Ingresa el nombre de la cuenta' },
            { min: 2, message: 'El nombre debe tener al menos 2 caracteres' },
            { max: 100, message: 'El nombre no puede exceder 100 caracteres' },
          ]}
        >
          <Input
            placeholder="Ej: Cuenta Corriente Banco Nación"
            style={{ height: '48px' }}
            prefix={<BankOutlined />}
          />
        </Form.Item>

        <Row gutter={16}>
          {/* Tipo de cuenta */}
          <Col xs={24} sm={12}>
            <Form.Item
              name="tipo"
              label={<Text strong style={{ fontSize: '16px' }}>Tipo de Cuenta</Text>}
              rules={[{ required: true, message: 'Selecciona el tipo de cuenta' }]}
            >
              <Select
                placeholder="Selecciona el tipo"
                style={{ height: '48px' }}
              >
                {tiposCuenta.map(tipo => (
                  <Select.Option key={tipo.value} value={tipo.value}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px' }}>
                        {tipo.icon}
                      </span>
                      <div>
                        <div>{tipo.label}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {tipo.description}
                        </Text>
                      </div>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* Moneda */}
          <Col xs={24} sm={12}>
            <Form.Item
              name="moneda"
              label={<Text strong style={{ fontSize: '16px' }}>Moneda</Text>}
              rules={[{ required: true, message: 'Selecciona la moneda' }]}
            >
              <Select
                placeholder="Selecciona la moneda"
                style={{ height: '48px' }}
              >
                <Select.Option value={Moneda.ARS}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>🇦🇷</span>
                    Pesos Argentinos (ARS)
                  </div>
                </Select.Option>
                <Select.Option value={Moneda.USD}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>🇺🇸</span>
                    Dólares Estadounidenses (USD)
                  </div>
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Saldo inicial */}
        <Form.Item
          name="saldoInicial"
          label={<Text strong style={{ fontSize: '16px' }}>
            {cuenta ? 'Saldo Actual' : 'Saldo Inicial'}
          </Text>}
          rules={[
            { type: 'number', min: 0, message: 'El saldo no puede ser negativo' },
          ]}
        >
          <InputNumber
            placeholder="0.00"
            style={{ width: '100%', height: '48px' }}
            prefix={<DollarOutlined />}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
            parser={(value) => value!.replace(/\$\s?|(\.*)/g, '')}
            precision={2}
          />
        </Form.Item>

        {/* Color personalizado */}
        <Form.Item
          label={<Text strong style={{ fontSize: '16px' }}>Color Identificativo</Text>}
        >
          <div>
            <div style={{ marginBottom: '12px' }}>
              <Text type="secondary">Colores predefinidos:</Text>
            </div>
            <Row gutter={[8, 8]} style={{ marginBottom: '16px' }}>
              {coloresPredefinidos.map(color => (
                <Col key={color}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: color,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border: colorSeleccionado === color ? '3px solid #1890ff' : '2px solid #d9d9d9',
                      transition: 'all 0.3s ease',
                    }}
                    onClick={() => setColorSeleccionado(color)}
                  />
                </Col>
              ))}
            </Row>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text type="secondary">Color personalizado:</Text>
              <ColorPicker
                value={colorSeleccionado}
                onChange={manejarCambioColor}
                showText
                size="large"
              />
            </div>
            
            {/* Vista previa */}
            <div 
              style={{ 
                marginTop: '12px',
                padding: '12px',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#fafafa'
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: colorSeleccionado,
                  borderRadius: '50%',
                  marginRight: '8px',
                }}
              />
              <Text>Vista previa del color en la lista</Text>
            </div>
          </div>
        </Form.Item>

        {/* Descripción */}
        <Form.Item
          name="descripcion"
          label={<Text strong style={{ fontSize: '16px' }}>Descripción (Opcional)</Text>}
          rules={[{ max: 500, message: 'La descripción no puede exceder 500 caracteres' }]}
        >
          <TextArea
            placeholder="Información adicional sobre esta cuenta..."
            rows={3}
            style={{ fontSize: '16px' }}
          />
        </Form.Item>

        <Divider />

        {/* Botones */}
        <Form.Item style={{ marginBottom: 0 }}>
          <Space style={{ width: '100%', justifyContent: 'center' }}>
            <Button
              size="large"
              onClick={onCancelar}
              style={{
                minWidth: '120px',
                height: '48px',
                fontSize: '16px',
              }}
            >
              Cancelar
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={cargando}
              icon={<SaveOutlined />}
              style={{
                minWidth: '120px',
                height: '48px',
                fontSize: '16px',
                fontWeight: '600',
              }}
            >
              {cuenta ? 'Actualizar' : 'Guardar'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default FormularioCuenta;