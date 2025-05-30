// Enums adaptados a tu schema
export enum TipoCuenta {
  EFECTIVO = 'EFECTIVO',
  BANCO = 'BANCO',
  TARJETA_CREDITO = 'TARJETA_CREDITO',
  INVERSION = 'INVERSION',
  OTRO = 'OTRO'
}

export enum TipoTransaccion {
  INGRESO = 'INGRESO',
  GASTO = 'GASTO',
  TRANSFERENCIA = 'TRANSFERENCIA'
}

export enum TipoArticulo {
  PRODUCTO = 'PRODUCTO',
  SERVICIO = 'SERVICIO'
}

export enum TipoCategoria {
  PRODUCTO = 'PRODUCTO',
  SERVICIO = 'SERVICIO'
}

export enum Moneda {
  ARS = 'ARS',
  USD = 'USD'
}

// Interfaces base
export interface EntidadBase {
  id: string;
  creadoEn: Date;
  actualizadoEn: Date;
}

// Interface de Usuario
export interface Usuario extends EntidadBase {
  nombre: string;
  email: string;
  password: string; // ✅ Cambiar de 'contraseña' a 'password'
}

export interface CrearUsuarioInput {
  nombre: string;
  email: string;
  password: string; // ✅ Cambiar aquí también
}

export interface ActualizarUsuarioInput extends Partial<CrearUsuarioInput> {
  id: string;
}

// Interface de Cuenta
export interface Cuenta extends EntidadBase {
  usuarioId: string;
  nombre: string;
  tipo: TipoCuenta;
  saldo: number;
  descripcion?: string;
  color?: string;
  moneda: Moneda;
  activa: boolean;
  usuario?: Usuario;
}

export interface CrearCuentaInput {
  nombre: string;
  tipo: TipoCuenta;
  descripcion?: string;
  color?: string;
  moneda: Moneda;
  saldoInicial?: number;
}

export interface ActualizarCuentaInput extends Partial<CrearCuentaInput> {
  id: string;
}

// Interface de Transacción
export interface Transaccion extends EntidadBase {
  usuarioId: string;
  cuentaId: string;
  tipo: TipoTransaccion;
  monto: number;
  descripcion: string;
  categoriaId: string;
  fecha: Date;
  notas?: string;
  usuario?: Usuario;
  cuenta?: Cuenta;
  categoria?: Categoria;
}

export interface CrearTransaccionInput {
  cuentaId: string;
  tipo: TipoTransaccion;
  monto: number;
  descripcion: string;
  categoriaId: string;
  fecha: Date;
  notas?: string;
}

export interface ActualizarTransaccionInput extends Partial<CrearTransaccionInput> {
  id: string;
}

// Interface de Artículo (Productos y Servicios)
export interface Articulo extends EntidadBase {
  usuarioId: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  costo?: number;
  stock: number;
  stockMinimo?: number;
  categoriaId: string;
  unidad?: string;
  codigoBarras?: string;
  activo: boolean;
  tipo: TipoArticulo;
  usuario?: Usuario;
  categoria?: Categoria;
}

export interface CrearArticuloInput {
  nombre: string;
  descripcion?: string;
  precio: number;
  costo?: number;
  stock?: number;
  stockMinimo?: number;
  categoriaId: string;
  unidad?: string;
  codigoBarras?: string;
  tipo: TipoArticulo;
}

export interface ActualizarArticuloInput extends Partial<CrearArticuloInput> {
  id: string;
}

// Interface de Categoría
export interface Categoria extends EntidadBase {
  usuarioId: string;
  nombre: string;
  tipo: TipoCategoria;
  color: string;
  icono?: string;
  activa: boolean;
  usuario?: Usuario;
}

export interface CrearCategoriaInput {
  nombre: string;
  tipo: TipoCategoria;
  color?: string;
  icono?: string;
}

export interface ActualizarCategoriaInput extends Partial<CrearCategoriaInput> {
  id: string;
}

// Interface de Configuración
export interface Configuracion extends EntidadBase {
  clave: string;
  valor: string;
}

// Dashboard y resúmenes
export interface ResumenDashboard {
  saldoTotalARS: number;
  saldoTotalUSD: number;
  ingresosMes: number;
  gastosMes: number;
  articulosStockBajo: number;
  ultimasTransacciones: Transaccion[];
  cuentasPorMoneda: {
    ARS: Cuenta[];
    USD: Cuenta[];
  };
}

export interface ResumenFinanciero {
  totalIngresos: number;
  totalGastos: number;
  ingresoNeto: number;
  saldosCuentas: Record<string, number>;
  distribucionPorMoneda: {
    ARS: number;
    USD: number;
  };
}

// Datos para gráficos
export interface DatosGrafico {
  fecha: string;
  ingresos: number;
  gastos: number;
  saldo: number;
}

export interface DatosGastoCategoria {
  categoria: string;
  monto: number;
  porcentaje: number;
  color: string;
}

// Interfaces para formularios
export interface EstadoFormulario<T> {
  datos: T;
  errores: Record<string, string>;
  enviando: boolean;
  valido: boolean;
}

// Respuestas de API
export interface RespuestaApi<T> {
  exito: boolean;
  datos?: T;
  error?: string;
  mensaje?: string;
}

export interface RespuestaPaginada<T> {
  datos: T[];
  paginacion: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
}

// Filtros
export interface FiltrosTransaccion {
  cuentaId?: string;
  tipo?: TipoTransaccion;
  categoriaId?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  montoMinimo?: number;
  montoMaximo?: number;
  moneda?: Moneda;
}

export interface FiltrosArticulo {
  categoriaId?: string;
  tipo?: TipoArticulo;
  stockBajo?: boolean;
  activo?: boolean;
  busqueda?: string;
}

// Context de la aplicación
export interface ContextoAppTipo {
  usuarioActual: Usuario | null;
  cuentas: Cuenta[];
  transacciones: Transaccion[];
  articulos: Articulo[];
  categorias: Categoria[];
  cargando: boolean;
  error: string | null;
  iniciarSesion: (email: string, password: string) => Promise<boolean>;
  cerrarSesion: () => void;
  actualizarDatos: () => Promise<void>;
  crearCuenta: (datos: CrearCuentaInput) => Promise<Cuenta | null>;
  crearTransaccion: (datos: CrearTransaccionInput) => Promise<Transaccion | null>;
  crearArticulo: (datos: CrearArticuloInput) => Promise<Articulo | null>;
  crearCategoria: (datos: CrearCategoriaInput) => Promise<Categoria | null>;
}

// Navegación
export interface ItemMenu {
  clave: string;
  etiqueta: string;
  icono: React.ReactNode;
  ruta: string;
  hijos?: ItemMenu[];
}

// Configuración de la aplicación
export interface ConfiguracionApp {
  monedaPrincipal: Moneda;
  formatoFecha: string;
  tema: 'claro' | 'oscuro';
  idioma: string;
  notificaciones: boolean;
  stockMinimoGlobal: number;
}

// Utilidades para conversión de monedas
export interface TipoCambio {
  fecha: Date;
  USD_ARS: number;
  ARS_USD: number;
}

// Estadísticas avanzadas
export interface EstadisticasDetalladas {
  ingresosPorCategoria: { categoria: string; monto: number }[];
  gastosPorCategoria: { categoria: string; monto: number }[];
  evolucionPatrimonio: { fecha: string; patrimonio: number }[];
  rentabilidadArticulos: { articulo: string; margen: number }[];
  distribucionCuentas: { cuenta: string; porcentaje: number }[];
}