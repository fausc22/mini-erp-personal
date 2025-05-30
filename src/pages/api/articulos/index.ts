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
} from '@/lib/middleware';
import { 
  validarDatos, 
  esquemaCrearArticulo, 
  esquemaPaginacion,
  esquemaFiltrosArticulo
} from '@/lib/validaciones';

const prisma = new PrismaClient();

async function handler(req: RequestConUsuario, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await obtenerArticulos(req, res);
      case 'POST':
        return await crearArticulo(req, res);
      default:
        return res.status(405).json(respuestaError('Método no permitido'));
    }
  } catch (error) {
    console.error('Error en API de artículos:', error);
    return res.status(500).json(respuestaError('Error interno del servidor'));
  } finally {
    await prisma.$disconnect();
  }
}

// GET /api/articulos - Obtener artículos del usuario
async function obtenerArticulos(req: RequestConUsuario, res: NextApiResponse) {
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
    const validacionFiltros = validarDatos(esquemaFiltrosArticulo, {
      categoriaId: req.query.categoriaId,
      tipo: req.query.tipo,
      stockBajo: req.query.stockBajo === 'true',
      activo: req.query.activo !== undefined ? req.query.activo === 'true' : undefined,
      busqueda: req.query.busqueda,
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

    if (filtros.categoriaId) {
      whereClause.categoriaId = filtros.categoriaId;
    }

    if (filtros.tipo) {
      whereClause.tipo = filtros.tipo;
    }

    if (filtros.activo !== undefined) {
      whereClause.activo = filtros.activo;
    }

    if (filtros.stockBajo) {
      // Solo aplicar filtro de stock bajo a productos
      whereClause.AND = [
        { tipo: 'PRODUCTO' },
        {
          OR: [
            { 
              AND: [
                { stockMinimo: { gt: 0 } },
                { stock: { lte: prisma.articulo.fields.stockMinimo } }
              ]
            },
            {
              AND: [
                { stockMinimo: 0 },
                { stock: { lte: 0 } }
              ]
            }
          ]
        }
      ];
    }

    if (filtros.busqueda) {
      whereClause.OR = [
        { nombre: { contains: filtros.busqueda, mode: 'insensitive' } },
        { descripcion: { contains: filtros.busqueda, mode: 'insensitive' } },
        { codigoBarras: { contains: filtros.busqueda, mode: 'insensitive' } },
      ];
    }

    // Contar total de registros
    const total = await prisma.articulo.count({
      where: whereClause,
    });

    // Calcular paginación
    const paginacion = calcularPaginacion(pagina, limite, total);

    // Obtener artículos
    const articulos = await prisma.articulo.findMany({
      where: whereClause,
      orderBy: [
        { activo: 'desc' }, // Activos primero
        { tipo: 'asc' },    // Ordenar por tipo
        { nombre: 'asc' },  // Luego por nombre
      ],
      skip: paginacion.offset,
      take: limite,
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
        _count: {
          select: {
            transacciones: true,
          },
        },
      },
    });

    // Calcular estadísticas
    const estadisticas = {
      totalArticulos: articulos.length,
      productosActivos: articulos.filter(a => a.activo && a.tipo === 'PRODUCTO').length,
      serviciosActivos: articulos.filter(a => a.activo && a.tipo === 'SERVICIO').length,
      gastosActivos: articulos.filter(a => a.activo && a.tipo === 'GASTO').length,
      stockBajo: articulos.filter(a => 
        a.activo && 
        a.tipo === 'PRODUCTO' && 
        a.stock <= (a.stockMinimo || 0)
      ).length,
      gastosRecurrentes: articulos.filter(a => 
        a.activo && 
        a.tipo === 'GASTO' && 
        a.esRecurrente
      ).length,
      valorTotalInventario: articulos
        .filter(a => a.activo && a.tipo === 'PRODUCTO')
        .reduce((sum, a) => sum + (a.precio * a.stock), 0),
      costoTotalInventario: articulos
        .filter(a => a.activo && a.tipo === 'PRODUCTO')
        .reduce((sum, a) => sum + ((a.costo || 0) * a.stock), 0),
    };

    return res.status(200).json({
      exito: true,
      datos: articulos,
      estadisticas,
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

// POST /api/articulos - Crear nuevo artículo
async function crearArticulo(req: RequestConUsuario, res: NextApiResponse) {
  try {
    // Validar datos de entrada
    const validacion = validarDatos(esquemaCrearArticulo, req.body);
    if (!validacion.exito) {
      return res.status(400).json(respuestaError(
        'Datos de artículo inválidos',
        validacion.errores
      ));
    }

    const datosArticulo = validacion.datos!;

    // Verificar que la categoría pertenece al usuario y es del tipo correcto
    const categoria = await prisma.categoria.findFirst({
      where: {
        id: datosArticulo.categoriaId,
        usuarioId: req.usuarioId,
        activa: true,
        tipo: datosArticulo.tipo, // La categoría debe coincidir con el tipo de artículo
      },
    });

    if (!categoria) {
      return res.status(400).json(respuestaError(
        `Categoría no encontrada o no es del tipo ${datosArticulo.tipo}`
      ));
    }

    // Verificar unicidad del nombre para el usuario
    const articuloExistente = await prisma.articulo.findFirst({
      where: {
        usuarioId: req.usuarioId,
        nombre: datosArticulo.nombre,
        activo: true,
      },
    });

    if (articuloExistente) {
      return res.status(409).json(respuestaError(
        'Ya existe un artículo activo con este nombre'
      ));
    }

    // Verificar unicidad del código de barras si se proporciona
    if (datosArticulo.codigoBarras) {
      const articuloConCodigo = await prisma.articulo.findFirst({
        where: {
          usuarioId: req.usuarioId,
          codigoBarras: datosArticulo.codigoBarras,
          activo: true,
        },
      });

      if (articuloConCodigo) {
        return res.status(409).json(respuestaError(
          'Ya existe un artículo activo con este código de barras'
        ));
      }
    }

    // Validaciones específicas por tipo
    if (datosArticulo.tipo === 'SERVICIO') {
      // Para servicios, el stock debería ser 0 o no aplicar
      datosArticulo.stock = 0;
      datosArticulo.stockMinimo = 0;
      datosArticulo.codigoBarras = undefined;
      datosArticulo.esRecurrente = false;
      datosArticulo.frecuencia = undefined;
    } else if (datosArticulo.tipo === 'GASTO') {
      // Para gastos, el stock debería ser 0
      datosArticulo.stock = 0;
      datosArticulo.stockMinimo = 0;
      datosArticulo.codigoBarras = undefined;
    } else if (datosArticulo.tipo === 'PRODUCTO') {
      // Para productos, no puede ser recurrente
      datosArticulo.esRecurrente = false;
      datosArticulo.frecuencia = undefined;
    }

    // Crear el artículo
    const nuevoArticulo = await prisma.articulo.create({
      data: {
        ...datosArticulo,
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

    return res.status(201).json(respuestaExito(
      nuevoArticulo,
      `${datosArticulo.tipo === 'PRODUCTO' ? 'Producto' : 
         datosArticulo.tipo === 'SERVICIO' ? 'Servicio' : 
         'Gasto'} creado exitosamente`
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