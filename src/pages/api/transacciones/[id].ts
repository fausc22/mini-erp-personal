import { NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { 
  verificarAutenticacion, 
  RequestConUsuario, 
  manejarErrorPrisma,
  respuestaExito,
  respuestaError,
  validarMetodos
} from '@/lib/middleware';
import { 
  validarDatos, 
  esquemaActualizarTransaccion 
} from '@/lib/validaciones';

const prisma = new PrismaClient();

async function handler(req: RequestConUsuario, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json(respuestaError('ID de transacción inválido'));
  }

  try {
    switch (req.method) {
      case 'GET':
        return await obtenerTransaccion(req, res, id);
      case 'PUT':
        return await actualizarTransaccion(req, res, id);
      case 'DELETE':
        return await eliminarTransaccion(req, res, id);
      default:
        return res.status(405).json(respuestaError('Método no permitido'));
    }
  } catch (error) {
    console.error('Error en API de transacción:', error);
    return res.status(500).json(respuestaError('Error interno del servidor'));
  } finally {
    await prisma.$disconnect();
  }
}

// GET /api/transacciones/[id] - Obtener una transacción específica
async function obtenerTransaccion(req: RequestConUsuario, res: NextApiResponse, id: string) {
  try {
    const transaccion = await prisma.transaccion.findFirst({
      where: {
        id,
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

    if (!transaccion) {
      return res.status(404).json(respuestaError('Transacción no encontrada'));
    }

    return res.status(200).json(respuestaExito(transaccion));
  } catch (error) {
    const errorInfo = manejarErrorPrisma(error);
    return res.status(errorInfo.estado).json(respuestaError(errorInfo.mensaje));
  }
}

// PUT /api/transacciones/[id] - Actualizar transacción
async function actualizarTransaccion(req: RequestConUsuario, res: NextApiResponse, id: string) {
  try {
    // Verificar que la transacción existe y pertenece al usuario
    const transaccionExistente = await prisma.transaccion.findFirst({
      where: {
        id,
        usuarioId: req.usuarioId,
      },
      include: {
        cuenta: true,
      },
    });

    if (!transaccionExistente) {
      return res.status(404).json(respuestaError('Transacción no encontrada'));
    }

    // Validar datos de entrada
    const validacion = validarDatos(esquemaActualizarTransaccion, { ...req.body, id });
    if (!validacion.exito) {
      return res.status(400).json(respuestaError(
        'Datos de transacción inválidos',
        validacion.errores
      ));
    }

    const { id: _, ...datosActualizacion } = validacion.datos!;

    // Verificar que la cuenta existe si se está cambiando
    if (datosActualizacion.cuentaId && datosActualizacion.cuentaId !== transaccionExistente.cuentaId) {
      const cuenta = await prisma.cuenta.findFirst({
        where: {
          id: datosActualizacion.cuentaId,
          usuarioId: req.usuarioId,
          activa: true,
        },
      });

      if (!cuenta) {
        return res.status(404).json(respuestaError('Cuenta no encontrada'));
      }
    }

    // Verificar que la categoría existe si se está cambiando
    if (datosActualizacion.categoriaId && datosActualizacion.categoriaId !== transaccionExistente.categoriaId) {
      const categoria = await prisma.categoria.findFirst({
        where: {
          id: datosActualizacion.categoriaId,
          usuarioId: req.usuarioId,
          activa: true,
        },
      });

      if (!categoria) {
        return res.status(404).json(respuestaError('Categoría no encontrada'));
      }
    }

    // Usar transacción de base de datos para mantener consistencia
    const resultado = await prisma.$transaction(async (tx) => {
      // Revertir el efecto de la transacción anterior en el saldo
      const montoAnterior = transaccionExistente.tipo === 'INGRESO' 
        ? -transaccionExistente.monto 
        : transaccionExistente.monto;

      await tx.cuenta.update({
        where: { id: transaccionExistente.cuentaId },
        data: {
          saldo: {
            increment: montoAnterior,
          },
        },
      });

      // Actualizar la transacción
      const transaccionActualizada = await tx.transaccion.update({
        where: { id },
        data: datosActualizacion,
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

      // Aplicar el nuevo efecto en el saldo
      const nuevoMonto = (datosActualizacion.tipo || transaccionExistente.tipo) === 'INGRESO' 
        ? (datosActualizacion.monto || transaccionExistente.monto)
        : -(datosActualizacion.monto || transaccionExistente.monto);

      const cuentaId = datosActualizacion.cuentaId || transaccionExistente.cuentaId;

      await tx.cuenta.update({
        where: { id: cuentaId },
        data: {
          saldo: {
            increment: nuevoMonto,
          },
          actualizadaEn: new Date(),
        },
      });

      return transaccionActualizada;
    });

    return res.status(200).json(respuestaExito(
      resultado,
      'Transacción actualizada exitosamente'
    ));

  } catch (error) {
    const errorInfo = manejarErrorPrisma(error);
    return res.status(errorInfo.estado).json(respuestaError(errorInfo.mensaje));
  }
}

// DELETE /api/transacciones/[id] - Eliminar transacción
async function eliminarTransaccion(req: RequestConUsuario, res: NextApiResponse, id: string) {
  try {
    // Verificar que la transacción existe y pertenece al usuario
    const transaccion = await prisma.transaccion.findFirst({
      where: {
        id,
        usuarioId: req.usuarioId,
      },
    });

    if (!transaccion) {
      return res.status(404).json(respuestaError('Transacción no encontrada'));
    }

    // Usar transacción de base de datos para mantener consistencia
    await prisma.$transaction(async (tx) => {
      // Revertir el efecto en el saldo de la cuenta
      const cambioSaldo = transaccion.tipo === 'INGRESO' 
        ? -transaccion.monto 
        : transaccion.monto;

      await tx.cuenta.update({
        where: { id: transaccion.cuentaId },
        data: {
          saldo: {
            increment: cambioSaldo,
          },
          actualizadaEn: new Date(),
        },
      });

      // Eliminar la transacción
      await tx.transaccion.delete({
        where: { id },
      });
    });

    return res.status(200).json(respuestaExito(
      null,
      'Transacción eliminada exitosamente'
    ));

  } catch (error) {
    const errorInfo = manejarErrorPrisma(error);
    return res.status(errorInfo.estado).json(respuestaError(errorInfo.mensaje));
  }
}

export default validarMetodos(['GET', 'PUT', 'DELETE'])(
  verificarAutenticacion(handler)
);