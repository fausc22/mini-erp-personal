import React, { useState, useEffect } from 'react';
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
  DatePicker,
  Row,
  Col,
  Statistic,
  Modal,
  message,
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
  DollarOutlined,
  BoxPlotOutlined,
  ToolOutlined,
  WalletOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { useApp } from '@/context/AppContext';
import { Transaccion, TipoTransaccion, CrearTransaccionInput, TipoArticulo } from '@/types';
import FormularioTransaccion from '@/components/forms/FormularioTransaccion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Head from 'next/head';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const PaginaTransacciones: React.FC = () => {
  const { 
    transacciones, 
    cuentas, 
    categorias, 
    articulos,
    crearTransaccion, 
    actualizarTransaccion,
    cargando 
  } = useApp();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [transaccionEditando, setTransaccionEditando] = useState<Transaccion | undefined>();
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<TipoTransaccion | undefined>();
  const [filtroCuenta, setFiltroCuenta] = useState<string | undefined>();
  const [filtroCategoria, setFiltroCategoria] = useState<string | undefined>();
  const [filtroTipoArticulo, setFiltroTipoArticulo] = useState<TipoArticulo | undefined>();

  // Función para formatear moneda
  const formatearMoneda = (monto: number, moneda: string = 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda,
    }).format(monto);
  };

  // Obtener información del artículo
  const obtenerArticuloInfo = (articuloId?: string) => {
    if (!articuloId) return null;
    return articulos.find(a => a.id === articuloId);
  };

  // Filtrar transacciones
  const transaccionesFiltradas = transacciones.filter(transaccion => {
    const coincideTexto = !filtroTexto || 
      transaccion.descripcion.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      transaccion.notas?.toLowerCase().includes(filtroTexto.toLowerCase());
    
    const coincideTipo = !filtroTipo || transaccion.tipo === filtroTipo;
    const coincideCuenta = !filtroCuenta || transaccion.cuentaId === filtroCuenta;
    const coincideCategoria = !filtroCategoria || transaccion.categoriaId === filtroCategoria;
    
    // Filtro por tipo de artículo
    let coincideTipoArticulo = true;
    if (filtroTipoArticulo && transaccion.articuloId) {
      const articulo = obtenerArticuloInfo(transaccion.articuloId);
      coincideTipoArticulo = articulo?.tipo === filtroTipoArticulo;
    } else if (filtroTipoArticulo && !transaccion.articuloId) {
      coincideTipoArticulo = false;
    }

    return coincideTexto && coincideTipo && coincideCuenta && coincideCategoria && coincideTipoArticulo;
  });

  // Calcular estadísticas
  const totalIngresos = transaccionesFiltradas
    .filter(t => t.tipo === TipoTransaccion.INGRESO)
    .reduce((sum, t) => sum + t.monto, 0);

  const totalGastos = transaccionesFiltradas
    .filter(t => t.tipo === TipoTransaccion.GASTO)
    .reduce((sum, t) => sum + t.monto, 0);

  // Estadísticas por tipo de artículo
  const transaccionesPorTipoArticulo = {
    productos: transaccionesFiltradas.filter(t => {
      const articulo = obtenerArticuloInfo(t.articuloId);
      return articulo?.tipo === TipoArticulo.PRODUCTO;
    }).length,
    servicios: transaccionesFiltradas.filter(t => {
      const articulo = obtenerArticuloInfo(t.articuloId);
      return articulo?.tipo === TipoArticulo.SERVICIO;
    }).length,
    gastos: transaccionesFiltradas.filter(t => {
      const articulo = obtenerArticuloInfo(t.articuloId);
      return articulo?.tipo === TipoArticulo.GASTO;
    }).length,
    sinArticulo: transaccionesFiltradas.filter(t => !t.articuloId).length,
  };

  const manejarNuevaTransaccion = () => {
    setTransaccionEditando(undefined);
    setMostrarFormulario(true);
  };

  const manejarEditarTransaccion = (transaccion: Transaccion) => {
    setTransaccionEditando(transaccion);
    setMostrarFormulario(true);
  };

  const manejarGuardarTransaccion = async (datos: CrearTransaccionInput): Promise<boolean> => {
    try {
      if (transaccionEditando) {
        // Actualizar transacción existente
        const resultado = await actualizarTransaccion(transaccionEditando.id, datos);
        if (resultado) {
          setMostrarFormulario(false);
          setTransaccionEditando(undefined);
          return true;
        }
      } else {
        // Crear nueva transacción
        const resultado = await crearTransaccion(datos);
        if (resultado) {
          setMostrarFormulario(false);
          return true;
        }
      }
      return false;
    } catch (error) {
      message.error('Error al guardar la transacción');
      return false;
    }
  };

  const manejarCancelarFormulario = () => {
    setMostrarFormulario(false);
    setTransaccionEditando(undefined);
  };

  const manejarEliminarTransaccion = (transaccion: Transaccion) => {
    Modal.confirm({
      title: '¿Eliminar transacción?',
      content: `¿Estás seguro de que deseas eliminar "${transaccion.descripcion}"?`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk() {
        // TODO: Implementar eliminación
        message.info('Funcionalidad de eliminación pendiente');
      },
    });
  };

  const obtenerIconoTipoArticulo = (tipo: TipoArticulo) => {
    switch (tipo) {
      case TipoArticulo.PRODUCTO: return <BoxPlotOutlined style={{ color: '#1890ff' }} />;
      case TipoArticulo.SERVICIO: return <ToolOutlined style={{ color: '#52c41a' }} />;
      case TipoArticulo.GASTO: return <WalletOutlined style={{ color: '#fa8c16' }} />;
      default: return null;
    }
  };

  const obtenerNombreTipoArticulo = (tipo: TipoArticulo) => {
    switch (tipo) {
      case TipoArticulo.PRODUCTO: return 'Producto';
      case TipoArticulo.SERVICIO: return 'Servicio';
      case TipoArticulo.GASTO: return 'Gasto';
      default: return '';
    }
  };

  // Configuración de columnas de la tabla
  const columnas: ColumnsType<Transaccion> = [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      width: 120,
      render: (fecha: string) => (
        <Text style={{ fontSize: '14px' }}>
          {format(new Date(fecha), 'dd/MM/yyyy', { locale: es })}
        </Text>
      ),
      sorter: (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 100,
      render: (tipo: TipoTransaccion) => (
        <Tag 
          color={tipo === TipoTransaccion.INGRESO ? 'green' : 'red'}
        >
          {tipo === TipoTransaccion.INGRESO ? 'Ingreso' : 'Gasto'}
        </Tag>
      ),
      filters: [
        { text: 'Ingresos', value: TipoTransaccion.INGRESO },
        { text: 'Gastos', value: TipoTransaccion.GASTO },
      ],
      onFilter: (value, record) => record.tipo === value,
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      ellipsis: true,
      render: (descripcion: string, record: Transaccion) => {
        const articuloInfo = obtenerArticuloInfo(record.articuloId);
        
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              {articuloInfo && obtenerIconoTipoArticulo(articuloInfo.tipo)}
              <Text strong style={{ 
                fontSize: '14px',
                marginLeft: articuloInfo ? '8px' : '0'
              }}>
                {descripcion}
              </Text>
            </div>
            
            {articuloInfo && (
              <div style={{ marginBottom: '4px' }}>
                <Tag 
                  size="small" 
                  color={
                    articuloInfo.tipo === TipoArticulo.PRODUCTO ? 'blue' :
                    articuloInfo.tipo === TipoArticulo.SERVICIO ? 'green' : 'orange'
                  }
                >
                  {obtenerNombreTipoArticulo(articuloInfo.tipo)}: {articuloInfo.nombre}
                </Tag>
              </div>
            )}
            
            {record.notas && (
              <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>
                {record.notas}
              </Text>
            )}
          </div>
        );
      },
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
      title: 'Cuenta',
      dataIndex: 'cuenta',
      key: 'cuenta',
      width: 120,
      render: (cuenta: any) => cuenta && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: cuenta.color,
              marginRight: '6px',
            }}
          />
          <Text style={{ fontSize: '14px' }}>{cuenta.nombre}</Text>
        </div>
      ),
    },
    {
      title: 'Monto',
      dataIndex: 'monto',
      key: 'monto',
      width: 120,
      align: 'right',
      render: (monto: number, record: Transaccion) => {
        const cuenta = cuentas.find(c => c.id === record.cuentaId);
        return (
          <Text
            strong
            style={{ 
              color: record.tipo === TipoTransaccion.INGRESO ? '#52c41a' : '#ff4d4f',
              fontSize: '14px'
            }}
          >
            {record.tipo === TipoTransaccion.INGRESO ? '+' : '-'}
            {formatearMoneda(monto, cuenta?.moneda)}
          </Text>
        );
      },
      sorter: (a, b) => a.monto - b.monto,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 80,
      render: (_, record: Transaccion) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'editar',
                icon: <EditOutlined />,
                label: 'Editar',
                onClick: () => manejarEditarTransaccion(record),
              },
              {
                key: 'eliminar',
                icon: <DeleteOutlined />,
                label: 'Eliminar',
                danger: true,
                onClick: () => manejarEliminarTransaccion(record),
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
        <title>Transacciones - Mi ERP Personal</title>
        <meta name="description" content="Gestiona tus ingresos y gastos" />
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
              Transacciones
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Gestiona tus ingresos y gastos
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={manejarNuevaTransaccion}
            size="large"
          >
            Nueva Transacción
          </Button>
        </div>

        {/* Estadísticas principales */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Total Ingresos"
                value={totalIngresos}
                precision={2}
                prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                formatter={(value) => formatearMoneda(Number(value))}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Total Gastos"
                value={totalGastos}
                precision={2}
                prefix={<DollarOutlined style={{ color: '#ff4d4f' }} />}
                formatter={(value) => formatearMoneda(Number(value))}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Balance"
                value={totalIngresos - totalGastos}
                precision={2}
                prefix={<DollarOutlined />}
                formatter={(value) => formatearMoneda(Number(value))}
                valueStyle={{ color: totalIngresos - totalGastos >= 0 ? '#52c41a' : '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Estadísticas por tipo de artículo */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Productos"
                value={transaccionesPorTipoArticulo.productos}
                prefix={<BoxPlotOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Servicios"
                value={transaccionesPorTipoArticulo.servicios}
                prefix={<ToolOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Gastos"
                value={transaccionesPorTipoArticulo.gastos}
                prefix={<WalletOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Sin Vincular"
                value={transaccionesPorTipoArticulo.sinArticulo}
                prefix={<ShoppingCartOutlined style={{ color: '#8c8c8c' }} />}
                valueStyle={{ color: '#8c8c8c' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filtros */}
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Buscar descripción..."
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
                <Select.Option value={TipoTransaccion.INGRESO}>Ingresos</Select.Option>
                <Select.Option value={TipoTransaccion.GASTO}>Gastos</Select.Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Tipo Artículo"
                value={filtroTipoArticulo}
                onChange={setFiltroTipoArticulo}
                allowClear
                style={{ width: '100%' }}
              >
                <Select.Option value={TipoArticulo.PRODUCTO}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <BoxPlotOutlined style={{ marginRight: '8px' }} />
                    Productos
                  </div>
                </Select.Option>
                <Select.Option value={TipoArticulo.SERVICIO}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <ToolOutlined style={{ marginRight: '8px' }} />
                    Servicios
                  </div>
                </Select.Option>
                <Select.Option value={TipoArticulo.GASTO}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <WalletOutlined style={{ marginRight: '8px' }} />
                    Gastos
                  </div>
                </Select.Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Select
                placeholder="Cuenta"
                value={filtroCuenta}
                onChange={setFiltroCuenta}
                allowClear
                style={{ width: '100%' }}
              >
                {cuentas.map(cuenta => (
                  <Select.Option key={cuenta.id} value={cuenta.id}>
                    {cuenta.nombre}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={5}>
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
          </Row>
        </Card>

        {/* Tabla de transacciones */}
        <Card>
          <Table
            columns={columnas}
            dataSource={transaccionesFiltradas}
            rowKey="id"
            loading={cargando}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} de ${total} transacciones`,
            }}
            scroll={{ x: 1000 }}
          />
        </Card>

        {/* Modal del formulario */}
        <Modal
          title={transaccionEditando ? 'Editar Transacción' : 'Nueva Transacción'}
          open={mostrarFormulario}
          onCancel={manejarCancelarFormulario}
          footer={null}
          width={700}
          destroyOnClose
        >
          <FormularioTransaccion
            transaccion={transaccionEditando}
            onGuardar={manejarGuardarTransaccion}
            onCancelar={manejarCancelarFormulario}
            cargando={cargando}
          />
        </Modal>
      </div>
    </>
  );
};

export default PaginaTransacciones;