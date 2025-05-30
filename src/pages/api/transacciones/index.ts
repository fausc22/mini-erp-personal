import { NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { 
  verificarAutenticacion, 
  RequestConUsuario, 
  manejarErrorPrisma,
  respuestaExito,
  respuestaError,
  validarMetodos,
  calcularPaginacion
} from '@/src/lib/middleware';
import { 
  validarDatos, 
  esquemaCrearTransaccion, 
  esquemaPaginacion,
  esquemaFiltrosTransaccion
} from '@/src/lib/validaciones';

const prisma = new PrismaClient();

async function handler(req: RequestConUsuario, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await obtenerTransacciones(req, res);
      case 'POST':
        return await crearTransaccion(req, res);
      default:
        return res.status(405).json(respuestaError('Método no permitido'));
    }
  } catch (error) {
    console.error('Error en API de transacciones:', error);
    return res.status(500).json(respuestaError('Error interno del servidor'));
  } finally {
    await prisma.$disconnect();
  }
}

// GET /api/transacciones - Obtener transacciones del usuario
async function obtenerTransacciones(req: RequestConUsuario, res: NextApiResponse) {
  try {
    // Validar parámetros de paginación
    const validacionPaginacion = validarDatos(esquemaPaginacion, {
      pagina: req.query.pagina ? parseInt(req.query.pagina as string) : undefined,
      limite: req.query.limite ? parseInt(req.query.limite as string) : undefined,
    });

    if (!validacionPaginacion.exito) {
      return res.status(400).json(respuestaError(
        'Parámetros de paginación inválidos',
        validacionPaginacion.errores
      ));
    }

    // Validar filtros
    const validacionFiltros = validarDatos(esquemaFiltrosTransaccion, {
      cuentaId: req.query.cuentaId,
      tipo: req.query.tipo,
      categoriaId: req.query.categoriaId,
      fechaDesde: req.query.fechaDesde ? new Date(req.query.fechaDesde as string) : undefined,
      fechaHasta: req.query.fechaHasta ? new Date(req.query.fechaHasta as string) : undefined,
      montoMinimo: req.query.montoMinimo ? parseFloat(req.query.montoMinimo as string) : undefined,
      montoMaximo: req.query.montoMaximo ? parseFloat(req.query.montoMaximo as string) : undefined,
      moneda: req.query.moneda,
    });

    if (!validacionFiltros.exito) {
      return res.status(400).json(respuestaError(
        'Filtros inválidos',
        validacionFiltros.errores
      ));
    }

    const { pagina, limite } = validacionPaginacion.datos!;
    const filtros = validacionFiltros.datos!;

    // Construir filtros de base de datos
    const whereClause: any = {
      usuarioId: req.usuarioId,
    };

    if (filtros.cuentaId) {
      whereClause.cuentaId = filtros.cuentaId;
    }

    if (filtros.tipo) {
      whereClause.tipo = filtros.tipo;
    }

    if (filtros.categoriaId) {
      whereClause.categoriaId = filtros.categoriaId;
    }

    if (filtros.fechaDesde || filtros.fechaHasta) {
      whereClause.fecha = {};
      if (filtros.fechaDesde) {
        whereClause.fecha.gte = filtros.fechaDesde;
      }
      if (filtros.fechaHasta) {
        whereClause.fecha.lte = filtros.fechaHasta;
      }
    }

    if (filtros.montoMinimo || filtros.montoMaximo) {
      whereClause.monto = {};
      if (filtros.montoMinimo) {
        whereClause.monto.gte = filtros.montoMinimo;
      }
      if (filtros.montoMaximo) {
        whereClause.monto.lte = filtros.montoMaximo;
      }
    }

    if (filtros.moneda) {
      whereClause.cuenta = {
        moneda: filtros.moneda,
      };
    }

    // Contar total de registros
    const total = await prisma.transaccion.count({
      where: whereClause,
    });

    // Calcular paginación
    const paginacion = calcularPaginacion(pagina, limite, total);

    // Obtener transacciones
    const transacciones = await prisma.transaccion.findMany({
      where: whereClause,
      orderBy: [
        { fecha: 'desc' },
        { creadaEn: 'desc' },
      ],
      skip: paginacion.offset,
      take: limite,
      include: {
        cuenta: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            moneda: true,
            color: true,
          },
        },
        categoria: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            color: true,
            icono: true,
          },
        },
      },
    });

    // Calcular resumen de la página actual
    const resumen = {
      totalIngresos: transacciones
        .filter(t => t.tipo === 'INGRESO')
        .reduce((sum, t) => sum + t.monto, 0),
      totalGastos: transacciones
        .filter(t => t.tipo === 'GASTO')
        .reduce((sum, t) => sum + t.monto, 0),
      cantidadTransacciones: transacciones.length,
    };

    return res.status(200).json({
      exito: true,
      datos: transacciones,
      resumen,
      paginacion: {
        pagina: paginacion.pagina,
        limite: paginacion.limite,
        total: paginacion.total,
        totalPaginas: paginacion.totalPaginas,
      },
    });

  } catch (error) {
    const errorInfo = manejarErrorPrisma(error);
    return res.status(errorInfo.estado).json(respuestaError(errorInfo.mensaje));
  }
}

