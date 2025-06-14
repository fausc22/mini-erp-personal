import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Card, 
  Typography, 
  Space, 
  Tag, 
  Dropdown, 
  Input,
  Select,
  Row,
  Col,
  Statistic,
  Modal,
  message,
  Empty,
  Badge
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  ShoppingCartOutlined,
  ToolOutlined,
  BoxPlotOutlined,
  ExclamationCircleOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useApp } from '@/context/AppContext';
import { Articulo, TipoArticulo, CrearArticuloInput } from '@/types';
import FormularioArticulo from '@/components/forms/FormularioArticulo';
import { useRouter } from 'next/router';
import Head from 'next/head';

const { Title, Text } = Typography;

const PaginaArticulos: React.FC = () => {
  const { articulos, categorias, crearArticulo, actualizarArticulo, cargando } = useApp();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [articuloEditando, setArticuloEditando] = useState<Articulo | undefined>();
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<TipoArticulo | undefined>();
  const [filtroCategoria, setFiltroCategoria] = useState<string | undefined>();
  const [soloStockBajo, setSoloStockBajo] = useState(false);
  const router = useRouter();

  // Aplicar filtro de stock bajo desde query params
  React.useEffect(() => {
    if (router.query.stockBajo === 'true') {
      setSoloStockBajo(true);
    }
  }, [router.query]);

  // Función para formatear moneda
  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(monto);
  };

  // Filtrar artículos
  const articulosFiltrados = articulos.filter(articulo => {
    const coincideTexto = !filtroTexto || 
      articulo.nombre.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      articulo.descripcion?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      articulo.codigoBarras?.toLowerCase().includes(filtroTexto.toLowerCase());
    
    const coincideTipo = !filtroTipo || articulo.tipo === filtroTipo;
    const coincideCategoria = !filtroCategoria || articulo.categoriaId === filtroCategoria;
    
    // Solo aplicar filtro de stock bajo a productos
    const coincideStock = !soloStockBajo || (
      articulo.tipo === TipoArticulo.PRODUCTO && 
      articulo.stock <= (articulo.stockMinimo || 0)
    );

    return coincideTexto && coincideTipo && coincideCategoria && coincideStock;
  });

  // Calcular estadísticas
  const productos = articulosFiltrados.filter(a => a.tipo === TipoArticulo.PRODUCTO);
  const servicios = articulosFiltrados.filter(a => a.tipo === TipoArticulo.SERVICIO);
  const gastos = articulosFiltrados.filter(a => a.tipo === TipoArticulo.GASTO);
  const stockBajo = productos.filter(a => a.activo && a.stock <= (a.stockMinimo || 0));

  const manejarNuevoArticulo = () => {
    setArticuloEditando(undefined);
    setMostrarFormulario(true);
  };

  const manejarEditarArticulo = (articulo: Articulo) => {
    setArticuloEditando(articulo);
    setMostrarFormulario(true);
  };

  const manejarGuardarArticulo = async (datos: CrearArticuloInput): Promise<boolean> => {
    try {
      if (articuloEditando) {
        // Actualizar artículo existente
        const resultado = await actualizarArticulo(articuloEditando.id, datos);
        if (resultado) {
          setMostrarFormulario(false);
          setArticuloEditando(undefined);
          return true;
        }
      } else {
        // Crear nuevo artículo
        const resultado = await crearArticulo(datos);
        if (resultado) {
          setMostrarFormulario(false);
          return true;
        }
      }
      return false;
    } catch (error) {
      message.error('Error al guardar el artículo');
      return false;
    }
  };

  const manejarCancelarFormulario = () => {
    setMostrarFormulario(false);
    setArticuloEditando(undefined);
  };

  const manejarEliminarArticulo = (articulo: Articulo) => {
    Modal.confirm({
      title: '¿Eliminar artículo?',
      content: `¿Estás seguro de que deseas eliminar "${articulo.nombre}"?`,
      icon: <ExclamationCircleOutlined />,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk() {
        // TODO: Implementar eliminación
        message.info('Funcionalidad de eliminación pendiente');
      },
    });
  };

  const obtenerIconoTipo = (tipo: TipoArticulo) => {
    switch (tipo) {
      case TipoArticulo.PRODUCTO:
        return <BoxPlotOutlined style={{ color: '#1890ff' }} />;
      case TipoArticulo.SERVICIO:
        return <ToolOutlined style={{ color: '#52c41a' }} />;
      case TipoArticulo.GASTO:
        return <WalletOutlined style={{ color: '#fa8c16' }} />;
      default:
        return <ShoppingCartOutlined />;
    }
  };

  const obtenerNombreTipo = (tipo: TipoArticulo) => {
    switch (tipo) {
      case TipoArticulo.PRODUCTO: return 'Producto';
      case TipoArticulo.SERVICIO: return 'Servicio';
      case TipoArticulo.GASTO: return 'Gasto';
      default: return tipo;
    }
  };

  const obtenerColorTipo = (tipo: TipoArticulo) => {
    switch (tipo) {
      case TipoArticulo.PRODUCTO: return 'blue';
      case TipoArticulo.SERVICIO: return 'green';
      case TipoArticulo.GASTO: return 'orange';
      default: return 'default';
    }
  };

  // Configuración de columnas de la tabla
  const columnas: ColumnsType<Articulo> = [
    {
      title: 'Artículo',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (nombre: string, record: Articulo) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
            {obtenerIconoTipo(record.tipo)}
            <Text strong style={{ fontSize: '14px', marginLeft: '8px' }}>{nombre}</Text>
            {!record.activo && (
              <Tag color="default" style={{ marginLeft: '8px' }}>Inactivo</Tag>
            )}
            {record.tipo === TipoArticulo.PRODUCTO && record.stock <= (record.stockMinimo || 0) && (
              <Tag color="red" style={{ marginLeft: '8px' }}>Stock Bajo</Tag>
            )}
            {record.tipo === TipoArticulo.GASTO && record.esRecurrente && (
              <Tag color="purple" style={{ marginLeft: '8px' }}>Recurrente</Tag>
            )}
          </div>
          {record.descripcion && (
            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
              {record.descripcion}
            </Text>
          )}
          {record.codigoBarras && (
            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
              Código: {record.codigoBarras}
            </Text>
          )}
        </div>
      ),
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 100,
      render: (tipo: TipoArticulo) => (
        <Tag color={obtenerColorTipo(tipo)}>
          {obtenerNombreTipo(tipo)}
        </Tag>
      ),
      filters: [
        { text: 'Productos', value: TipoArticulo.PRODUCTO },
        { text: 'Servicios', value: TipoArticulo.SERVICIO },
        { text: 'Gastos', value: TipoArticulo.GASTO },
      ],
      onFilter: (value, record) => record.tipo === value,
    },
    {
      title: 'Categoría',
      dataIndex: 'categoria',
      key: 'categoria',
      width: 120,
      render: (categoria: any) => categoria && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: categoria.color,
              marginRight: '6px',
            }}
          />
          <Text style={{ fontSize: '14px' }}>{categoria.nombre}</Text>
        </div>
      ),
    },
    {
      title: 'Precio/Monto',
      dataIndex: 'precio',
      key: 'precio',
      width: 100,
      align: 'right',
      render: (precio: number) => (
        <Text strong style={{ fontSize: '14px' }}>
          {formatearMoneda(precio)}
        </Text>
      ),
      sorter: (a, b) => a.precio - b.precio,
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
      align: 'center',
      render: (stock: number, record: Articulo) => {
        if (record.tipo !== TipoArticulo.PRODUCTO) {
          return <Text type="secondary">N/A</Text>;
        }
        
        const esBajo = stock <= (record.stockMinimo || 0);
        return (
          <Badge 
            count={esBajo ? '!' : 0} 
            style={{ backgroundColor: '#f5222d' }}
          >
            <Text 
              style={{ 
                color: esBajo ? '#f5222d' : '#262626',
                fontWeight: esBajo ? 'bold' : 'normal'
              }}
            >
              {stock} {record.unidad}
            </Text>
          </Badge>
        );
      },
      sorter: (a, b) => a.stock - b.stock,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 80,
      render: (_, record: Articulo) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'editar',
                icon: <EditOutlined />,
                label: 'Editar',
                onClick: () => manejarEditarArticulo(record),
              },
              {
                key: 'eliminar',
                icon: <DeleteOutlined />,
                label: 'Eliminar',
                danger: true,
                onClick: () => manejarEliminarArticulo(record),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>Artículos - Mi ERP Personal</title>
        <meta name="description" content="Gestiona tu inventario de productos, servicios y gastos" />
      </Head>

      <div style={{ padding: '0' }}>
        {/* Encabezado */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Inventario
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Gestiona tu inventario de productos, servicios y gastos
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={manejarNuevoArticulo}
            size="large"
          >
            Nuevo Artículo
          </Button>
        </div>

        {/* Estadísticas */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Total Artículos"
                value={articulosFiltrados.length}
                prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Productos"
                value={productos.length}
                prefix={<BoxPlotOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Servicios"
                value={servicios.length}
                prefix={<ToolOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Gastos"
                value={gastos.length}
                prefix={<WalletOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Stock Bajo"
                value={stockBajo.length}
                prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filtros */}
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Buscar por nombre, descripción o código..."
                prefix={<SearchOutlined />}
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Tipo"
                value={filtroTipo}
                onChange={setFiltroTipo}
                allowClear
                style={{ width: '100%' }}
              >
                <Select.Option value={TipoArticulo.PRODUCTO}>Productos</Select.Option>
                <Select.Option value={TipoArticulo.SERVICIO}>Servicios</Select.Option>
                <Select.Option value={TipoArticulo.GASTO}>Gastos</Select.Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Categoría"
                value={filtroCategoria}
                onChange={setFiltroCategoria}
                allowClear
                style={{ width: '100%' }}
              >
                {categorias.map(categoria => (
                  <Select.Option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Button
                type={soloStockBajo ? 'primary' : 'default'}
                icon={<ExclamationCircleOutlined />}
                onClick={() => setSoloStockBajo(!soloStockBajo)}
                style={{ width: '100%' }}
              >
                Solo Stock Bajo (Productos)
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Tabla de artículos */}
        <Card>
          {articulosFiltrados.length > 0 ? (
            <Table
              columns={columnas}
              dataSource={articulosFiltrados}
              rowKey="id"
              loading={cargando}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} de ${total} artículos`,
              }}
              scroll={{ x: 800 }}
            />
          ) : (
            <Empty
              image={<ShoppingCartOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
              description={
                <div>
                  <Title level={4}>No hay artículos</Title>
                  <Text type="secondary">
                    Comienza agregando tu primer producto, servicio o gasto
                  </Text>
                </div>
              }
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={manejarNuevoArticulo}
                size="large"
              >
                Agregar Primer Artículo
              </Button>
            </Empty>
          )}
        </Card>

        {/* Modal del formulario */}
        <Modal
          title={articuloEditando ? 'Editar Artículo' : 'Nuevo Artículo'}
          open={mostrarFormulario}
          onCancel={manejarCancelarFormulario}
          footer={null}
          width={800}
          destroyOnClose
        >
          <FormularioArticulo
            articulo={articuloEditando}
            onGuardar={manejarGuardarArticulo}
            onCancelar={manejarCancelarFormulario}
            cargando={cargando}
          />
        </Modal>
      </div>
    </>
  );
};

export default PaginaArticulos;