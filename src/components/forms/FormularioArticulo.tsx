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
  Radio,
  Divider,
  message,
  Row,
  Col,
  Alert,
  Switch
} from 'antd';
import {
  ShoppingCartOutlined,
  SaveOutlined,
  DollarOutlined,
  TagsOutlined,
  BarcodeOutlined,
  FileTextOutlined,
  BoxPlotOutlined,
  ToolOutlined,
  InfoCircleOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useApp } from '@/context/AppContext';
import { 
  TipoArticulo, 
  TipoCategoria,
  CrearArticuloInput, 
  Articulo 
} from '@/types';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface PropiedadesFormularioArticulo {
  articulo?: Articulo; // Para edición
  onGuardar: (datos: CrearArticuloInput) => Promise<boolean>;
  onCancelar: () => void;
  cargando?: boolean;
}

const FormularioArticulo: React.FC<PropiedadesFormularioArticulo> = ({
  articulo,
  onGuardar,
  onCancelar,
  cargando = false,
}) => {
  const [form] = Form.useForm();
  const { categorias } = useApp();
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoArticulo>(
    articulo?.tipo || TipoArticulo.PRODUCTO
  );

  // Filtrar categorías según el tipo seleccionado
  const categoriasDisponibles = categorias.filter(categoria => {
    if (tipoSeleccionado === TipoArticulo.PRODUCTO) {
      return categoria.activa && categoria.tipo === TipoCategoria.PRODUCTO;
    } else if (tipoSeleccionado === TipoArticulo.SERVICIO) {
      return categoria.activa && categoria.tipo === TipoCategoria.SERVICIO;
    } else if (tipoSeleccionado === TipoArticulo.GASTO) {
      return categoria.activa && categoria.tipo === TipoCategoria.GASTO;
    }
    return false;
  });

  // Unidades comunes según el tipo
  const obtenerUnidadesComunes = (tipo: TipoArticulo) => {
    switch (tipo) {
      case TipoArticulo.PRODUCTO:
        return ['unidad', 'kg', 'gramo', 'litro', 'metro', 'cm', 'pack', 'caja', 'bolsa'];
      case TipoArticulo.SERVICIO:
        return ['hora', 'día', 'mes', 'año', 'servicio', 'consulta', 'sesión'];
      case TipoArticulo.GASTO:
        return ['unidad', 'mes', 'año', 'servicio'];
      default:
        return ['unidad'];
    }
  };

  const unidadesComunes = obtenerUnidadesComunes(tipoSeleccionado);

  useEffect(() => {
    if (articulo) {
      // Modo edición: precargar datos
      form.setFieldsValue({
        tipo: articulo.tipo,
        nombre: articulo.nombre,
        descripcion: articulo.descripcion,
        precio: articulo.precio,
        costo: articulo.costo,
        stock: articulo.stock,
        stockMinimo: articulo.stockMinimo,
        categoriaId: articulo.categoriaId,
        unidad: articulo.unidad,
        codigoBarras: articulo.codigoBarras,
        esRecurrente: articulo.esRecurrente || false,
        frecuencia: articulo.frecuencia,
      });
      setTipoSeleccionado(articulo.tipo);
    } else {
      // Modo creación: valores por defecto
      form.setFieldsValue({
        tipo: TipoArticulo.PRODUCTO,
        unidad: 'unidad',
        stock: 0,
        stockMinimo: 0,
        costo: 0,
        esRecurrente: false,
      });
    }
  }, [articulo, form]);

  const manejarCambioTipo = (tipo: TipoArticulo) => {
    setTipoSeleccionado(tipo);
    
    // Ajustar campos según el tipo
    if (tipo === TipoArticulo.SERVICIO) {
      form.setFieldsValue({
        stock: 0,
        stockMinimo: 0,
        unidad: 'servicio',
        codigoBarras: '',
        esRecurrente: false,
      });
    } else if (tipo === TipoArticulo.GASTO) {
      form.setFieldsValue({
        stock: 0,
        stockMinimo: 0,
        unidad: 'unidad',
        codigoBarras: '',
      });
    } else {
      form.setFieldsValue({
        unidad: 'unidad',
        esRecurrente: false,
      });
    }
    
    // Limpiar categoría si no hay categorías disponibles para el nuevo tipo
    const nuevasCategoriasDisponibles = categorias.filter(categoria => {
      if (tipo === TipoArticulo.PRODUCTO) {
        return categoria.activa && categoria.tipo === TipoCategoria.PRODUCTO;
      } else if (tipo === TipoArticulo.SERVICIO) {
        return categoria.activa && categoria.tipo === TipoCategoria.SERVICIO;
      } else if (tipo === TipoArticulo.GASTO) {
        return categoria.activa && categoria.tipo === TipoCategoria.GASTO;
      }
      return false;
    });
    
    if (nuevasCategoriasDisponibles.length === 0) {
      form.setFieldValue('categoriaId', undefined);
    }
  };

  const manejarEnvio = async (valores: any) => {
    try {
      // Validar que hay categorías disponibles
      if (categoriasDisponibles.length === 0) {
        message.error(`Primero debes crear una categoría para ${getNombreTipo(tipoSeleccionado)}`);
        return;
      }

      const datosArticulo: CrearArticuloInput = {
        ...valores,
        tipo: tipoSeleccionado,
      };

      const exito = await onGuardar(datosArticulo);
      
      if (exito) {
        message.success(
          articulo 
            ? `${getNombreTipo(tipoSeleccionado)} actualizado exitosamente` 
            : `${getNombreTipo(tipoSeleccionado)} creado exitosamente`
        );
        
        if (!articulo) {
          // Solo limpiar el formulario en modo creación
          form.resetFields();
          form.setFieldsValue({
            tipo: tipoSeleccionado,
            unidad: obtenerUnidadesComunes(tipoSeleccionado)[0],
            stock: 0,
            stockMinimo: 0,
            costo: 0,
            esRecurrente: false,
          });
        }
      }
    } catch (error) {
      message.error('Error al procesar el artículo');
    }
  };

  const calcularMargen = () => {
    const precio = form.getFieldValue('precio') || 0;
    const costo = form.getFieldValue('costo') || 0;
    
    if (precio > 0 && costo > 0) {
      const margen = ((precio - costo) / precio) * 100;
      return margen.toFixed(1);
    }
    return '0';
  };

  const getNombreTipo = (tipo: TipoArticulo) => {
    switch (tipo) {
      case TipoArticulo.PRODUCTO: return 'Producto';
      case TipoArticulo.SERVICIO: return 'Servicio';
      case TipoArticulo.GASTO: return 'Gasto';
      default: return 'Artículo';
    }
  };

  const getIconoTipo = (tipo: TipoArticulo) => {
    switch (tipo) {
      case TipoArticulo.PRODUCTO: return <BoxPlotOutlined />;
      case TipoArticulo.SERVICIO: return <ToolOutlined />;
      case TipoArticulo.GASTO: return <WalletOutlined />;
      default: return <ShoppingCartOutlined />;
    }
  };

  return (
    <Card
      style={{
        maxWidth: 700,
        margin: '0 auto',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0, textAlign: 'center' }}>
          {articulo ? `Editar ${getNombreTipo(articulo.tipo)}` : 'Nuevo Artículo'}
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', fontSize: '16px' }}>
          {articulo ? `Modifica los datos del ${getNombreTipo(articulo.tipo).toLowerCase()}` : 'Agrega un nuevo producto, servicio o tipo de gasto'}
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={manejarEnvio}
        size="large"
        disabled={cargando}
      >
        {/* Tipo de artículo */}
        <Form.Item
          name="tipo"
          label={<Text strong style={{ fontSize: '16px' }}>Tipo</Text>}
          rules={[{ required: true, message: 'Selecciona el tipo' }]}
        >
          <Radio.Group
            onChange={(e) => manejarCambioTipo(e.target.value)}
            style={{ width: '100%' }}
          >
            <Radio.Button
              value={TipoArticulo.PRODUCTO}
              style={{
                width: '33.33%',
                textAlign: 'center',
                height: '48px',
                lineHeight: '32px',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              <BoxPlotOutlined style={{ marginRight: '4px' }} />
              Producto
            </Radio.Button>
            <Radio.Button
              value={TipoArticulo.SERVICIO}
              style={{
                width: '33.33%',
                textAlign: 'center',
                height: '48px',
                lineHeight: '32px',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              <ToolOutlined style={{ marginRight: '4px' }} />
              Servicio
            </Radio.Button>
            <Radio.Button
              value={TipoArticulo.GASTO}
              style={{
                width: '33.33%',
                textAlign: 'center',
                height: '48px',
                lineHeight: '32px',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              <WalletOutlined style={{ marginRight: '4px' }} />
              Gasto
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        {/* Alerta si no hay categorías */}
        {categoriasDisponibles.length === 0 && (
          <Alert
            message={`No hay categorías para ${getNombreTipo(tipoSeleccionado).toLowerCase()}s`}
            description={`Debes crear al menos una categoría para ${getNombreTipo(tipoSeleccionado).toLowerCase()}s antes de continuar.`}
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {/* Nombre */}
        <Form.Item
          name="nombre"
          label={<Text strong style={{ fontSize: '16px' }}>Nombre</Text>}
          rules={[
            { required: true, message: 'Ingresa el nombre' },
            { min: 2, message: 'El nombre debe tener al menos 2 caracteres' },
            { max: 200, message: 'El nombre no puede exceder 200 caracteres' },
          ]}
        >
          <Input
            placeholder={`Nombre del ${getNombreTipo(tipoSeleccionado).toLowerCase()}`}
            style={{ height: '48px' }}
            prefix={getIconoTipo(tipoSeleccionado)}
          />
        </Form.Item>

        <Row gutter={16}>
          {/* Categoría */}
          <Col xs={24} sm={12}>
            <Form.Item
              name="categoriaId"
              label={<Text strong style={{ fontSize: '16px' }}>Categoría</Text>}
              rules={[{ required: true, message: 'Selecciona una categoría' }]}
            >
              <Select
                placeholder="Selecciona la categoría"
                style={{ height: '48px' }}
                suffixIcon={<TagsOutlined />}
                disabled={categoriasDisponibles.length === 0}
              >
                {categoriasDisponibles.map(categoria => (
                  <Select.Option key={categoria.id} value={categoria.id}>
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
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* Unidad */}
          <Col xs={24} sm={12}>
            <Form.Item
              name="unidad"
              label={<Text strong style={{ fontSize: '16px' }}>Unidad de Medida</Text>}
              rules={[{ required: true, message: 'Selecciona o ingresa la unidad' }]}
            >
              <Select
                placeholder="Selecciona la unidad"
                style={{ height: '48px' }}
                showSearch
                allowClear
                mode="combobox"
              >
                {unidadesComunes.map(unidad => (
                  <Select.Option key={unidad} value={unidad}>
                    {unidad}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Precio */}
          <Col xs={24} sm={12}>
            <Form.Item
              name="precio"
              label={<Text strong style={{ fontSize: '16px' }}>
                {tipoSeleccionado === TipoArticulo.GASTO ? 'Monto' : 'Precio de Venta'}
              </Text>}
              rules={[
                { required: true, message: 'Ingresa el precio/monto' },
                { type: 'number', min: 0.01, message: 'El precio debe ser mayor a 0' },
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

          {/* Costo (solo para productos y servicios) */}
          {tipoSeleccionado !== TipoArticulo.GASTO && (
            <Col xs={24} sm={12}>
              <Form.Item
                name="costo"
                label={<Text strong style={{ fontSize: '16px' }}>Costo (Opcional)</Text>}
                rules={[{ type: 'number', min: 0, message: 'El costo no puede ser negativo' }]}
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
          )}
        </Row>

        {/* Información de margen (solo para productos y servicios) */}
        {tipoSeleccionado !== TipoArticulo.GASTO && (
          <div style={{ 
            background: '#f9f9f9', 
            padding: '12px', 
            borderRadius: '6px', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <InfoCircleOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              <Text>Margen de ganancia:</Text>
            </div>
            <Text strong style={{ color: '#52c41a' }}>
              {calcularMargen()}%
            </Text>
          </div>
        )}

        {/* Campos específicos para productos */}
        {tipoSeleccionado === TipoArticulo.PRODUCTO && (
          <Row gutter={16}>
            {/* Stock actual */}
            <Col xs={24} sm={12}>
              <Form.Item
                name="stock"
                label={<Text strong style={{ fontSize: '16px' }}>Stock Actual</Text>}
                rules={[
                  { required: true, message: 'Ingresa el stock actual' },
                  { type: 'number', min: 0, message: 'El stock no puede ser negativo' },
                ]}
              >
                <InputNumber
                  placeholder="0"
                  style={{ width: '100%', height: '48px' }}
                  min={0}
                  precision={0}
                />
              </Form.Item>
            </Col>

            {/* Stock mínimo */}
            <Col xs={24} sm={12}>
              <Form.Item
                name="stockMinimo"
                label={<Text strong style={{ fontSize: '16px' }}>Stock Mínimo</Text>}
                rules={[{ type: 'number', min: 0, message: 'El stock mínimo no puede ser negativo' }]}
              >
                <InputNumber
                  placeholder="0"
                  style={{ width: '100%', height: '48px' }}
                  min={0}
                  precision={0}
                />
              </Form.Item>
            </Col>
          </Row>
        )}

        {/* Código de barras (solo productos) */}
        {tipoSeleccionado === TipoArticulo.PRODUCTO && (
          <Form.Item
            name="codigoBarras"
            label={<Text strong style={{ fontSize: '16px' }}>Código de Barras (Opcional)</Text>}
            rules={[{ max: 100, message: 'El código no puede exceder 100 caracteres' }]}
          >
            <Input
              placeholder="Código de barras o SKU"
              style={{ height: '48px' }}
              prefix={<BarcodeOutlined />}
            />
          </Form.Item>
        )}

        {/* Campos específicos para gastos */}
        {tipoSeleccionado === TipoArticulo.GASTO && (
          <>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="esRecurrente"
                  label={<Text strong style={{ fontSize: '16px' }}>¿Es un gasto recurrente?</Text>}
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="frecuencia"
                  label={<Text strong style={{ fontSize: '16px' }}>Frecuencia</Text>}
                  rules={[
                    {
                      required: form.getFieldValue('esRecurrente'),
                      message: 'Selecciona la frecuencia para gastos recurrentes'
                    }
                  ]}
                >
                  <Select
                    placeholder="Selecciona frecuencia"
                    style={{ height: '48px' }}
                    disabled={!form.getFieldValue('esRecurrente')}
                  >
                    <Select.Option value="MENSUAL">Mensual</Select.Option>
                    <Select.Option value="TRIMESTRAL">Trimestral</Select.Option>
                    <Select.Option value="ANUAL">Anual</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {/* Descripción */}
        <Form.Item
          name="descripcion"
          label={<Text strong style={{ fontSize: '16px' }}>Descripción (Opcional)</Text>}
          rules={[{ max: 1000, message: 'La descripción no puede exceder 1000 caracteres' }]}
        >
          <TextArea
            placeholder={`Descripción detallada del ${getNombreTipo(tipoSeleccionado).toLowerCase()}...`}
            rows={4}
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
              disabled={categoriasDisponibles.length === 0}
            >
              {articulo ? 'Actualizar' : 'Guardar'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default FormularioArticulo;