// POST /api/transacciones - Crear nueva transacción
async function crearTransaccion(req: RequestConUsuario, res: NextApiResponse) {
  try {
    // Validar datos de entrada
    const validacion = validarDatos(esquemaCrearTransaccion, req.body);
    if (!validacion.exito) {
      return res.status(400).json(respuestaError(
        'Datos de transacción inválidos',
        validacion.errores
      ));
    }

    const datosTransaccion = validacion.datos!;

    // Verificar que la cuenta pertenece al usuario
    const cuenta = await prisma.cuenta.findFirst({
      where: {
        id: datosTransaccion.cuentaId,
        usuarioId: req.usuarioId,
        activa: true,
      },
    });

    if (!cuenta) {
      return res.status(404).json(respuestaError(
        'Cuenta no encontrada o inactiva'
      ));
    }

    // Verificar que la categoría pertenece al usuario
    const categoria = await prisma.categoria.findFirst({
      where: {
        id: datosTransaccion.categoriaId,
        usuarioId: req.usuarioId,
        activa: true,
      },
    });

    if (!categoria) {
      return res.status(404).json(respuestaError(
        'Categoría no encontrada o inactiva'
      ));
    }

    // Verificar saldo suficiente para gastos
    if (datosTransaccion.tipo === 'GASTO' && cuenta.saldo < datosTransaccion.monto) {
      return res.status(400).json(respuestaError(
        'Saldo insuficiente en la cuenta'
      ));
    }

    // Usar transacción de base de datos para mantener consistencia
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear la transacción
      const nuevaTransaccion = await tx.transaccion.create({
        data: {
          ...datosTransaccion,
          usuarioId: req.usuarioId,
        },
        include: {
          cuenta: {
            select: {
              id: true,
              nombre: true,
              tipo: true,
              moneda: true,
              color: true,
            },
          },
          categoria: {
            select: {
              id: true,
              nombre: true,
              tipo: true,
              color: true,
              icono: true,
            },
          },
        },
      });

      // Actualizar saldo de la cuenta
      const cambioSaldo = datosTransaccion.tipo === 'INGRESO' 
        ? datosTransaccion.monto 
        : -datosTransaccion.monto;

      await tx.cuenta.update({
        where: { id: datosTransaccion.cuentaId },
        data: {
          saldo: {
            increment: cambioSaldo,
          },
          actualizadaEn: new Date(),
        },
      });

      return nuevaTransaccion;
    });

    return res.status(201).json(respuestaExito(
      resultado,
      'Transacción creada exitosamente'
    ));

  } catch (error) {
    const errorInfo = manejarErrorPrisma(error);
    return res.status(errorInfo.estado).json(respuestaError(errorInfo.mensaje));
  }
}

// Exportar con middlewares aplicados
export default validarMetodos(['GET', 'POST'])(
  verificarAutenticacion(handler)
);