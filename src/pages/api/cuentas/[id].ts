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
  esquemaActualizarCuenta 
} from '@/lib/validaciones';

const prisma = new PrismaClient();

async function handler(req: RequestConUsuario, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json(respuestaError('ID de cuenta inválido'));
  }

  try {
    switch (req.method) {
      case 'GET':
        return await obtenerCuenta(req, res, id);
      case 'PUT':
        return await actualizarCuenta(req, res, id);
      case 'DELETE':
        return await eliminarCuenta(req, res, id);
      default:
        return res.status(405).json(respuestaError('Método no permitido'));
    }
  } catch (error) {
    console.error('Error en API de cuenta:', error);
    return res.status(500).json(respuestaError('Error interno del servidor'));
  } finally {
    await prisma.$disconnect();
  }
}

// GET /api/cuentas/[id] - Obtener una cuenta específica
async function obtenerCuenta(req: RequestConUsuario, res: NextApiResponse, id: string) {
  try {
    const cuenta = await prisma.cuenta.findFirst({
      where: {
        id,
        usuarioId: req.usuarioId,
      },
      include: {
        _count: {
          select: {
            transacciones: true,
          },
        },
      },
    });

    if (!cuenta) {
      return res.status(404).json(respuestaError('Cuenta no encontrada'));
    }

    return res.status(200).json(respuestaExito(cuenta));
  } catch (error) {
    const errorInfo = manejarErrorPrisma(error);
    return res.status(errorInfo.estado).json(respuestaError(errorInfo.mensaje));
  }
}

// PUT /api/cuentas/[id] - Actualizar cuenta
async function actualizarCuenta(req: RequestConUsuario, res: NextApiResponse, id: string) {
  try {
    // Verificar que la cuenta existe y pertenece al usuario
    const cuentaExistente = await prisma.cuenta.findFirst({
      where: {
        id,
        usuarioId: req.usuarioId,
      },
    });

    if (!cuentaExistente) {
      return res.status(404).json(respuestaError('Cuenta no encontrada'));
    }

    // Validar datos de entrada
    const validacion = validarDatos(esquemaActualizarCuenta, { ...req.body, id });
    if (!validacion.exito) {
      return res.status(400).json(respuestaError(
        'Datos de cuenta inválidos',
        validacion.errores
      ));
    }

    const { id: _, saldoInicial, ...datosActualizacion } = validacion.datos!;

    // Verificar unicidad del nombre si se está cambiando
    if (datosActualizacion.nombre && datosActualizacion.nombre !== cuentaExistente.nombre) {
      const cuentaConNombre = await prisma.cuenta.findFirst({
        where: {
          usuarioId: req.usuarioId,
          nombre: datosActualizacion.nombre,
          id: { not: id },
        },
      });

      if (cuentaConNombre) {
        return res.status(409).json(respuestaError(
          'Ya existe una cuenta con este nombre'
        ));
      }
    }

    // Actualizar la cuenta
    const cuentaActualizada = await prisma.cuenta.update({
      where: { id },
      data: datosActualizacion,
      select: {
        id: true,
        nombre: true,
        tipo: true,
        saldo: true,
        descripcion: true,
        color: true,
        moneda: true,
        activa: true,
        creadaEn: true,
        actualizadaEn: true,
      },
    });

    return res.status(200).json(respuestaExito(
      cuentaActualizada,
      'Cuenta actualizada exitosamente'
    ));

  } catch (error) {
    const errorInfo = manejarErrorPrisma(error);
    return res.status(errorInfo.estado).json(respuestaError(errorInfo.mensaje));
  }
}

// DELETE /api/cuentas/[id] - Eliminar cuenta
async function eliminarCuenta(req: RequestConUsuario, res: NextApiResponse, id: string) {
  try {
    // Verificar que la cuenta existe y pertenece al usuario
    const cuenta = await prisma.cuenta.findFirst({
      where: {
        id,
        usuarioId: req.usuarioId,
      },
      include: {
        _count: {
          select: {
            transacciones: true,
          },
        },
      },
    });

    if (!cuenta) {
      return res.status(404).json(respuestaError('Cuenta no encontrada'));
    }

    // Verificar si hay transacciones asociadas
    if (cuenta._count.transacciones > 0) {
      return res.status(400).json(respuestaError(
        'No se puede eliminar la cuenta porque tiene transacciones asociadas'
      ));
    }

    // Eliminar la cuenta
    await prisma.cuenta.delete({
      where: { id },
    });

    return res.status(200).json(respuestaExito(
      null,
      'Cuenta eliminada exitosamente'
    ));

  } catch (error) {
    const errorInfo = manejarErrorPrisma(error);
    return res.status(errorInfo.estado).json(respuestaError(errorInfo.mensaje));
  }
}

export default validarMetodos(['GET', 'PUT', 'DELETE'])(
  verificarAutenticacion(handler)
);