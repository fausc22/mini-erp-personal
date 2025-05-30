'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { 
  Usuario,
  Cuenta, 
  Transaccion, 
  Articulo, 
  Categoria, 
  ContextoAppTipo,
  CrearCuentaInput,
  CrearTransaccionInput,
  CrearArticuloInput,
  CrearCategoriaInput
} from '@/types';

// Tipos de acciones
type AccionApp = 
  | { tipo: 'ESTABLECER_CARGANDO'; payload: boolean }
  | { tipo: 'ESTABLECER_ERROR'; payload: string | null }
  | { tipo: 'ESTABLECER_USUARIO'; payload: Usuario | null }
  | { tipo: 'ESTABLECER_CUENTAS'; payload: Cuenta[] }
  | { tipo: 'AGREGAR_CUENTA'; payload: Cuenta }
  | { tipo: 'ACTUALIZAR_CUENTA'; payload: Cuenta }
  | { tipo: 'ELIMINAR_CUENTA'; payload: string }
  | { tipo: 'ESTABLECER_TRANSACCIONES'; payload: Transaccion[] }
  | { tipo: 'AGREGAR_TRANSACCION'; payload: Transaccion }
  | { tipo: 'ACTUALIZAR_TRANSACCION'; payload: Transaccion }
  | { tipo: 'ELIMINAR_TRANSACCION'; payload: string }
  | { tipo: 'ESTABLECER_ARTICULOS'; payload: Articulo[] }
  | { tipo: 'AGREGAR_ARTICULO'; payload: Articulo }
  | { tipo: 'ACTUALIZAR_ARTICULO'; payload: Articulo }
  | { tipo: 'ELIMINAR_ARTICULO'; payload: string }
  | { tipo: 'ESTABLECER_CATEGORIAS'; payload: Categoria[] }
  | { tipo: 'AGREGAR_CATEGORIA'; payload: Categoria }
  | { tipo: 'LIMPIAR_DATOS'; payload: null };

// Estado inicial
interface EstadoApp {
  usuarioActual: Usuario | null;
  cuentas: Cuenta[];
  transacciones: Transaccion[];
  articulos: Articulo[];
  categorias: Categoria[];
  cargando: boolean;
  error: string | null;
}

const estadoInicial: EstadoApp = {
  usuarioActual: null,
  cuentas: [],
  transacciones: [],
  articulos: [],
  categorias: [],
  cargando: false,
  error: null,
};

// Reducer
function reducerApp(estado: EstadoApp, accion: AccionApp): EstadoApp {
  switch (accion.tipo) {
    case 'ESTABLECER_CARGANDO':
      return { ...estado, cargando: accion.payload };
    
    case 'ESTABLECER_ERROR':
      return { ...estado, error: accion.payload, cargando: false };
    
    case 'ESTABLECER_USUARIO':
      return { ...estado, usuarioActual: accion.payload };
    
    case 'ESTABLECER_CUENTAS':
      return { ...estado, cuentas: accion.payload };
    
    case 'AGREGAR_CUENTA':
      return { ...estado, cuentas: [...estado.cuentas, accion.payload] };
    
    case 'ACTUALIZAR_CUENTA':
      return {
        ...estado,
        cuentas: estado.cuentas.map(cuenta =>
          cuenta.id === accion.payload.id ? accion.payload : cuenta
        ),
      };
    
    case 'ELIMINAR_CUENTA':
      return {
        ...estado,
        cuentas: estado.cuentas.filter(cuenta => cuenta.id !== accion.payload),
      };
    
    case 'ESTABLECER_TRANSACCIONES':
      return { ...estado, transacciones: accion.payload };
    
    case 'AGREGAR_TRANSACCION':
      return { ...estado, transacciones: [accion.payload, ...estado.transacciones] };
    
    case 'ACTUALIZAR_TRANSACCION':
      return {
        ...estado,
        transacciones: estado.transacciones.map(transaccion =>
          transaccion.id === accion.payload.id ? accion.payload : transaccion
        ),
      };
    
    case 'ELIMINAR_TRANSACCION':
      return {
        ...estado,
        transacciones: estado.transacciones.filter(transaccion => transaccion.id !== accion.payload),
      };
    
    case 'ESTABLECER_ARTICULOS':
      return { ...estado, articulos: accion.payload };
    
    case 'AGREGAR_ARTICULO':
      return { ...estado, articulos: [...estado.articulos, accion.payload] };
    
    case 'ACTUALIZAR_ARTICULO':
      return {
        ...estado,
        articulos: estado.articulos.map(articulo =>
          articulo.id === accion.payload.id ? accion.payload : articulo
        ),
      };
    
    case 'ELIMINAR_ARTICULO':
      return {
        ...estado,
        articulos: estado.articulos.filter(articulo => articulo.id !== accion.payload),
      };
    
    case 'ESTABLECER_CATEGORIAS':
      return { ...estado, categorias: accion.payload };
    
    case 'AGREGAR_CATEGORIA':
      return { ...estado, categorias: [...estado.categorias, accion.payload] };
    
    case 'LIMPIAR_DATOS':
      return {
        ...estadoInicial,
        usuarioActual: null,
      };
    
    default:
      return estado;
  }
}

