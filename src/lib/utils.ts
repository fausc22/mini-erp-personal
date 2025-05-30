import { Moneda, TipoCuenta, TipoTransaccion, TipoArticulo } from '@/types';
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una cantidad de dinero según la moneda especificada
 */
export function formatearMoneda(monto: number, moneda: Moneda = Moneda.ARS): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto);
}

/**
 * Formatea un número como moneda sin símbolo
 */
export function formatearNumero(numero: number): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero);
}

/**
 * Formatea una fecha de manera amigable
 */
export function formatearFecha(fecha: Date | string): string {
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  if (isToday(fechaObj)) {
    return 'Hoy';
  }
  
  if (isYesterday(fechaObj)) {
    return 'Ayer';
  }
  
  if (isThisWeek(fechaObj)) {
    return format(fechaObj, 'EEEE', { locale: es });
  }
  
  if (isThisMonth(fechaObj)) {
    return format(fechaObj, 'dd \'de\' MMMM', { locale: es });
  }
  
  return format(fechaObj, 'dd/MM/yyyy', { locale: es });
}

/**
 * Formatea una fecha con tiempo relativo
 */
export function formatearFechaRelativa(fecha: Date | string): string {
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return formatDistanceToNow(fechaObj, { 
    addSuffix: true, 
    locale: es 
  });
}

/**
 * Obtiene el nombre legible de un tipo de cuenta
 */
export function obtenerNombreTipoCuenta(tipo: TipoCuenta): string {
  const nombres = {
    [TipoCuenta.EFECTIVO]: 'Efectivo',
    [TipoCuenta.BANCO]: 'Cuenta Bancaria',
    [TipoCuenta.TARJETA_CREDITO]: 'Tarjeta de Crédito',
    [TipoCuenta.INVERSION]: 'Inversión',
    [TipoCuenta.OTRO]: 'Otro',
  };
  return nombres[tipo] || tipo;
}

/**
 * Obtiene el nombre legible de un tipo de transacción
 */
export function obtenerNombreTipoTransaccion(tipo: TipoTransaccion): string {
  const nombres = {
    [TipoTransaccion.INGRESO]: 'Ingreso',
    [TipoTransaccion.GASTO]: 'Gasto',
    [TipoTransaccion.TRANSFERENCIA]: 'Transferencia',
  };
  return nombres[tipo] || tipo;
}

/**
 * Obtiene el nombre legible de un tipo de artículo
 */
export function obtenerNombreTipoArticulo(tipo: TipoArticulo): string {
  const nombres = {
    [TipoArticulo.PRODUCTO]: 'Producto',
    [TipoArticulo.SERVICIO]: 'Servicio',
  };
  return nombres[tipo] || tipo;
}

/**
 * Obtiene el color apropiado para un tipo de transacción
 */
export function obtenerColorTipoTransaccion(tipo: TipoTransaccion): string {
  const colores = {
    [TipoTransaccion.INGRESO]: '#52c41a',
    [TipoTransaccion.GASTO]: '#ff4d4f',
    [TipoTransaccion.TRANSFERENCIA]: '#1890ff',
  };
  return colores[tipo] || '#d9d9d9';
}

/**
 * Calcula el margen de ganancia entre precio y costo
 */
export function calcularMargen(precio: number, costo: number): number {
  if (precio <= 0 || costo <= 0) return 0;
  return ((precio - costo) / precio) * 100;
}

/**
 * Calcula el porcentaje de cambio entre dos valores
 */
export function calcularPorcentajeCambio(valorAnterior: number, valorActual: number): number {
  if (valorAnterior === 0) return valorActual > 0 ? 100 : 0;
  return ((valorActual - valorAnterior) / valorAnterior) * 100;
}

/**
 * Trunca un texto a una longitud específica
 */
export function truncarTexto(texto: string, longitud: number = 50): string {
  if (texto.length <= longitud) return texto;
  return texto.substring(0, longitud).trim() + '...';
}

