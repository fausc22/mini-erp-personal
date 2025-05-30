import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/src/context/AppContext';
import { 
  Transaccion, 
  TipoTransaccion, 
  FiltrosTransaccion,
  Moneda,
  DatosGrafico 
} from '@/src/types';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

export function useTransacciones() {
  const { transacciones, cuentas, cargando } = useApp();
  const [filtros, setFiltros] = useState<FiltrosTransaccion>({});

  // Transacciones filtradas
  const transaccionesFiltradas = useMemo(() => {
    return transacciones.filter(transaccion => {
      // Filtro por cuenta
      if (filtros.cuentaId && transaccion.cuentaId !== filtros.cuentaId) {
        return false;
      }

      // Filtro por tipo
      if (filtros.tipo && transaccion.tipo !== filtros.tipo) {
        return false;
      }

      // Filtro por categoría
      if (filtros.categoriaId && transaccion.categoriaId !== filtros.categoriaId) {
        return false;
      }

      // Filtro por rango de fechas
      if (filtros.fechaDesde || filtros.fechaHasta) {
        const fechaTransaccion = new Date(transaccion.fecha);
        
        if (filtros.fechaDesde && fechaTransaccion < filtros.fechaDesde) {
          return false;
        }
        
        if (filtros.fechaHasta && fechaTransaccion > filtros.fechaHasta) {
          return false;
        }
      }

      // Filtro por monto
      if (filtros.montoMinimo && transaccion.monto < filtros.montoMinimo) {
        return false;
      }
      
      if (filtros.montoMaximo && transaccion.monto > filtros.montoMaximo) {
        return false;
      }

      // Filtro por moneda (a través de la cuenta)
      if (filtros.moneda) {
        const cuenta = cuentas.find(c => c.id === transaccion.cuentaId);
        if (!cuenta || cuenta.moneda !== filtros.moneda) {
          return false;
        }
      }

      return true;
    });
  }, [transacciones, filtros, cuentas]);

  // Estadísticas generales
  const estadisticas = useMemo(() => {
    const ingresos = transaccionesFiltradas
      .filter(t => t.tipo === TipoTransaccion.INGRESO)
      .reduce((sum, t) => sum + t.monto, 0);

    const gastos = transaccionesFiltradas
      .filter(t => t.tipo === TipoTransaccion.GASTO)
      .reduce((sum, t) => sum + t.monto, 0);

    return {
      totalIngresos: ingresos,
      totalGastos: gastos,
      balance: ingresos - gastos,
      cantidadTransacciones: transaccionesFiltradas.length,
      cantidadIngresos: transaccionesFiltradas.filter(t => t.tipo === TipoTransaccion.INGRESO).length,
      cantidadGastos: transaccionesFiltradas.filter(t => t.tipo === TipoTransaccion.GASTO).length,
    };
  }, [transaccionesFiltradas]);

  // Estadísticas del mes actual
  const estadisticasMesActual = useMemo(() => {
    const inicioMes = startOfMonth(new Date());
    const finMes = endOfMonth(new Date());

    const transaccionesMes = transacciones.filter(transaccion => {
      const fecha = new Date(transaccion.fecha);
      return fecha >= inicioMes && fecha <= finMes;
    });

    const ingresosMes = transaccionesMes
      .filter(t => t.tipo === TipoTransaccion.INGRESO)
      .reduce((sum, t) => sum + t.monto, 0);

    const gastosMes = transaccionesMes
      .filter(t => t.tipo === TipoTransaccion.GASTO)
      .reduce((sum, t) => sum + t.monto, 0);

    return {
      ingresosMes,
      gastosMes,
      balanceMes: ingresosMes - gastosMes,
      transaccionesMes: transaccionesMes.length,
    };
  }, [transacciones]);

  // Datos para gráficos de los últimos 6 meses
  const datosGraficoMeses = useMemo(() => {
    const datos: DatosGrafico[] = [];
    
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
        fecha: format(fecha, 'MMM yyyy', { locale: es }),
        ingresos,
        gastos,
        balance: ingresos - gastos,
      });
    }

    return datos;
  }, [transacciones]);

  // Transacciones por categoría
  const transaccionesPorCategoria = useMemo(() => {
    const agrupadas = transaccionesFiltradas.reduce((acc, transaccion) => {
      const clave = `${transaccion.categoriaId}-${transaccion.tipo}`;
      if (!acc[clave]) {
        acc[clave] = {
          categoriaId: transaccion.categoriaId,
          categoria: transaccion.categoria?.nombre || 'Sin categoría',
          tipo: transaccion.tipo,
          color: transaccion.categoria?.color || '#d9d9d9',
          monto: 0,
          cantidad: 0,
        };
      }
      acc[clave].monto += transaccion.monto;
      acc[clave].cantidad += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(agrupadas);
  }, [transaccionesFiltradas]);

  // Últimas transacciones
  const ultimasTransacciones = useMemo(() => {
    return [...transacciones]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 10);
  }, [transacciones]);

  // Funciones para manejar filtros
  const aplicarFiltro = (nuevosFiltros: Partial<FiltrosTransaccion>) => {
    setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
  };

  const limpiarFiltros = () => {
    setFiltros({});
  };

  const aplicarFiltroMesActual = () => {
    const inicioMes = startOfMonth(new Date());
    const finMes = endOfMonth(new Date());
    setFiltros({
      fechaDesde: inicioMes,
      fechaHasta: finMes,
    });
  };

  const aplicarFiltroUltimosMeses = (meses: number) => {
    const fechaInicio = subMonths(new Date(), meses);
    setFiltros({
      fechaDesde: fechaInicio,
      fechaHasta: new Date(),
    });
  };

  // Función para obtener resumen por moneda
  const resumenPorMoneda = useMemo(() => {
    const resumen: Record<Moneda, { ingresos: number; gastos: number; balance: number }> = {
      [Moneda.ARS]: { ingresos: 0, gastos: 0, balance: 0 },
      [Moneda.USD]: { ingresos: 0, gastos: 0, balance: 0 },
    };

    transaccionesFiltradas.forEach(transaccion => {
      const cuenta = cuentas.find(c => c.id === transaccion.cuentaId);
      if (cuenta) {
        if (transaccion.tipo === TipoTransaccion.INGRESO) {
          resumen[cuenta.moneda].ingresos += transaccion.monto;
        } else if (transaccion.tipo === TipoTransaccion.GASTO) {
          resumen[cuenta.moneda].gastos += transaccion.monto;
        }
      }
    });

    // Calcular balance
    Object.keys(resumen).forEach(moneda => {
      const key = moneda as Moneda;
      resumen[key].balance = resumen[key].ingresos - resumen[key].gastos;
    });

    return resumen;
  }, [transaccionesFiltradas, cuentas]);

  return {
    // Datos
    transacciones: transaccionesFiltradas,
    transaccionesOriginales: transacciones,
    ultimasTransacciones,
    
    // Estadísticas
    estadisticas,
    estadisticasMesActual,
    transaccionesPorCategoria,
    resumenPorMoneda,
    
    // Datos para gráficos
    datosGraficoMeses,
    
    // Estado
    cargando,
    filtros,
    
    // Acciones
    aplicarFiltro,
    limpiarFiltros,
    aplicarFiltroMesActual,
    aplicarFiltroUltimosMeses,
  };
}

export default useTransacciones;