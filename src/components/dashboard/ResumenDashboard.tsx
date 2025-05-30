'use client';

import React from 'react';
import { Row, Col, Card, Statistic, Typography, Badge, Alert, Empty } from 'antd';
import {
  WalletOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  EuroOutlined,
} from '@ant-design/icons';
import { useApp } from '@/src/context/AppContext';
import { Moneda, TipoTransaccion } from '@/src/types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

const { Title, Text } = Typography;

const ResumenDashboard: React.FC = () => {
  const { usuarioActual, cuentas, transacciones, articulos, cargando } = useApp();

  // Calcular saldos por moneda
  const saldosPorMoneda = cuentas
    .filter(cuenta => cuenta.activa)
    .reduce((acc, cuenta) => {
      acc[cuenta.moneda] = (acc[cuenta.moneda] || 0) + cuenta.saldo;
      return acc;
    }, {} as Record<Moneda, number>);

  // Calcular transacciones del mes actual
  const inicioMes = startOfMonth(new Date());
  const finMes = endOfMonth(new Date());
  
  const transaccionesMes = transacciones.filter(transaccion => {
    const fechaTransaccion = new Date(transaccion.fecha);
    return fechaTransaccion >= inicioMes && fechaTransaccion <= finMes;
  });

  const ingresosMes = transaccionesMes
    .filter(t => t.tipo === TipoTransaccion.INGRESO)
    .reduce((sum, t) => sum + t.monto, 0);

  const gastosMes = transaccionesMes
    .filter(t => t.tipo === TipoTransaccion.GASTO)
    .reduce((sum, t) => sum + t.monto, 0);

  // Artículos con stock bajo
  const articulosStockBajo = articulos.filter(articulo => 
    articulo.activo && articulo.stock <= (articulo.stockMinimo || 0)
  );

  // Últimas 5 transacciones
  const ultimasTransacciones = transacciones
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 5);

  const formatearMoneda = (monto: number, moneda: Moneda = Moneda.ARS) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 2,
    }).format(monto);
  };

  const obtenerIconoMoneda = (moneda: Moneda) => {
    return moneda === Moneda.USD ? <DollarOutlined /> : <EuroOutlined />;
  };

  if (cargando) {
    return (
      <div style={{ padding: '24px' }}>
        <Title level={2}>Cargando dashboard...</Title>
      </div>
    );
  }

  return (
    <div style={{ padding: '0' }}>
      {/* Encabezado */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Dashboard
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          Resumen de {format(new Date(), 'MMMM yyyy', { locale: es })}
        </Text>
      </div>

      {/* Alertas */}
      {articulosStockBajo.length > 0 && (
        <Alert
          message={`${articulosStockBajo.length} artículo(s) con stock bajo`}
          description="Revisa tu inventario para evitar quedarte sin stock"
          type="warning"
          showIcon
          style={{ marginBottom: '24px', borderRadius: '8px' }}
        />
      )}

      {/* Tarjetas de estadísticas principales */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        {/* Saldos por moneda */}
        {Object.entries(saldosPorMoneda).map(([moneda, saldo]) => (
          <Col xs={24} sm={12} lg={6} key={moneda}>
            <Card
              style={{ 
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #f0f0f0'
              }}
            >
              <Statistic
                title={`Saldo Total ${moneda}`}
                value={saldo}
                precision={2}
                prefix={obtenerIconoMoneda(moneda as Moneda)}
                formatter={(value) => formatearMoneda(Number(value), moneda as Moneda)}
                valueStyle={{ 
                  color: saldo >= 0 ? '#3f8600' : '#cf1322',
                  fontSize: '24px',
                  fontWeight: 'bold'
                }}
              />
            </Card>
          </Col>
        ))}

        {/* Ingresos del mes */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #f0f0f0'
            }}
          >
            <Statistic
              title="Ingresos del Mes"
              value={ingresosMes}
              precision={2}
              prefix={<TrendingUpOutlined />}
              formatter={(value) => formatearMoneda(Number(value))}
              valueStyle={{ 
                color: '#3f8600',
                fontSize: '24px',
                fontWeight: 'bold'
              }}
            />
          </Card>
        </Col>

        {/* Gastos del mes */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #f0f0f0'
            }}
          >
            <Statistic
              title="Gastos del Mes"
              value={gastosMes}
              precision={2}
              prefix={<TrendingDownOutlined />}
              formatter={(value) => formatearMoneda(Number(value))}
              valueStyle={{ 
                color: '#cf1322',
                fontSize: '24px',
                fontWeight: 'bold'
              }}
            />
          </Card>
        </Col>

        {/* Artículos en inventario */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #f0f0f0'
            }}
          >
            <Statistic
              title="Artículos Activos"
              value={articulos.filter(a => a.activo).length}
              prefix={<ShoppingCartOutlined />}
              suffix={
                articulosStockBajo.length > 0 ? (
                  <Badge count={articulosStockBajo.length} style={{ marginLeft: '8px' }} />
                ) : null
              }
              valueStyle={{ 
                color: '#1890ff',
                fontSize: '24px',
                fontWeight: 'bold'
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Sección de balance del mes */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} lg={12}>
          <Card
            title="Balance del Mes"
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            headStyle={{ fontSize: '18px', fontWeight: 'bold' }}
          >
            <div style={{ textAlign: 'center' }}>
              <Statistic
                title="Resultado Neto"
                value={ingresosMes - gastosMes}
                precision={2}
                formatter={(value) => formatearMoneda(Number(value))}
                valueStyle={{ 
                  color: (ingresosMes - gastosMes) >= 0 ? '#3f8600' : '#cf1322',
                  fontSize: '28px',
                  fontWeight: 'bold'
                }}
              />
              <div style={{ marginTop: '16px' }}>
                <Text type="secondary">
                  {(ingresosMes - gastosMes) >= 0 ? 'Mes positivo ✅' : 'Mes negativo ⚠️'}
                </Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Últimas Transacciones"
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            headStyle={{ fontSize: '18px', fontWeight: 'bold' }}
          >
            {ultimasTransacciones.length > 0 ? (
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {ultimasTransacciones.map(transaccion => (
                  <div 
                    key={transaccion.id}
                    style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid #f0f0f0'
                    }}
                  >
                    <div>
                      <Text strong style={{ display: 'block' }}>
                        {transaccion.descripcion}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        {format(new Date(transaccion.fecha), 'dd/MM/yyyy', { locale: es })}
                      </Text>
                    </div>
                    <Text 
                      style={{ 
                        color: transaccion.tipo === TipoTransaccion.INGRESO ? '#3f8600' : '#cf1322',
                        fontWeight: 'bold',
                        fontSize: '16px'
                      }}
                    >
                      {transaccion.tipo === TipoTransaccion.INGRESO ? '+' : '-'}
                      {formatearMoneda(transaccion.monto)}
                    </Text>
                  </div>
                ))}
              </div>
            ) : (
              <Empty 
                description="No hay transacciones"
                style={{ margin: '20px 0' }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Cuentas por moneda */}
      <Row gutter={[24, 24]}>
        {Object.entries(
          cuentas
            .filter(cuenta => cuenta.activa)
            .reduce((acc, cuenta) => {
              if (!acc[cuenta.moneda]) acc[cuenta.moneda] = [];
              acc[cuenta.moneda].push(cuenta);
              return acc;
            }, {} as Record<Moneda, typeof cuentas>)
        ).map(([moneda, cuentasMoneda]) => (
          <Col xs={24} lg={12} key={moneda}>
            <Card
              title={`Cuentas en ${moneda}`}
              style={{ 
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
              headStyle={{ fontSize: '18px', fontWeight: 'bold' }}
            >
              {cuentasMoneda.map(cuenta => (
                <div 
                  key={cuenta.id}
                  style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div 
                      style={{ 
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: cuenta.color,
                        marginRight: '12px'
                      }}
                    />
                    <div>
                      <Text strong>{cuenta.nombre}</Text>
                      <Text type="secondary" style={{ display: 'block', fontSize: '14px' }}>
                        {cuenta.tipo.replace('_', ' ')}
                      </Text>
                    </div>
                  </div>
                  <Text 
                    style={{ 
                      color: cuenta.saldo >= 0 ? '#3f8600' : '#cf1322',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}
                  >
                    {formatearMoneda(cuenta.saldo, cuenta.moneda)}
                  </Text>
                </div>
              ))}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ResumenDashboard;