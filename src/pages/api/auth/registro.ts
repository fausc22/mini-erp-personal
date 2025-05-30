import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { validarDatos, esquemaCrearUsuario } from '@/lib/validaciones';
import { encriptarContraseña, manejarErrorPrisma, respuestaExito, respuestaError } from '@/lib/middleware';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json(respuestaError('Método no permitido'));
  }

  try {
    // Validar datos de entrada
    const validacion = validarDatos(esquemaCrearUsuario, req.body);
    if (!validacion.exito) {
      return res.status(400).json(respuestaError(
        'Datos inválidos',
        validacion.errores
      ));
    }

    const { nombre, email, password } = validacion.datos!;

    // Verificar si el usuario ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      return res.status(409).json(respuestaError(
        'Ya existe un usuario con este email'
      ));
    }

    // Encriptar contraseña
    const contraseñaEncriptada = await encriptarContraseña(password);

    // Crear usuario
    const nuevoUsuario = await prisma.usuario.create({
    data: {
      nombre,
      email,
      password: contraseñaEncriptada, // ✅ Cambiar de 'contraseña' a 'password'
    },
    select: {
      id: true,
      nombre: true,
      email: true,
      creadoEn: true,
    },
  });

    // Crear categorías por defecto
    const categoriasDefecto = [
      // Categorías para productos
      { nombre: 'Alimentación', tipo: 'PRODUCTO', color: '#52c41a', icono: 'apple' },
      { nombre: 'Electrónicos', tipo: 'PRODUCTO', color: '#1890ff', icono: 'mobile' },
      { nombre: 'Ropa', tipo: 'PRODUCTO', color: '#722ed1', icono: 'skin' },
      { nombre: 'Hogar', tipo: 'PRODUCTO', color: '#fa8c16', icono: 'home' },
      
      // Categorías para servicios
      { nombre: 'Consultoría', tipo: 'SERVICIO', color: '#13c2c2', icono: 'user' },
      { nombre: 'Mantenimiento', tipo: 'SERVICIO', color: '#eb2f96', icono: 'tool' },
      { nombre: 'Educación', tipo: 'SERVICIO', color: '#f5222d', icono: 'book' },
      { nombre: 'Transporte', tipo: 'SERVICIO', color: '#faad14', icono: 'car' },
    ];

    await prisma.categoria.createMany({
      data: categoriasDefecto.map(cat => ({
        ...cat,
        usuarioId: nuevoUsuario.id,
        tipo: cat.tipo as any,
      })),
    });

    // Crear cuenta por defecto
    await prisma.cuenta.create({
      data: {
        usuarioId: nuevoUsuario.id,
        nombre: 'Efectivo',
        tipo: 'EFECTIVO',
        descripcion: 'Cuenta de efectivo principal',
        moneda: 'ARS',
        color: '#52c41a',
      },
    });

    // Generar token
    const token = jwt.sign(
      { 
        usuarioId: nuevoUsuario.id,
        email: nuevoUsuario.email 
      },
      process.env.JWT_SECRET || 'tu-clave-secreta-aqui',
      { expiresIn: '7d' }
    );

    return res.status(201).json(respuestaExito({
      usuario: nuevoUsuario,
      token,
    }, 'Usuario creado exitosamente'));

  } catch (error) {
    console.error('Error en registro:', error);
    const errorInfo = manejarErrorPrisma(error);
    return res.status(errorInfo.estado).json(respuestaError(errorInfo.mensaje));
  } finally {
    await prisma.$disconnect();
  }
}