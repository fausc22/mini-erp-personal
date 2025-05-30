import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  DatePicker,
  Button,
  Select,
  Space,
  Statistic,
  Table,
  Empty
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  CalendarOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useApp } from '@/context/AppContext';
import { TipoTransaccion, Moneda } from '@/types';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import Head from 'next/head';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const PaginaReportes: React.FC = () => {
  const { transacciones, cuentas, categorias } = useApp();
  const [rangoFechas, setRangoFechas] = useState<[any, any] | null>(null);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string | undefined>();

  // Datos para el gráfico de líneas (últimos 6 meses)
  const datosGraficoMeses = React.useMemo(() => {
    const datos = [];
    
    for (let i = 5; i >= 0; i--) {
      const fecha = subMonths(new Date(), i);
      const inicioMes = startOfMonth(fecha);
      const finMes = endOfMonth(fecha);
      
      const transaccionesMes = transacciones.filter(t => {
        const fechaTransaccion = new Date(t.fecha);
        return fechaTransaccion >= inicioMes && fechaTransaccion <= finMes;
      });

      const ingresos = transaccionesMes
        .filter(t => t.tipo === TipoTransaccion.INGRESO)
        .reduce((sum, t) => sum + t.monto, 0);

      const gastos = transaccionesMes
        .filter(t => t.tipo === TipoTransaccion.GASTO)
        .reduce((sum, t) => sum + t.monto, 0);

      datos.push({
        mes: format(fecha, 'MMM yyyy', { locale: es }),
        ingresos,
        gastos,
        balance: ingresos - gastos,
      });
    }

    return datos;
  }, [transacciones]);

  // Datos para gráfico de pastel por categorías
  const datosGastosCategoria = React.useMemo(() => {
    const gastos = transacciones.filter(t => t.tipo === TipoTransaccion.GASTO);
    const agrupados = gastos.reduce((acc, transaccion) => {
      const categoria = categorias.find(c => c.id === transaccion.categoriaId);
      const nombre = categoria?.nombre || 'Sin categoría';
      const color = categoria?.color || '#d9d9d9';
      
      if (!acc[nombre]) {
        acc[nombre] = { nombre, valor: 0, color };
      }
      acc[nombre].valor += transaccion.monto;
      return acc;
    }, {} as Record<string, { nombre: string; valor: number; color: string }>);

    return Object.values(agrupados).sort((a, b) => b.valor - a.valor).slice(0, 8);
  }, [transacciones, categorias]);

  // Estadísticas generales
  const estadisticas = React.useMemo(() => {
    const ingresos = transacciones
      .filter(t => t.tipo === TipoTransaccion.INGRESO)
      .reduce((sum, t) => sum + t.monto, 0);

    const gastos = transacciones
      .filter(t => t.tipo === TipoTransaccion.GASTO)
      .reduce((sum, t) => sum + t.monto, 0);

    return {
      totalIngresos: ingresos,
      totalGastos: gastos,
      balance: ingresos - gastos,
      transacciones: transacciones.length,
    };
  }, [transacciones]);

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(monto);
  };

  return (
    <>
      <Head>
        <title>Reportes - Mi ERP Personal</title>
        <meta name="description" content="Analiza tus finanzas con gráficos y reportes detallados" />
      </Head>

      <div style={{ padding: '0' }}>
        {/* Encabezado */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            Reportes y Análisis
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Analiza tus finanzas con gráficos y reportes detallados
          </Text>
        </div>

        {/* Filtros */}
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>Rango de Fechas</Text>
                <RangePicker
                  value={rangoFechas}
                  onChange={setRangoFechas}
                  style={{ width: '100%' }}
                  placeholder={['Desde', 'Hasta']}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>Cuenta</Text>
                <Select
                  value={cuentaSeleccionada}
                  onChange={setCuentaSeleccionada}
                  placeholder="Todas las cuentas"
                  allowClear
                  style={{ width: '100%' }}
                >
                  {cuentas.map(cuenta => (
                    <Select.Option key={cuenta.id} value={cuenta.id}>
                      {cuenta.nombre}
                    </Select.Option>
                  ))}
                </Select>
              </Space>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>Exportar</Text>
                <Space>
                  <Button icon={<FileExcelOutlined />} disabled>
                    Excel
                  </Button>
                  <Button icon={<FilePdfOutlined />} disabled>
                    PDF
                  </Button>
                </Space>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Estadísticas generales */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Total Ingresos"
                value={estadisticas.totalIngresos}
                precision={2}
                prefix={<TrendingUpOutlined style={{ color: '#52c41a' }} />}
                formatter={(value) => formatearMoneda(Number(value))}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Total Gastos"
                value={estadisticas.totalGastos}
                precision={2}
                prefix={<TrendingDownOutlined style={{ color: '#ff4d4f' }} />}
                formatter={(value) => formatearMoneda(Number(value))}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Balance"
                value={estadisticas.balance}
                precision={2}
                formatter={(value) => formatearMoneda(Number(value))}
                valueStyle={{ 
                  color: estadisticas.balance >= 0 ? '#52c41a' : '#ff4d4f' 
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Transacciones"
                value={estadisticas.transacciones}
                prefix={<BarChartOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Gráficos */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          {/* Gráfico de líneas - Evolución mensual */}
          <Col xs={24} lg={16}>
            <Card 
              title={
                <Space>
                  <LineChartOutlined />
                  Evolución Mensual (Últimos 6 meses)
                </Space>
              }
            >
              {datosGraficoMeses.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={datosGraficoMeses}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis 
                      tickFormatter={(value) => formatearMoneda(value)}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatearMoneda(value), '']}
                      labelFormatter={(label) => `Mes: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ingresos" 
                      stroke="#52c41a" 
                      strokeWidth={2}
                      name="Ingresos"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="gastos" 
                      stroke="#ff4d4f" 
                      strokeWidth={2}
                      name="Gastos"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#1890ff" 
                      strokeWidth={2}
                      name="Balance"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No hay datos para mostrar" />
              )}
            </Card>
          </Col>

          {/* Gráfico de pastel - Gastos por categoría */}
          <Col xs={24} lg={8}>
            <Card 
              title={
                <Space>
                  <PieChartOutlined />
                  Gastos por Categoría
                </Space>
              }
            >
              {datosGastosCategoria.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={datosGastosCategoria}
                      dataKey="valor"
                      nameKey="nombre"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ nombre, percent }) => 
                        `${nombre} ${(percent * 100).toFixed(1)}%`
                      }
                    >
                      {datosGastosCategoria.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [formatearMoneda(value), 'Gasto']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No hay gastos para mostrar" />
              )}
            </Card>
          </Col>
        </Row>

        {/* Tabla de categorías con más gastos */}
        <Card 
          title={
            <Space>
              <BarChartOutlined />
              Top Categorías de Gastos
            </Space>
          }
        >
          {datosGastosCategoria.length > 0 ? (
            <Table
              dataSource={datosGastosCategoria}
              rowKey="nombre"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Categoría',
                  dataIndex: 'nombre',
                  key: 'nombre',
                  render: (nombre, record) => (
                    <Space>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: record.color,
                        }}
                      />
                      {nombre}
                    </Space>
                  ),
                },
                {
                  title: 'Monto Total',
                  dataIndex: 'valor',
                  key: 'valor',
                  align: 'right',
                  render: (valor) => (
                    <Text strong style={{ color: '#ff4d4f' }}>
                      {formatearMoneda(valor)}
                    </Text>
                  ),
                },
                {
                  title: '% del Total',
                  key: 'porcentaje',
                  align: 'right',
                  render: (_, record) => {
                    const total = datosGastosCategoria.reduce((sum, item) => sum + item.valor, 0);
                    const porcentaje = (record.valor / total) * 100;
                    return `${porcentaje.toFixed(1)}%`;
                  },
                },
              ]}
            />
          ) : (
            <Empty description="No hay datos de gastos" />
          )}
        </Card>

        {/* Mensaje sobre funciones futuras */}
        <Card style={{ marginTop: '24px', textAlign: 'center' }}>
          <Space direction="vertical" size="middle">
            <CalendarOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
            <Title level={4}>Próximamente</Title>
            <Text type="secondary">
              Más reportes y análisis avanzados estarán disponibles en futuras versiones:
              <br />
              • Comparativas año anterior
              <br />
              • Proyecciones y tendencias
              <br />
              • Reportes de inventario
              <br />
              • Exportación a Excel y PDF
            </Text>
          </Space>
        </Card>
      </div>
    </>
  );
};

export default PaginaReportes;