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
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
} from '@ant-design/icons';
import { useApp } from '@/src/context/AppContext';
import { Transaccion, TipoTransaccion, CrearTransaccionInput } from '@/types';
import FormularioTransaccion from '@/src/components/forms/FormularioTransaccion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Head from 'next/head';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const PaginaTransacciones: React.FC = () => {
  const { transacciones, cuentas, categorias, crearTransaccion, cargando } = useApp();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [transaccionEditando, setTransaccionEditando] = useState<Transaccion | undefined>();
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<TipoTransaccion | undefined>();
  const [filtroCuenta, setFiltroCuenta] = useState<string | undefined>();
  const [filtroCategoria, setFiltroCategoria] = useState<string | undefined>();

  // Función para formatear moneda
  const formatearMoneda = (monto: number, moneda: string = 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda,
    }).format(monto);
  };

  // Filtrar transacciones
  const transaccionesFiltradas = transacciones.filter(transaccion => {
    const coincideTexto = !filtroTexto || 
      transaccion.descripcion.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      transaccion.notas?.toLowerCase().includes(filtroTexto.toLowerCase());
    
    const coincideTipo = !filtroTipo || transaccion.tipo === filtroTipo;
    const coincideCuenta = !filtroCuenta || transaccion.cuentaId === filtroCuenta;
    const coincideCategoria = !filtroCategoria || transaccion.categoriaId === filtroCategoria;

    return coincideTexto && coincideTipo && coincideCuenta && coincideCategoria;
  });

  // Calcular estadísticas
  const totalIngresos = transaccionesFiltradas
    .filter(t => t.tipo === TipoTransaccion.INGRESO)
    .reduce((sum, t) => sum + t.monto, 0);

  const totalGastos = transaccionesFiltradas
    .filter(t => t.tipo === TipoTransaccion.GASTO)
    .reduce((sum, t) => sum + t.monto, 0);

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
        // TODO: Implementar actualización
        message.info('Funcionalidad de edición pendiente');
        return false;
      } else {
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
          icon={tipo === TipoTransaccion.INGRESO ? <TrendingUpOutlined /> : <TrendingDownOutlined />}
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
      render: (descripcion: string, record: Transaccion) => (
        <div>
          <Text strong style={{ fontSize: '14px' }}>{descripcion}</Text>
          {record.notas && (
            <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>
              {record.notas}
            </Text>
          )}
        </div>
      ),
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
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

        {/* Estadísticas */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Total Ingresos"
                value={totalIngresos}
                precision={2}
                prefix={<TrendingUpOutlined style={{ color: '#52c41a' }} />}
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
                prefix={<TrendingDownOutlined style={{ color: '#ff4d4f' }} />}
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
                formatter={(value) => formatearMoneda(Number(value))}
                valueStyle={{ color: totalIngresos - totalGastos >= 0 ? '#52c41a' : '#ff4d4f' }}
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
            <Col xs={24} sm={12} md={6}>
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
            <Col xs={24} sm={12} md={6}>
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
            scroll={{ x: 800 }}
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