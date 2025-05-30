import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validarDatos, esquemaLogin } from '@/lib/validaciones';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      exito: false, 
      error: 'Método no permitido' 
    });
  }

  try {
    // Validar datos de entrada
    const validacion = validarDatos(esquemaLogin, req.body);
    if (!validacion.exito) {
      return res.status(400).json({
        exito: false,
        error: 'Datos inválidos',
        errores: validacion.errores,
      });
    }

    const { email, contraseña } = validacion.datos!;

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        nombre: true,
        email: true,
        password: true,
      },
    });

    if (!usuario) {
      return res.status(401).json({
        exito: false,
        error: 'Credenciales inválidas',
      });
    }

    // Verificar contraseña
    const contraseñaValida = await bcrypt.compare(contraseña, usuario.password);
    if (!contraseñaValida) {
      return res.status(401).json({
        exito: false,
        error: 'Credenciales inválidas',
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        usuarioId: usuario.id,
        email: usuario.email 
      },
      process.env.JWT_SECRET || 'tu-clave-secreta-aqui',
      { expiresIn: '7d' }
    );

    // Remover contraseña de la respuesta
    const { password: _, ...usuarioSinContraseña } = usuario;

    res.status(200).json({
      exito: true,
      mensaje: 'Inicio de sesión exitoso',
      usuario: usuarioSinContraseña,
      token,
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      exito: false,
      error: 'Error interno del servidor',
    });
  } finally {
    await prisma.$disconnect();
  }
}