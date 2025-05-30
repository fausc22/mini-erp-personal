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
  esquemaCrearCuenta, 
  esquemaPaginacion 
} from '@/src/lib/validaciones';

const prisma = new PrismaClient();

async function handler(req: RequestConUsuario, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await obtenerCuentas(req, res);
      case 'POST':
        return await crearCuenta(req, res);
      default:
        return res.status(405).json(respuestaError('Método no permitido'));
    }
  } catch (error) {
    console.error('Error en API de cuentas:', error);
    return res.status(500).json(respuestaError('Error interno del servidor'));
  } finally {
    await prisma.$disconnect();
  }
}

// GET /api/cuentas - Obtener todas las cuentas del usuario
async function obtenerCuentas(req: RequestConUsuario, res: NextApiResponse) {
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

    const { pagina, limite } = validacionPaginacion.datos!;

    // Filtros opcionales
    const filtros: any = {
      usuarioId: req.usuarioId,
    };

    // Filtro por tipo de cuenta
    if (req.query.tipo) {
      filtros.tipo = req.query.tipo;
    }

    // Filtro por moneda
    if (req.query.moneda) {
      filtros.moneda = req.query.moneda;
    }

    // Filtro por estado activo
    if (req.query.activa !== undefined) {
      filtros.activa = req.query.activa === 'true';
    }

    // Contar total de registros
    const total = await prisma.cuenta.count({
      where: filtros,
    });

    // Calcular paginación
    const paginacion = calcularPaginacion(pagina, limite, total);

    // Obtener cuentas
    const cuentas = await prisma.cuenta.findMany({
      where: filtros,
      orderBy: [
        { activa: 'desc' }, // Cuentas activas primero
        { creadaEn: 'desc' }, // Más recientes primero
      ],
      skip: paginacion.offset,
      take: limite,
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
        _count: {
          select: {
            transacciones: true,
          },
        },
      },
    });

    return res.status(200).json({
      exito: true,
      datos: cuentas,
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

// POST /api/cuentas - Crear nueva cuenta
async function crearCuenta(req: RequestConUsuario, res: NextApiResponse) {
  try {
    // Validar datos de entrada
    const validacion = validarDatos(esquemaCrearCuenta, req.body);
    if (!validacion.exito) {
      return res.status(400).json(respuestaError(
        'Datos de cuenta inválidos',
        validacion.errores
      ));
    }

    const { saldoInicial, ...datosCuenta } = validacion.datos!;

    // Verificar que no existe una cuenta con el mismo nombre para este usuario
    const cuentaExistente = await prisma.cuenta.findFirst({
      where: {
        usuarioId: req.usuarioId,
        nombre: datosCuenta.nombre,
      },
    });

    if (cuentaExistente) {
      return res.status(409).json(respuestaError(
        'Ya existe una cuenta con este nombre'
      ));
    }

    // Crear la cuenta
    const nuevaCuenta = await prisma.cuenta.create({
      data: {
        ...datosCuenta,
        saldo: saldoInicial || 0,
        usuarioId: req.usuarioId,
      },
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

    // Si hay saldo inicial, crear transacción inicial
    if (saldoInicial && saldoInicial > 0) {
      // Buscar o crear categoría "Saldo Inicial"
      let categoriaSaldoInicial = await prisma.categoria.findFirst({
        where: {
          usuarioId: req.usuarioId,
          nombre: 'Saldo Inicial',
          tipo: 'PRODUCTO', // Usamos PRODUCTO como tipo genérico
        },
      });

      if (!categoriaSaldoInicial) {
        categoriaSaldoInicial = await prisma.categoria.create({
          data: {
            usuarioId: req.usuarioId,
            nombre: 'Saldo Inicial',
            tipo: 'PRODUCTO',
            color: '#52c41a',
          },
        });
      }

      // Crear transacción de saldo inicial
      await prisma.transaccion.create({
        data: {
          usuarioId: req.usuarioId,
          cuentaId: nuevaCuenta.id,
          tipo: 'INGRESO',
          monto: saldoInicial,
          descripcion: 'Saldo inicial de la cuenta',
          categoriaId: categoriaSaldoInicial.id,
          fecha: new Date(),
        },
      });
    }

    return res.status(201).json(respuestaExito(
      nuevaCuenta,
      'Cuenta creada exitosamente'
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