// Contexto
const ContextoApp = createContext<ContextoAppTipo | undefined>(undefined);

// Componente Provider
interface PropiedadesAppProvider {
  children: React.ReactNode;
}

export function AppProvider({ children }: PropiedadesAppProvider) {
  const [estado, dispatch] = useReducer(reducerApp, estadoInicial);

  // Funciones de autenticación
  const iniciarSesion = async (email: string, password: string): Promise<boolean> => {
    try {
      dispatch({ tipo: 'ESTABLECER_CARGANDO', payload: true });
      
      const respuesta = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const datos = await respuesta.json();
      
      if (datos.exito) {
        dispatch({ tipo: 'ESTABLECER_USUARIO', payload: datos.usuario });
        // Guardar token en localStorage
        localStorage.setItem('token', datos.token);
        await actualizarDatos();
        return true;
      } else {
        dispatch({ tipo: 'ESTABLECER_ERROR', payload: datos.error });
        return false;
      }
    } catch (error) {
      dispatch({ tipo: 'ESTABLECER_ERROR', payload: 'Error al iniciar sesión' });
      return false;
    } finally {
      dispatch({ tipo: 'ESTABLECER_CARGANDO', payload: false });
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    dispatch({ tipo: 'LIMPIAR_DATOS', payload: null });
  };

  // Funciones para cargar datos
  const cargarCuentas = async () => {
    try {
      const respuesta = await fetch('/api/cuentas', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const datos = await respuesta.json();
      
      if (datos.exito) {
        dispatch({ tipo: 'ESTABLECER_CUENTAS', payload: datos.datos });
      } else {
        dispatch({ tipo: 'ESTABLECER_ERROR', payload: datos.error });
      }
    } catch (error) {
      dispatch({ tipo: 'ESTABLECER_ERROR', payload: 'Error al cargar las cuentas' });
    }
  };

  const cargarTransacciones = async () => {
    try {
      const respuesta = await fetch('/api/transacciones', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const datos = await respuesta.json();
      
      if (datos.exito) {
        dispatch({ tipo: 'ESTABLECER_TRANSACCIONES', payload: datos.datos });
      } else {
        dispatch({ tipo: 'ESTABLECER_ERROR', payload: datos.error });
      }
    } catch (error) {
      dispatch({ tipo: 'ESTABLECER_ERROR', payload: 'Error al cargar las transacciones' });
    }
  };

  const cargarArticulos = async () => {
    try {
      const respuesta = await fetch('/api/articulos', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const datos = await respuesta.json();
      
      if (datos.exito) {
        dispatch({ tipo: 'ESTABLECER_ARTICULOS', payload: datos.datos });
      } else {
        dispatch({ tipo: 'ESTABLECER_ERROR', payload: datos.error });
      }
    } catch (error) {
      dispatch({ tipo: 'ESTABLECER_ERROR', payload: 'Error al cargar los artículos' });
    }
  };

  const cargarCategorias = async () => {
    try {
      const respuesta = await fetch('/api/categorias', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const datos = await respuesta.json();
      
      if (datos.exito) {
        dispatch({ tipo: 'ESTABLECER_CATEGORIAS', payload: datos.datos });
      }
    } catch (error) {
      console.error('Error al cargar las categorías:', error);
    }
  };

  const actualizarDatos = async () => {
    if (!estado.usuarioActual) return;
    
    await Promise.all([
      cargarCuentas(),
      cargarTransacciones(),
      cargarArticulos(),
      cargarCategorias(),
    ]);
  };

  // Operaciones CRUD
  const crearCuenta = async (datosCuenta: CrearCuentaInput): Promise<Cuenta | null> => {
    try {
      const respuesta = await fetch('/api/cuentas', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(datosCuenta),
      });
      
      const datos = await respuesta.json();
      
      if (datos.exito) {
        dispatch({ tipo: 'AGREGAR_CUENTA', payload: datos.datos });
        return datos.datos;
      } else {
        dispatch({ tipo: 'ESTABLECER_ERROR', payload: datos.error });
        return null;
      }
    } catch (error) {
      dispatch({ tipo: 'ESTABLECER_ERROR', payload: 'Error al crear la cuenta' });
      return null;
    }
  };

  const crearTransaccion = async (datosTransaccion: CrearTransaccionInput): Promise<Transaccion | null> => {
    try {
      const respuesta = await fetch('/api/transacciones', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(datosTransaccion),
      });
      
      const datos = await respuesta.json();
      
      if (datos.exito) {
        dispatch({ tipo: 'AGREGAR_TRANSACCION', payload: datos.datos });
        // Actualizar saldo de la cuenta
        await cargarCuentas();
        return datos.datos;
      } else {
        dispatch({ tipo: 'ESTABLECER_ERROR', payload: datos.error });
        return null;
      }
    } catch (error) {
      dispatch({ tipo: 'ESTABLECER_ERROR', payload: 'Error al crear la transacción' });
      return null;
    }
  };

  const crearArticulo = async (datosArticulo: CrearArticuloInput): Promise<Articulo | null> => {
    try {
      const respuesta = await fetch('/api/articulos', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(datosArticulo),
      });
      
      const datos = await respuesta.json();
      
      if (datos.exito) {
        dispatch({ tipo: 'AGREGAR_ARTICULO', payload: datos.datos });
        return datos.datos;
      } else {
        dispatch({ tipo: 'ESTABLECER_ERROR', payload: datos.error });
        return null;
      }
    } catch (error) {
      dispatch({ tipo: 'ESTABLECER_ERROR', payload: 'Error al crear el artículo' });
      return null;
    }
  };

  const crearCategoria = async (datosCategoria: CrearCategoriaInput): Promise<Categoria | null> => {
    try {
      const respuesta = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(datosCategoria),
      });
      
      const datos = await respuesta.json();
      
      if (datos.exito) {
        dispatch({ tipo: 'AGREGAR_CATEGORIA', payload: datos.datos });
        return datos.datos;
      } else {
        dispatch({ tipo: 'ESTABLECER_ERROR', payload: datos.error });
        return null;
      }
    } catch (error) {
      dispatch({ tipo: 'ESTABLECER_ERROR', payload: 'Error al crear la categoría' });
      return null;
    }
  };

  // Verificar token al cargar
  useEffect(() => {
    const verificarToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const respuesta = await fetch('/api/auth/verificar', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const datos = await respuesta.json();
          
          if (datos.exito) {
            dispatch({ tipo: 'ESTABLECER_USUARIO', payload: datos.usuario });
            await actualizarDatos();
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
    };

    verificarToken();
  }, []);

  const valorContexto: ContextoAppTipo = {
    ...estado,
    iniciarSesion,
    cerrarSesion,
    actualizarDatos,
    crearCuenta,
    crearTransaccion,
    crearArticulo,
    crearCategoria,
  };

  return (
    <ContextoApp.Provider value={valorContexto}>
      {children}
    </ContextoApp.Provider>
  );
}

// Hook para usar el contexto
export function useApp() {
  const contexto = useContext(ContextoApp);
  if (contexto === undefined) {
    throw new Error('useApp debe usarse dentro de un AppProvider');
  }
  return contexto;
}