import { z } from 'zod';
import { TipoCuenta, TipoTransaccion, TipoArticulo, TipoCategoria, Moneda } from '@/types';

// Validaciones para Usuario
export const esquemaCrearUsuario = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  email: z.string()
    .email('Debe ser un email válido')
    .max(255, 'El email no puede exceder 255 caracteres')
    .toLowerCase(),
  password: z.string() // ✅ Cambiar de 'contraseña' a 'password'
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, 'La contraseña debe contener al menos una letra y un número'),
});

export const esquemaLogin = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(1, 'La contraseña es requerida'), // ✅ Cambiar aquí también
});

export const esquemaActualizarUsuario = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional(),
  email: z.string()
    .email('Debe ser un email válido')
    .max(255, 'El email no puede exceder 255 caracteres')
    .toLowerCase()
    .optional(),
});

// Validaciones para Cuenta
export const esquemaCrearCuenta = z.object({
  nombre: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  tipo: z.nativeEnum(TipoCuenta, {
    errorMap: () => ({ message: 'Tipo de cuenta inválido' })
  }),
  descripcion: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  color: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color debe ser un código hexadecimal válido')
    .optional(),
  moneda: z.nativeEnum(Moneda, {
    errorMap: () => ({ message: 'Moneda inválida' })
  }),
  saldoInicial: z.number()
    .min(0, 'El saldo inicial no puede ser negativo')
    .optional()
    .default(0),
});

export const esquemaActualizarCuenta = esquemaCrearCuenta.partial().extend({
  id: z.string().cuid('ID de cuenta inválido'),
});

// Validaciones para Transacción
export const esquemaCrearTransaccion = z.object({
  cuentaId: z.string().cuid('ID de cuenta inválido'),
  tipo: z.nativeEnum(TipoTransaccion, {
    errorMap: () => ({ message: 'Tipo de transacción inválido' })
  }),
  monto: z.number()
    .positive('El monto debe ser mayor a 0')
    .max(999999999.99, 'El monto es demasiado grande'),
  descripcion: z.string()
    .min(1, 'La descripción es requerida')
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .trim(),
  categoriaId: z.string().cuid('ID de categoría inválido'),
  fecha: z.coerce.date({
    errorMap: () => ({ message: 'Fecha inválida' })
  }),
  notas: z.string()
    .max(1000, 'Las notas no pueden exceder 1000 caracteres')
    .optional(),
});

export const esquemaActualizarTransaccion = esquemaCrearTransaccion.partial().extend({
  id: z.string().cuid('ID de transacción inválido'),
});

// Validaciones para Artículo
export const esquemaCrearArticulo = z.object({
  nombre: z.string()
    .min(1, 'El nombre es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres')
    .trim(),
  descripcion: z.string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional(),
  precio: z.number()
    .positive('El precio debe ser mayor a 0')
    .max(999999999.99, 'El precio es demasiado grande'),
  costo: z.number()
    .min(0, 'El costo no puede ser negativo')
    .max(999999999.99, 'El costo es demasiado grande')
    .optional()
    .default(0),
  stock: z.number()
    .int('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo')
    .optional()
    .default(0),
  stockMinimo: z.number()
    .int('El stock mínimo debe ser un número entero')
    .min(0, 'El stock mínimo no puede ser negativo')
    .optional()
    .default(0),
  categoriaId: z.string().cuid('ID de categoría inválido'),
  unidad: z.string()
    .max(50, 'La unidad no puede exceder 50 caracteres')
    .optional()
    .default('unidad'),
  codigoBarras: z.string()
    .max(100, 'El código de barras no puede exceder 100 caracteres')
    .optional(),
  tipo: z.nativeEnum(TipoArticulo, {
    errorMap: () => ({ message: 'Tipo de artículo inválido' })
  }),
});

export const esquemaActualizarArticulo = esquemaCrearArticulo.partial().extend({
  id: z.string().cuid('ID de artículo inválido'),
});