/**
 * Capitaliza la primera letra de una cadena
 */
export function capitalizarPrimeraLetra(texto: string): string {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

/**
 * Valida si un email es válido
 */
export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Genera un color aleatorio en formato hexadecimal
 */
export function generarColorAleatorio(): string {
  const colores = [
    '#1890ff', '#52c41a', '#faad14', '#f5222d', 
    '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16',
    '#096dd9', '#389e0d', '#d48806', '#cf1322',
    '#531dab', '#08979c', '#c41d7f', '#d46b08'
  ];
  return colores[Math.floor(Math.random() * colores.length)];
}

/**
 * Convierte un objeto a query string para URLs
 */
export function objetoAQueryString(obj: Record<string, any>): string {
  const params = new URLSearchParams();
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== null && value !== undefined && value !== '') {
      if (value instanceof Date) {
        params.append(key, value.toISOString());
      } else {
        params.append(key, String(value));
      }
    }
  });
  
  return params.toString();
}

/**
 * Convierte query string a objeto
 */
export function queryStringAObjeto(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};
  
  for (const [key, value] of params) {
    result[key] = value;
  }
  
  return result;
}

/**
 * Debounce para limitar la frecuencia de ejecución de funciones
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Formatea un número de teléfono argentino
 */
export function formatearTelefono(telefono: string): string {
  // Remover todos los caracteres no numéricos
  const numeroLimpio = telefono.replace(/\D/g, '');
  
  // Formato para números argentinos
  if (numeroLimpio.length === 10) {
    return numeroLimpio.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  
  if (numeroLimpio.length === 11 && numeroLimpio.startsWith('54')) {
    return numeroLimpio.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '+$1 $2-$3-$4');
  }
  
  return telefono;
}

/**
 * Obtiene las iniciales de un nombre
 */
export function obtenerIniciales(nombre: string): string {
  return nombre
    .split(' ')
    .map(palabra => palabra.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Verifica si el dispositivo es móvil
 */
export function esMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
}

/**
 * Copia texto al portapapeles
 */
export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  if (!navigator.clipboard) {
    // Fallback para navegadores más antiguos
    const textArea = document.createElement('textarea');
    textArea.value = texto;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
  
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Descarga un archivo blob
 */
export function descargarArchivo(blob: Blob, nombreArchivo: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Convierte un archivo a base64
 */
export function archivoABase64(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(archivo);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Formatea el tamaño de un archivo
 */
export function formatearTamanoArchivo(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const tamaños = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamaños[i];
}

/**
 * Genera un ID único simple
 */
export function generarIdUnico(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Función para logging mejorado en desarrollo
 */
export function log(mensaje: string, data?: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[ERP] ${new Date().toISOString()}: ${mensaje}`, data || '');
  }
}

/**
 * Función para logging de errores
 */
export function logError(mensaje: string, error?: any): void {
  console.error(`[ERP ERROR] ${new Date().toISOString()}: ${mensaje}`, error || '');
}

/**
 * Constantes útiles
 */
export const CONSTANTES = {
  COLORES: {
    PRIMARIO: '#1890ff',
    EXITO: '#52c41a',
    ADVERTENCIA: '#faad14',
    ERROR: '#ff4d4f',
    INFO: '#13c2c2',
  },
  MONEDAS: {
    ARS: 'ARS',
    USD: 'USD',
  },
  FORMATOS_FECHA: {
    CORTO: 'dd/MM/yyyy',
    LARGO: 'dd \'de\' MMMM \'de\' yyyy',
    CON_HORA: 'dd/MM/yyyy HH:mm',
  },
  LIMITES: {
    NOMBRE_MAXIMO: 100,
    DESCRIPCION_MAXIMA: 500,
    NOTAS_MAXIMAS: 1000,
    PRECIO_MAXIMO: 999999999.99,
  },
} as const;