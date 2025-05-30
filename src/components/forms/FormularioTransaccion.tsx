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
  message,
  Row,
  Col,
  Switch
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
  ShoppingCartOutlined,
  BoxPlotOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useApp } from '@/context/AppContext';
import { 
  TipoTransaccion, 
  CrearTransaccionInput, 
  Transaccion,
  TipoCategoria,
  TipoArticulo
} from '@/types';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface PropiedadesFormularioTransaccion {
  transaccion?: Transaccion;
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
  const { cuentas, categorias, articulos } = useApp();
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoTransaccion>(
    transaccion?.tipo || TipoTransaccion.GASTO
  );
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string | undefined>(
    transaccion?.cuentaId
  );
  const [usarArticulo, setUsarArticulo] = useState<boolean>(false);
  const [tipoArticuloFiltro, setTipoArticuloFiltro] = useState<TipoArticulo | undefined>();
  const [articuloSeleccionado, setArticuloSeleccionado] = useState<string | undefined>(
    transaccion?.articuloId
  );

  // Filtrar cuentas activas
  const cuentasActivas = cuentas.filter(cuenta => cuenta.activa);

  // Filtrar categorías activas según el tipo de transacción
  const categoriasDisponibles = categorias.filter(categoria => {
    if (!categoria.activa) return false;
    
    // Para ingresos, solo categorías de productos y servicios
    if (tipoSeleccionado === TipoTransaccion.INGRESO) {
      return categoria.tipo === TipoCategoria.PRODUCTO || categoria.tipo === TipoCategoria.SERVICIO;
    }
    
    // Para gastos, todas las categorías
    return true;
  });

  // Filtrar artículos según el tipo seleccionado y tipo de transacción
  const articulosDisponibles = articulos.filter(articulo => {
    if (!articulo.activo) return false;
    
    if (tipoSeleccionado === TipoTransaccion.INGRESO) {
      // Para ingresos, solo productos y servicios
      return articulo.tipo === TipoArticulo.PRODUCTO || articulo.tipo === TipoArticulo.SERVICIO;
    } else if (tipoSeleccionado === TipoTransaccion.GASTO) {
      // Para gastos, todos los tipos
      if (tipoArticuloFiltro) {
        return articulo.tipo === tipoArticuloFiltro;
      }
      return true;
    }
    
    return false;
  });

  // Obtener información de la cuenta seleccionada
  const cuentaInfo = cuentaSeleccionada 
    ? cuentasActivas.find(c => c.id === cuentaSeleccionada)
    : null;

  // Obtener información del artículo seleccionado
  const articuloInfo = articuloSeleccionado
    ? articulos.find(a => a.id === articuloSeleccionado)
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
        articuloId: transaccion.articuloId,
      });
      setTipoSeleccionado(transaccion.tipo);
      setCuentaSeleccionada(transaccion.cuentaId);
      setUsarArticulo(!!transaccion.articuloId);
      setArticuloSeleccionado(transaccion.articuloId);
      
      // Establecer el filtro de tipo si hay artículo seleccionado
      if (transaccion.articuloId) {
        const articulo = articulos.find(a => a.id === transaccion.articuloId);
        if (articulo) {
          setTipoArticuloFiltro(articulo.tipo);
        }
      }
    } else {
      // Modo creación: valores por defecto
      form.setFieldsValue({
        tipo: TipoTransaccion.GASTO,
        fecha: dayjs(),
      });
    }
  }, [transaccion, form, articulos]);

  const manejarCambioTipo = (tipo: TipoTransaccion) => {
    setTipoSeleccionado(tipo);
    form.setFieldValue('tipo', tipo);
    
    // Limpiar selecciones que pueden no ser válidas para el nuevo tipo
    setUsarArticulo(false);
    setTipoArticuloFiltro(undefined);
    setArticuloSeleccionado(undefined);
    form.setFieldsValue({
      articuloId: undefined,
      categoriaId: undefined,
    });
  };

  const manejarCambioCuenta = (cuentaId: string) => {
    setCuentaSeleccionada(cuentaId);
  };

  const manejarCambioUsarArticulo = (usar: boolean) => {
    setUsarArticulo(usar);
    if (!usar) {
      setTipoArticuloFiltro(undefined);
      setArticuloSeleccionado(undefined);
      form.setFieldsValue({
        articuloId: undefined,
      });
    }
  };

  const manejarCambioTipoArticulo = (tipo: TipoArticulo) => {
    setTipoArticuloFiltro(tipo);
    setArticuloSeleccionado(undefined);
    form.setFieldValue('articuloId', undefined);
  };

  const manejarCambioArticulo = (articuloId: string) => {
    setArticuloSeleccionado(articuloId);
    const articulo = articulos.find(a => a.id === articuloId);
    
    if (articulo) {
      // Auto-completar datos del artículo
      form.setFieldsValue({
        descripcion: articulo.nombre,
        monto: articulo.precio,
        categoriaId: articulo.categoriaId,
      });
    }
  };

  const manejarEnvio = async (valores: any) => {
    try {
      const datosTransaccion: CrearTransaccionInput = {
        ...valores,
        fecha: valores.fecha.toDate(),
        articuloId: usarArticulo ? valores.articuloId : undefined,
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
          setUsarArticulo(false);
          setTipoArticuloFiltro(undefined);
          setArticuloSeleccionado(undefined);
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

  const obtenerIconoTipoArticulo = (tipo: TipoArticulo) => {
    switch (tipo) {
      case TipoArticulo.PRODUCTO: return <BoxPlotOutlined />;
      case TipoArticulo.SERVICIO: return <ToolOutlined />;
      case TipoArticulo.GASTO: return <WalletOutlined />;
      default: return <ShoppingCartOutlined />;
    }
  };

  const obtenerNombreTipoArticulo = (tipo: TipoArticulo) => {
    switch (tipo) {
      case TipoArticulo.PRODUCTO: return 'Productos';
      case TipoArticulo.SERVICIO: return 'Servicios';
      case TipoArticulo.GASTO: return 'Gastos';
      default: return tipo;
    }
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

        {/* Opción de usar artículo del inventario */}
        <Form.Item
          label={<Text strong style={{ fontSize: '16px' }}>Vincular con Inventario</Text>}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Switch
              checked={usarArticulo}
              onChange={manejarCambioUsarArticulo}
            />
            <Text>
              {tipoSeleccionado === TipoTransaccion.INGRESO 
                ? 'Seleccionar producto o servicio vendido'
                : 'Seleccionar artículo o tipo de gasto'
              }
            </Text>
          </div>
        </Form.Item>

        {/* Filtros de artículos cuando está habilitado */}
        {usarArticulo && (
          <>
            {tipoSeleccionado === TipoTransaccion.GASTO && (
              <Form.Item
                label={<Text strong style={{ fontSize: '16px' }}>Tipo de Artículo</Text>}
              >
                <Radio.Group
                  value={tipoArticuloFiltro}
                  onChange={(e) => manejarCambioTipoArticulo(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Radio.Button
                    value={TipoArticulo.PRODUCTO}
                    style={{ width: '33.33%', textAlign: 'center' }}
                  >
                    {obtenerIconoTipoArticulo(TipoArticulo.PRODUCTO)}
                    <span style={{ marginLeft: '4px' }}>Productos</span>
                  </Radio.Button>
                  <Radio.Button
                    value={TipoArticulo.SERVICIO}
                    style={{ width: '33.33%', textAlign: 'center' }}
                  >
                    {obtenerIconoTipoArticulo(TipoArticulo.SERVICIO)}
                    <span style={{ marginLeft: '4px' }}>Servicios</span>
                  </Radio.Button>
                  <Radio.Button
                    value={TipoArticulo.GASTO}
                    style={{ width: '33.33%', textAlign: 'center' }}
                  >
                    {obtenerIconoTipoArticulo(TipoArticulo.GASTO)}
                    <span style={{ marginLeft: '4px' }}>Gastos</span>
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            )}

            <Form.Item
              name="articuloId"
              label={<Text strong style={{ fontSize: '16px' }}>
                {tipoSeleccionado === TipoTransaccion.INGRESO ? 'Producto/Servicio' : 'Artículo'}
              </Text>}
              rules={[{ required: usarArticulo, message: 'Selecciona un artículo' }]}
            >
              <Select
                placeholder="Selecciona el artículo"
                style={{ height: '48px' }}
                onChange={manejarCambioArticulo}
                suffixIcon={<ShoppingCartOutlined />}
                disabled={tipoSeleccionado === TipoTransaccion.GASTO && !tipoArticuloFiltro}
              >
                {articulosDisponibles.map(articulo => (
                  <Option key={articulo.id} value={articulo.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {obtenerIconoTipoArticulo(articulo.tipo)}
                        <span style={{ marginLeft: '8px' }}>{articulo.nombre}</span>
                      </div>
                      <Text type="secondary">
                        {new Intl.NumberFormat('es-AR', {
                          style: 'currency',
                          currency: 'ARS',
                        }).format(articulo.precio)}
                      </Text>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* Información del artículo seleccionado */}
            {articuloInfo && (
              <Alert
                message={`${articuloInfo.nombre} - ${new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: 'ARS',
                }).format(articuloInfo.precio)}`}
                description={articuloInfo.descripcion}
                type="info"
                style={{ marginBottom: '16px', borderRadius: '6px' }}
              />
            )}
          </>
        )}

        <Row gutter={16}>
          {/* Monto */}
          <Col xs={24} sm={16}>
            <Form.Item
              name="monto"
              label={<Text strong style={{ fontSize: '16px' }}>Monto</Text>}
              rules={[
                { required: true, message: 'Ingresa el monto' },
                { type: 'number', min: 0.01, message: 'El monto debe ser mayor a 0' },
                { validator: validarSaldo },
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
          </Col>

          {/* Fecha */}
          <Col xs={24} sm={8}>
            <Form.Item
              name="fecha"
              label={<Text strong style={{ fontSize: '16px' }}>Fecha</Text>}
              rules={[{ required: true, message: 'Selecciona la fecha' }]}
            >
              <DatePicker
                placeholder="Fecha"
                style={{ width: '100%', height: '48px' }}
                suffixIcon={<CalendarOutlined />}
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </Col>
        </Row>

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