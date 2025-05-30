import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RequestConUsuario extends NextApiRequest {
  usuarioId: string;
  usuario?: {
    id: string;
    nombre: string;
    email: string;
  };
}

// Middleware para verificar autenticación
export function verificarAutenticacion(
  handler: (req: RequestConUsuario, res: NextApiResponse) => Promise<void>
) {
  return async (req: RequestConUsuario, res: NextApiResponse) => {
    try {
      // Obtener token del header Authorization
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          exito: false,
          error: 'Token de autenticación requerido',
        });
      }

      const token = authHeader.substring(7); // Remover "Bearer "

      // Verificar token
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET || 'tu-clave-secreta-aqui'
      ) as { usuarioId: string; email: string };

      // Verificar que el usuario existe
      const usuario = await prisma.usuario.findUnique({
        where: { id: payload.usuarioId },
        select: {
          id: true,
          nombre: true,
          email: true,
        },
      });

      if (!usuario) {
        return res.status(401).json({
          exito: false,
          error: 'Usuario no encontrado',
        });
      }

      // Agregar datos del usuario al request
      req.usuarioId = usuario.id;
      req.usuario = usuario;

      // Continuar con el handler
      return handler(req, res);

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          exito: false,
          error: 'Token inválido',
        });
      }

      console.error('Error en middleware de autenticación:', error);
      return res.status(500).json({
        exito: false,
        error: 'Error interno del servidor',
      });
    }
  };
}

// Función helper para manejar errores de Prisma
export function manejarErrorPrisma(error: any) {
  if (error.code === 'P2002') {
    // Violación de restricción única
    return {
      estado: 409,
      mensaje: 'Ya existe un registro con estos datos',
    };
  }
  
  if (error.code === 'P2025') {
    // Registro no encontrado
    return {
      estado: 404,
      mensaje: 'Registro no encontrado',
    };
  }

  if (error.code === 'P2003') {
    // Violación de clave foránea
    return {
      estado: 400,
      mensaje: 'Referencia inválida a otro registro',
    };
  }

  // Error genérico
  return {
    estado: 500,
    mensaje: 'Error en la base de datos',
  };
}

// Función helper para respuestas de API
export function respuestaExito<T>(datos: T, mensaje?: string) {
  return {
    exito: true,
    datos,
    mensaje,
  };
}

export function respuestaError(error: string, detalles?: any) {
  return {
    exito: false,
    error,
    detalles,
  };
}

// Función para encriptar contraseñas
export async function encriptarContraseña(contraseña: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(contraseña, salt);
}

// Función para verificar contraseñas
export async function verificarContraseña(
  contraseña: string, 
  hash: string
): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(contraseña, hash);
}

// Middleware para logging de requests
export function logearRequest(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const inicio = Date.now();
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    
    try {
      await handler(req, res);
    } finally {
      const duracion = Date.now() - inicio;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${duracion}ms`);
    }
  };
}

// Middleware para validar métodos HTTP
export function validarMetodos(metodosPermitidos: string[]) {
  return (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      if (!metodosPermitidos.includes(req.method!)) {
        return res.status(405).json({
          exito: false,
          error: `Método ${req.method} no permitido. Métodos permitidos: ${metodosPermitidos.join(', ')}`,
        });
      }
      
      return handler(req, res);
    };
  };
}

// Helper para paginación
export function calcularPaginacion(pagina: number, limite: number, total: number) {
  const totalPaginas = Math.ceil(total / limite);
  const offset = (pagina - 1) * limite;
  
  return {
    pagina,
    limite,
    total,
    totalPaginas,
    offset,
    tieneAnterior: pagina > 1,
    tieneSiguiente: pagina < totalPaginas,
  };
}

// Limpiar recursos de Prisma
export async function limpiarPrisma() {
  await prisma.$disconnect();
}