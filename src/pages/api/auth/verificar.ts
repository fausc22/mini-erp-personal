import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { respuestaExito, respuestaError } from '@/lib/middleware';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json(respuestaError('Método no permitido'));
  }

  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(respuestaError('Token requerido'));
    }

    const token = authHeader.substring(7);

    // Verificar token
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'tu-clave-secreta-aqui'
    ) as { usuarioId: string; email: string };

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.usuarioId },
      select: {
        id: true,
        nombre: true,
        email: true,
        creadoEn: true,
      },
    });

    if (!usuario) {
      return res.status(401).json(respuestaError('Usuario no encontrado'));
    }

    return res.status(200).json(respuestaExito({
      usuario,
      valido: true,
    }, 'Token válido'));

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json(respuestaError('Token inválido'));
    }

    console.error('Error verificando token:', error);
    return res.status(500).json(respuestaError('Error interno del servidor'));
  } finally {
    await prisma.$disconnect();
  }
}