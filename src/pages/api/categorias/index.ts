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
  esquemaCrearCategoria
} from '@/lib/validaciones';

const prisma = new PrismaClient();

async function handler(req: RequestConUsuario, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await obtenerCategorias(req, res);
      case 'POST':
        return await crearCategoria(req, res);
      default:
        return res.status(405).json(respuestaError('Método no permitido'));
    }
  } catch (error) {
    console.error('Error en API de categorías:', error);
    return res.status(500).json(respuestaError('Error interno del servidor'));
  } finally {
    await prisma.$disconnect();
  }
}

// GET /api/categorias - Obtener categorías del usuario
async function obtenerCategorias(req: RequestConUsuario, res: NextApiResponse) {
  try {
    const filtros: any = {
      usuarioId: req.usuarioId,
    };

    // Filtro por tipo
    if (req.query.tipo) {
      filtros.tipo = req.query.tipo;
    }

    // Filtro por estado activo
    if (req.query.activa !== undefined) {
      filtros.activa = req.query.activa === 'true';
    }

    const categorias = await prisma.categoria.findMany({
      where: filtros,
      orderBy: [
        { activa: 'desc' }, // Activas primero
        { tipo: 'asc' },    // Ordenar por tipo
        { nombre: 'asc' },  // Luego por nombre
      ],
      include: {
        _count: {
          select: {
            // Nota: Estas relaciones no están definidas en el schema actual
            // Si las necesitas, deberás agregar las relaciones inversas
          },
        },
      },
    });

    // Agrupar por tipo para facilitar el uso en el frontend
    const categoriasAgrupadas = {
      PRODUCTO: categorias.filter(c => c.tipo === 'PRODUCTO'),
      SERVICIO: categorias.filter(c => c.tipo === 'SERVICIO'),
    };

    // Calcular estadísticas
    const estadisticas = {
      totalCategorias: categorias.length,
      categoriasProducto: categoriasAgrupadas.PRODUCTO.length,
      categoriasServicio: categoriasAgrupadas.SERVICIO.length,
      categoriasActivas: categorias.filter(c => c.activa).length,
    };

    return res.status(200).json({
      exito: true,
      datos: categorias,
      categoriasAgrupadas,
      estadisticas,
    });

  } catch (error) {
    const errorInfo = manejarErrorPrisma(error);
    return res.status(errorInfo.estado).json(respuestaError(errorInfo.mensaje));
  }
}

// POST /api/categorias - Crear nueva categoría
async function crearCategoria(req: RequestConUsuario, res: NextApiResponse) {
  try {
    // Validar datos de entrada
    const validacion = validarDatos(esquemaCrearCategoria, req.body);
    if (!validacion.exito) {
      return res.status(400).json(respuestaError(
        'Datos de categoría inválidos',
        validacion.errores
      ));
    }

    const datosCategoria = validacion.datos!;

    // Verificar unicidad del nombre para el tipo específico
    const categoriaExistente = await prisma.categoria.findFirst({
      where: {
        usuarioId: req.usuarioId,
        nombre: datosCategoria.nombre,
        tipo: datosCategoria.tipo,
      },
    });

    if (categoriaExistente) {
      return res.status(409).json(respuestaError(
        `Ya existe una categoría "${datosCategoria.nombre}" para ${datosCategoria.tipo.toLowerCase()}s`
      ));
    }

    // Crear la categoría
    const nuevaCategoria = await prisma.categoria.create({
      data: {
        ...datosCategoria,
        usuarioId: req.usuarioId,
      },
    });

    return res.status(201).json(respuestaExito(
      nuevaCategoria,
      'Categoría creada exitosamente'
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