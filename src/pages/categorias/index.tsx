import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Row, 
  Col, 
  Modal,
  message,
  Dropdown,
  Space,
  Tag,
  Empty,
  Divider,
  Form,
  Input,
  Select,
  ColorPicker
} from 'antd';
import {
  PlusOutlined,
  TagsOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  BoxPlotOutlined,
  ToolOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useApp } from '@/context/AppContext';
import { Categoria, TipoCategoria, CrearCategoriaInput } from '@/types';
import Head from 'next/head';

const { Title, Text } = Typography;

const PaginaCategorias: React.FC = () => {
  const { categorias, crearCategoria, cargando } = useApp();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | undefined>();
  const [form] = Form.useForm();

  // Agrupar categorías por tipo
  const categoriasProducto = categorias.filter(c => c.tipo === TipoCategoria.PRODUCTO);
  const categoriasServicio = categorias.filter(c => c.tipo === TipoCategoria.SERVICIO);

  const manejarNuevaCategoria = () => {
    setCategoriaEditando(undefined);
    form.resetFields();
    form.setFieldsValue({ 
      tipo: TipoCategoria.PRODUCTO,
      color: '#1890ff'
    });
    setMostrarFormulario(true);
  };

  const manejarEditarCategoria = (categoria: Categoria) => {
    setCategoriaEditando(categoria);
    form.setFieldsValue({
      nombre: categoria.nombre,
      tipo: categoria.tipo,
      color: categoria.color,
      icono: categoria.icono,
    });
    setMostrarFormulario(true);
  };

  const manejarGuardarCategoria = async (valores: any) => {
    try {
      if (categoriaEditando) {
        // TODO: Implementar actualización
        message.info('Funcionalidad de edición pendiente');
        return;
      } else {
        const datos: CrearCategoriaInput = {
          nombre: valores.nombre,
          tipo: valores.tipo,
          color: typeof valores.color === 'string' ? valores.color : valores.color.toHexString(),
          icono: valores.icono,
        };

        const resultado = await crearCategoria(datos);
        if (resultado) {
          message.success('Categoría creada exitosamente');
          setMostrarFormulario(false);
          form.resetFields();
        }
      }
    } catch (error) {
      message.error('Error al guardar la categoría');
    }
  };

  const manejarCancelarFormulario = () => {
    setMostrarFormulario(false);
    setCategoriaEditando(undefined);
    form.resetFields();
  };

  const manejarEliminarCategoria = (categoria: Categoria) => {
    Modal.confirm({
      title: '¿Eliminar categoría?',
      content: (
        <div>
          <p>¿Estás seguro de que deseas eliminar la categoría <strong>"{categoria.nombre}"</strong>?</p>
          <p style={{ color: '#ff4d4f', marginBottom: 0 }}>
            Esta acción puede afectar los artículos y transacciones asociadas.
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

  const renderCategorias = (categoriasList: Categoria[], titulo: string, icono: React.ReactNode) => (
    <div style={{ marginBottom: '32px' }}>
      <Title level={4} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
        {icono}
        <span style={{ marginLeft: '8px' }}>{titulo}</span>
        <Tag 
          color="blue" 
          style={{ marginLeft: '8px' }}
        >
          {categoriasList.filter(c => c.activa).length}
        </Tag>
      </Title>
      
      {categoriasList.length > 0 ? (
        <Row gutter={[16, 16]}>
          {categoriasList.map(categoria => (
            <Col xs={24} sm={12} md={8} lg={6} key={categoria.id}>
              <Card
                style={{
                  borderLeft: `4px solid ${categoria.color}`,
                  opacity: categoria.activa ? 1 : 0.6,
                }}
                actions={[
                  <Button
                    key="editar"
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => manejarEditarCategoria(categoria)}
                    title="Editar"
                  />,
                  <Dropdown
                    key="mas"
                    menu={{
                      items: [
                        {
                          key: 'eliminar',
                          icon: <DeleteOutlined />,
                          label: 'Eliminar',
                          danger: true,
                          onClick: () => manejarEliminarCategoria(categoria),
                        },
                      ],
                    }}
                    trigger={['click']}
                  >
                    <Button type="text" icon={<MoreOutlined />} />
                  </Dropdown>,
                ]}
              >
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: categoria.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      color: 'white',
                      fontSize: '18px',
                    }}
                  >
                    {categoria.icono ? (
                      <span>{categoria.icono}</span>
                    ) : (
                      categoria.nombre.charAt(0).toUpperCase()
                    )}
                  </div>
                  
                  <Title level={5} style={{ margin: 0, marginBottom: '8px' }}>
                    {categoria.nombre}
                  </Title>
                  
                  <Tag color={categoria.color}>
                    {categoria.tipo === TipoCategoria.PRODUCTO ? 'Producto' : 'Servicio'}
                  </Tag>
                  
                  {!categoria.activa && (
                    <Tag color="default" style={{ marginLeft: '4px' }}>
                      Inactiva
                    </Tag>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card>
          <Empty 
            description={`No hay categorías de ${titulo.toLowerCase()}`}
            style={{ padding: '20px 0' }}
          />
        </Card>
      )}
    </div>
  );

  return (
    <>
      <Head>
        <title>Categorías - Mi ERP Personal</title>
        <meta name="description" content="Gestiona las categorías de tus productos y servicios" />
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
              Categorías
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Organiza tus productos y servicios por categorías
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={manejarNuevaCategoria}
            size="large"
          >
            Nueva Categoría
          </Button>
        </div>

        {/* Estadísticas */}
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={8}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <TagsOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '8px' }} />
                <Title level={4} style={{ margin: 0 }}>
                  {categorias.filter(c => c.activa).length}
                </Title>
                <Text type="secondary">Total Activas</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <BoxPlotOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '8px' }} />
                <Title level={4} style={{ margin: 0 }}>
                  {categoriasProducto.filter(c => c.activa).length}
                </Title>
                <Text type="secondary">Para Productos</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <ToolOutlined style={{ fontSize: '32px', color: '#fa8c16', marginBottom: '8px' }} />
                <Title level={4} style={{ margin: 0 }}>
                  {categoriasServicio.filter(c => c.activa).length}
                </Title>
                <Text type="secondary">Para Servicios</Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Lista de categorías */}
        {renderCategorias(categoriasProducto, 'Categorías de Productos', <BoxPlotOutlined />)}
        {renderCategorias(categoriasServicio, 'Categorías de Servicios', <ToolOutlined />)}

        {/* Si no hay categorías */}
        {categorias.length === 0 && (
          <Card style={{ textAlign: 'center', padding: '40px' }}>
            <Empty
              image={<TagsOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
              description={
                <div>
                  <Title level={4}>No tienes categorías</Title>
                  <Text type="secondary" style={{ fontSize: '16px' }}>
                    Las categorías te ayudan a organizar tus productos y servicios
                  </Text>
                </div>
              }
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={manejarNuevaCategoria}
                size="large"
              >
                Crear Primera Categoría
              </Button>
            </Empty>
          </Card>
        )}

        {/* Modal del formulario */}
        <Modal
          title={categoriaEditando ? 'Editar Categoría' : 'Nueva Categoría'}
          open={mostrarFormulario}
          onCancel={manejarCancelarFormulario}
          footer={null}
          width={500}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={manejarGuardarCategoria}
            size="large"
          >
            {/* Nombre */}
            <Form.Item
              name="nombre"
              label="Nombre de la Categoría"
              rules={[
                { required: true, message: 'Ingresa el nombre de la categoría' },
                { min: 2, message: 'El nombre debe tener al menos 2 caracteres' },
                { max: 100, message: 'El nombre no puede exceder 100 caracteres' },
              ]}
            >
              <Input 
                placeholder="Ej: Alimentación, Consultoría, etc."
                style={{ height: '48px' }}
              />
            </Form.Item>

            {/* Tipo */}
            <Form.Item
              name="tipo"
              label="Tipo de Categoría"
              rules={[{ required: true, message: 'Selecciona el tipo' }]}
            >
              <Select
                placeholder="Selecciona el tipo"
                style={{ height: '48px' }}
              >
                <Select.Option value={TipoCategoria.PRODUCTO}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <BoxPlotOutlined style={{ marginRight: '8px' }} />
                    Para Productos
                  </div>
                </Select.Option>
                <Select.Option value={TipoCategoria.SERVICIO}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <ToolOutlined style={{ marginRight: '8px' }} />
                    Para Servicios
                  </div>
                </Select.Option>
              </Select>
            </Form.Item>

            {/* Color */}
            <Form.Item
              name="color"
              label="Color"
              initialValue="#1890ff"
            >
              <ColorPicker
                showText
                size="large"
                presets={[
                  {
                    label: 'Recomendados',
                    colors: [
                      '#1890ff', '#52c41a', '#faad14', '#f5222d', 
                      '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'
                    ],
                  },
                ]}
              />
            </Form.Item>

            {/* Icono (opcional) */}
            <Form.Item
              name="icono"
              label="Icono (Opcional)"
              rules={[{ max: 10, message: 'Máximo 10 caracteres' }]}
            >
              <Input 
                placeholder="🍎 📱 👕 🏠 etc."
                style={{ height: '48px' }}
              />
            </Form.Item>

            <Divider />

            {/* Botones */}
            <Form.Item style={{ marginBottom: 0 }}>
              <Space style={{ width: '100%', justifyContent: 'center' }}>
                <Button
                  size="large"
                  onClick={manejarCancelarFormulario}
                  style={{ minWidth: '120px' }}
                >
                  Cancelar
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={cargando}
                  icon={<SaveOutlined />}
                  size="large"
                  style={{ minWidth: '120px' }}
                >
                  {categoriaEditando ? 'Actualizar' : 'Guardar'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </>
  );
};

export default PaginaCategorias;