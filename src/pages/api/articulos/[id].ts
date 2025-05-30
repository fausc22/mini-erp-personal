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
  esquemaActualizarArticulo 
} from '@/lib/validaciones';

const prisma = new PrismaClient();

async function handler(req: RequestConUsuario, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json(respuestaError('ID de artículo inválido'));
  }

  try {
    switch (req.method) {
      case 'GET':
        return await obtenerArticulo(req, res, id);
      case 'PUT':
        return await actualizarArticulo(req, res, id);
      case 'DELETE':
        return await eliminarArticulo(req, res, id);
      default:
        return res.status(405).json(respuestaError('Método no permitido'));
    }
  } catch (error) {
    console.error('Error en API de artículo:', error);
    return res.status(500).json(respuestaError('Error interno del servidor'));
  } finally {
    await prisma.$disconnect();
  }
}

// GET /api/articulos/[id] - Obtener un artículo específico
async function obtenerArticulo(req: RequestConUsuario, res: NextApiResponse, id: string) {
  try {
    const articulo = await prisma.articulo.findFirst({
      where: {
        id,
        usuarioId: req.usuarioId,
      },
      include: {
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

    if (!articulo) {
      return res.status(404).json(respuestaError('Artículo no encontrado'));
    }

    return res.status(200).json(respuestaExito(articulo));
  } catch (error) {
    const errorInfo = manejarErrorPrisma(error);
    return res.status(errorInfo.estado).json(respuestaError(errorInfo.mensaje));
  }
}

// PUT /api/articulos/[id] - Actualizar artículo
async function actualizarArticulo(req: RequestConUsuario, res: NextApiResponse, id: string) {
  try {
    // Verificar que el artículo existe y pertenece al usuario
    const articuloExistente = await prisma.articulo.findFirst({
      where: {
        id,
        usuarioId: req.usuarioId,
      },
    });

    if (!articuloExistente) {
      return res.status(404).json(respuestaError('Artículo no encontrado'));
    }

    // Validar datos de entrada
    const validacion = validarDatos(esquemaActualizarArticulo, { ...req.body, id });
    if (!validacion.exito) {
      return res.status(400).json(respuestaError(
        'Datos de artículo inválidos',
        validacion.errores
      ));
    }

    const { id: _, ...datosActualizacion } = validacion.datos!;

    // Verificar que la categoría existe si se está cambiando
    if (datosActualizacion.categoriaId && datosActualizacion.categoriaId !== articuloExistente.categoriaId) {
      const categoria = await prisma.categoria.findFirst({
        where: {
          id: datosActualizacion.categoriaId,
          usuarioId: req.usuarioId,
          activa: true,
          tipo: datosActualizacion.tipo || articuloExistente.tipo,
        },
      });

      if (!categoria) {
        return res.status(400).json(respuestaError(
          'Categoría no encontrada o no es del tipo correcto'
        ));
      }
    }

    // Verificar unicidad del nombre si se está cambiando
    if (datosActualizacion.nombre && datosActualizacion.nombre !== articuloExistente.nombre) {
      const articuloConNombre = await prisma.articulo.findFirst({
        where: {
          usuarioId: req.usuarioId,
          nombre: datosActualizacion.nombre,
          activo: true,
          id: { not: id },
        },
      });

      if (articuloConNombre) {
        return res.status(409).json(respuestaError(
          'Ya existe un artículo activo con este nombre'
        ));
      }
    }

    // Verificar unicidad del código de barras si se está cambiando
    if (datosActualizacion.codigoBarras && datosActualizacion.codigoBarras !== articuloExistente.codigoBarras) {
      const articuloConCodigo = await prisma.articulo.findFirst({
        where: {
          usuarioId: req.usuarioId,
          codigoBarras: datosActualizacion.codigoBarras,
          activo: true,
          id: { not: id },
        },
      });

      if (articuloConCodigo) {
        return res.status(409).json(respuestaError(
          'Ya existe un artículo activo con este código de barras'
        ));
      }
    }

    // Validaciones específicas por tipo
    if (datosActualizacion.tipo === 'SERVICIO') {
      datosActualizacion.stock = 0;
      datosActualizacion.stockMinimo = 0;
    }

    // Actualizar el artículo
    const articuloActualizado = await prisma.articulo.update({
      where: { id },
      data: datosActualizacion,
      include: {
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

    return res.status(200).json(respuestaExito(
      articuloActualizado,
      'Artículo actualizado exitosamente'
    ));

  } catch (error) {
    const errorInfo = manejarErrorPrisma(error);
    return res.status(errorInfo.estado).json(respuestaError(errorInfo.mensaje));
  }
}

// DELETE /api/articulos/[id] - Eliminar artículo (soft delete)
async function eliminarArticulo(req: RequestConUsuario, res: NextApiResponse, id: string) {
  try {
    // Verificar que el artículo existe y pertenece al usuario
    const articulo = await prisma.articulo.findFirst({
      where: {
        id,
        usuarioId: req.usuarioId,
      },
    });

    if (!articulo) {
      return res.status(404).json(respuestaError('Artículo no encontrado'));
    }

    // En lugar de eliminar físicamente, marcamos como inactivo (soft delete)
    const articuloEliminado = await prisma.articulo.update({
      where: { id },
      data: {
        activo: false,
        actualizadoEn: new Date(),
      },
    });

    return res.status(200).json(respuestaExito(
      articuloEliminado,
      'Artículo eliminado exitosamente'
    ));

  } catch (error) {
    const errorInfo = manejarErrorPrisma(error);
    return res.status(errorInfo.estado).json(respuestaError(errorInfo.mensaje));
  }
}

export default validarMetodos(['GET', 'PUT', 'DELETE'])(
  verificarAutenticacion(handler)
);