// Validaciones para Categoría
export const esquemaCrearCategoria = z.object({
  nombre: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  tipo: z.nativeEnum(TipoCategoria, {
    errorMap: () => ({ message: 'Tipo de categoría inválido' })
  }),
  color: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color debe ser un código hexadecimal válido')
    .optional()
    .default('#1890ff'),
  icono: z.string()
    .max(50, 'El icono no puede exceder 50 caracteres')
    .optional(),
});

export const esquemaActualizarCategoria = esquemaCrearCategoria.partial().extend({
  id: z.string().cuid('ID de categoría inválido'),
});

// Validaciones para filtros
export const esquemaFiltrosTransaccion = z.object({
  cuentaId: z.string().cuid().optional(),
  tipo: z.nativeEnum(TipoTransaccion).optional(),
  categoriaId: z.string().cuid().optional(),
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
  montoMinimo: z.number().min(0).optional(),
  montoMaximo: z.number().min(0).optional(),
  moneda: z.nativeEnum(Moneda).optional(),
});

export const esquemaFiltrosArticulo = z.object({
  categoriaId: z.string().cuid().optional(),
  tipo: z.nativeEnum(TipoArticulo).optional(),
  stockBajo: z.boolean().optional(),
  activo: z.boolean().optional(),
  busqueda: z.string().max(200).optional(),
});

// Validaciones para paginación
export const esquemaPaginacion = z.object({
  pagina: z.number().int().min(1).optional().default(1),
  limite: z.number().int().min(1).max(100).optional().default(20),
});

// Validaciones para transferencias entre cuentas
export const esquemaTransferencia = z.object({
  cuentaOrigenId: z.string().cuid('ID de cuenta origen inválido'),
  cuentaDestinoId: z.string().cuid('ID de cuenta destino inválido'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  descripcion: z.string()
    .min(1, 'La descripción es requerida')
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  fecha: z.coerce.date(),
  notas: z.string().max(1000).optional(),
}).refine((data) => data.cuentaOrigenId !== data.cuentaDestinoId, {
  message: 'La cuenta origen y destino deben ser diferentes',
  path: ['cuentaDestinoId'],
});

// Validaciones para reportes
export const esquemaParametrosReporte = z.object({
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date(),
  cuentaIds: z.array(z.string().cuid()).optional(),
  categoriaIds: z.array(z.string().cuid()).optional(),
  tipoTransaccion: z.nativeEnum(TipoTransaccion).optional(),
  moneda: z.nativeEnum(Moneda).optional(),
}).refine((data) => data.fechaInicio <= data.fechaFin, {
  message: 'La fecha de inicio debe ser anterior a la fecha de fin',
  path: ['fechaFin'],
});

// Función helper para validar y transformar datos
export function validarDatos<T>(schema: z.ZodSchema<T>, datos: unknown): {
  exito: boolean;
  datos?: T;
  errores?: Record<string, string>;
} {
  try {
    const datosValidados = schema.parse(datos);
    return { exito: true, datos: datosValidados };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errores: Record<string, string> = {};
      error.errors.forEach((err) => {
        const camino = err.path.join('.');
        errores[camino] = err.message;
      });
      return { exito: false, errores };
    }
    return { exito: false, errores: { general: 'Error de validación desconocido' } };
  }
}

// Constantes de validación
export const LIMITES = {
  NOMBRE_USUARIO: { min: 2, max: 100 },
  EMAIL: { max: 255 },
  CONTRASEÑA: { min: 6, max: 100 },
  NOMBRE_CUENTA: { max: 100 },
  DESCRIPCION: { max: 500 },
  NOMBRE_ARTICULO: { max: 200 },
  DESCRIPCION_ARTICULO: { max: 1000 },
  PRECIO_MAX: 999999999.99,
  UNIDAD: { max: 50 },
  CODIGO_BARRAS: { max: 100 },
  NOMBRE_CATEGORIA: { max: 100 },
  NOTAS: { max: 1000 },
  BUSQUEDA: { max: 200 },
  PAGINACION_MAX: 100,
} as const;