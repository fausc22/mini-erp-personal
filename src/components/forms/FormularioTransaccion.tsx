'use client';

import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Space, 
  Alert, 
  Select,
  DatePicker,
  InputNumber,
  Radio,
  Divider,
  message
} from 'antd';
import {
  WalletOutlined,
  PlusOutlined,
  MinusOutlined,
  SaveOutlined,
  DollarOutlined,
  CalendarOutlined,
  TagsOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useApp } from '@/context/AppContext';
import { 
  TipoTransaccion, 
  CrearTransaccionInput, 
  Transaccion,
  TipoCategoria 
} from '@/types';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface PropiedadesFormularioTransaccion {
  transaccion?: Transaccion; // Para edición
  onGuardar: (datos: CrearTransaccionInput) => Promise<boolean>;
  onCancelar: () => void;
  cargando?: boolean;
}

const FormularioTransaccion: React.FC<PropiedadesFormularioTransaccion> = ({
  transaccion,
  onGuardar,
  onCancelar,
  cargando = false,
}) => {
  const [form] = Form.useForm();
  const { cuentas, categorias } = useApp();
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoTransaccion>(
    transaccion?.tipo || TipoTransaccion.GASTO
  );
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string | undefined>(
    transaccion?.cuentaId
  );

  // Filtrar cuentas activas
  const cuentasActivas = cuentas.filter(cuenta => cuenta.activa);

  // Filtrar categorías activas (solo PRODUCTO para transacciones)
  const categoriasDisponibles = categorias.filter(categoria => 
    categoria.activa && categoria.tipo === TipoCategoria.PRODUCTO
  );

  // Obtener información de la cuenta seleccionada
  const cuentaInfo = cuentaSeleccionada 
    ? cuentasActivas.find(c => c.id === cuentaSeleccionada)
    : null;

  useEffect(() => {
    if (transaccion) {
      // Modo edición: precargar datos
      form.setFieldsValue({
        tipo: transaccion.tipo,
        cuentaId: transaccion.cuentaId,
        monto: transaccion.monto,
        descripcion: transaccion.descripcion,
        categoriaId: transaccion.categoriaId,
        fecha: dayjs(transaccion.fecha),
        notas: transaccion.notas,
      });
      setTipoSeleccionado(transaccion.tipo);
      setCuentaSeleccionada(transaccion.cuentaId);
    } else {
      // Modo creación: valores por defecto
      form.setFieldsValue({
        tipo: TipoTransaccion.GASTO,
        fecha: dayjs(),
      });
    }
  }, [transaccion, form]);

  const manejarCambioTipo = (tipo: TipoTransaccion) => {
    setTipoSeleccionado(tipo);
    form.setFieldValue('tipo', tipo);
  };

  const manejarCambioCuenta = (cuentaId: string) => {
    setCuentaSeleccionada(cuentaId);
  };

  const manejarEnvio = async (valores: any) => {
    try {
      const datosTransaccion: CrearTransaccionInput = {
        ...valores,
        fecha: valores.fecha.toDate(),
      };

      const exito = await onGuardar(datosTransaccion);
      
      if (exito) {
        message.success(
          transaccion 
            ? 'Transacción actualizada exitosamente' 
            : 'Transacción creada exitosamente'
        );
        
        if (!transaccion) {
          // Solo limpiar el formulario en modo creación
          form.resetFields();
          form.setFieldsValue({
            tipo: tipoSeleccionado,
            fecha: dayjs(),
          });
        }
      }
    } catch (error) {
      message.error('Error al procesar la transacción');
    }
  };

  const validarSaldo = (_: any, value: number) => {
    if (tipoSeleccionado === TipoTransaccion.GASTO && cuentaInfo && value > cuentaInfo.saldo) {
      return Promise.reject('El monto excede el saldo disponible');
    }
    return Promise.resolve();
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
          {transaccion ? 'Editar Transacción' : 'Nueva Transacción'}
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', fontSize: '16px' }}>
          {transaccion ? 'Modifica los datos de la transacción' : 'Registra un nuevo ingreso o gasto'}
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={manejarEnvio}
        size="large"
        disabled={cargando}
      >
        {/* Tipo de transacción */}
        <Form.Item
          name="tipo"
          label={<Text strong style={{ fontSize: '16px' }}>Tipo de Transacción</Text>}
          rules={[{ required: true, message: 'Selecciona el tipo de transacción' }]}
        >
          <Radio.Group
            onChange={(e) => manejarCambioTipo(e.target.value)}
            style={{ width: '100%' }}
          >
            <Radio.Button
              value={TipoTransaccion.INGRESO}
              style={{
                width: '50%',
                textAlign: 'center',
                height: '48px',
                lineHeight: '32px',
                fontSize: '16px',
                fontWeight: '600',
              }}
            >
              <PlusOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
              Ingreso
            </Radio.Button>
            <Radio.Button
              value={TipoTransaccion.GASTO}
              style={{
                width: '50%',
                textAlign: 'center',
                height: '48px',
                lineHeight: '32px',
                fontSize: '16px',
                fontWeight: '600',
              }}
            >
              <MinusOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
              Gasto
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        {/* Cuenta */}
        <Form.Item
          name="cuentaId"
          label={<Text strong style={{ fontSize: '16px' }}>Cuenta</Text>}
          rules={[{ required: true, message: 'Selecciona una cuenta' }]}
        >
          <Select
            placeholder="Selecciona la cuenta"
            style={{ height: '48px' }}
            onChange={manejarCambioCuenta}
            suffixIcon={<WalletOutlined />}
          >
            {cuentasActivas.map(cuenta => (
              <Option key={cuenta.id} value={cuenta.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: cuenta.color,
                        marginRight: '8px',
                      }}
                    />
                    <span>{cuenta.nombre}</span>
                  </div>
                  <Text type="secondary">
                    {new Intl.NumberFormat('es-AR', {
                      style: 'currency',
                      currency: cuenta.moneda,
                    }).format(cuenta.saldo)}
                  </Text>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Información de la cuenta seleccionada */}
        {cuentaInfo && (
          <Alert
            message={`Saldo actual: ${new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: cuentaInfo.moneda,
            }).format(cuentaInfo.saldo)}`}
            type={cuentaInfo.saldo > 0 ? 'success' : 'warning'}
            style={{ marginBottom: '16px', borderRadius: '6px' }}
          />
        )}

        <Space.Compact style={{ width: '100%' }}>
          {/* Monto */}
          <Form.Item
            name="monto"
            label={<Text strong style={{ fontSize: '16px' }}>Monto</Text>}
            rules={[
              { required: true, message: 'Ingresa el monto' },
              { type: 'number', min: 0.01, message: 'El monto debe ser mayor a 0' },
              { validator: validarSaldo },
            ]}
            style={{ width: '70%' }}
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

          {/* Fecha */}
          <Form.Item
            name="fecha"
            label={<Text strong style={{ fontSize: '16px' }}>Fecha</Text>}
            rules={[{ required: true, message: 'Selecciona la fecha' }]}
            style={{ width: '30%' }}
          >
            <DatePicker
              placeholder="Fecha"
              style={{ width: '100%', height: '48px' }}
              suffixIcon={<CalendarOutlined />}
              format="DD/MM/YYYY"
            />
          </Form.Item>
        </Space.Compact>

        {/* Descripción */}
        <Form.Item
          name="descripcion"
          label={<Text strong style={{ fontSize: '16px' }}>Descripción</Text>}
          rules={[
            { required: true, message: 'Ingresa una descripción' },
            { min: 3, message: 'La descripción debe tener al menos 3 caracteres' },
            { max: 200, message: 'La descripción no puede exceder 200 caracteres' },
          ]}
        >
          <Input
            placeholder="¿Para qué fue este gasto/ingreso?"
            style={{ height: '48px' }}
            prefix={<FileTextOutlined />}
          />
        </Form.Item>

        {/* Categoría */}
        <Form.Item
          name="categoriaId"
          label={<Text strong style={{ fontSize: '16px' }}>Categoría</Text>}
          rules={[{ required: true, message: 'Selecciona una categoría' }]}
        >
          <Select
            placeholder="Selecciona la categoría"
            style={{ height: '48px' }}
            suffixIcon={<TagsOutlined />}
          >
            {categoriasDisponibles.map(categoria => (
              <Option key={categoria.id} value={categoria.id}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: categoria.color,
                      marginRight: '8px',
                    }}
                  />
                  {categoria.nombre}
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Notas adicionales */}
        <Form.Item
          name="notas"
          label={<Text strong style={{ fontSize: '16px' }}>Notas (Opcional)</Text>}
          rules={[{ max: 500, message: 'Las notas no pueden exceder 500 caracteres' }]}
        >
          <TextArea
            placeholder="Información adicional sobre esta transacción..."
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
              {transaccion ? 'Actualizar' : 'Guardar'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default FormularioTransaccion;