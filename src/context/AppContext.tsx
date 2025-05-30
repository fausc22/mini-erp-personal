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
        // Cargar datos del usuario después de establecer la sesión
        await cargarDatosCompletos();
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
  const cargarCuentas = async (): Promise<boolean> => {
    try {
      const respuesta = await fetch('/api/cuentas', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const datos = await respuesta.json();
      
      if (datos.exito) {
        dispatch({ tipo: 'ESTABLECER_CUENTAS', payload: datos.datos });
        return true;
      } else {
        console.error('Error cargando cuentas:', datos.error);
        return false;
      }
    } catch (error) {
      console.error('Error al cargar las cuentas:', error);
      return false;
    }
  };

  const cargarTransacciones = async (): Promise<boolean> => {
    try {
      const respuesta = await fetch('/api/transacciones', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const datos = await respuesta.json();
      
      if (datos.exito) {
        dispatch({ tipo: 'ESTABLECER_TRANSACCIONES', payload: datos.datos });
        return true;
      } else {
        console.error('Error cargando transacciones:', datos.error);
        return false;
      }
    } catch (error) {
      console.error('Error al cargar las transacciones:', error);
      return false;
    }
  };

  const cargarArticulos = async (): Promise<boolean> => {
    try {
      const respuesta = await fetch('/api/articulos', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const datos = await respuesta.json();
      
      if (datos.exito) {
        dispatch({ tipo: 'ESTABLECER_ARTICULOS', payload: datos.datos });
        return true;
      } else {
        console.error('Error cargando artículos:', datos.error);
        return false;
      }
    } catch (error) {
      console.error('Error al cargar los artículos:', error);
      return false;
    }
  };

  const cargarCategorias = async (): Promise<boolean> => {
    try {
      const respuesta = await fetch('/api/categorias', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const datos = await respuesta.json();
      
      if (datos.exito) {
        dispatch({ tipo: 'ESTABLECER_CATEGORIAS', payload: datos.datos });
        return true;
      } else {
        console.error('Error cargando categorías:', datos.error);
        return false;
      }
    } catch (error) {
      console.error('Error al cargar las categorías:', error);
      return false;
    }
  };

  const cargarDatosCompletos = async () => {
    dispatch({ tipo: 'ESTABLECER_CARGANDO', payload: true });
    
    try {
      // Cargar todos los datos en paralelo
      await Promise.all([
        cargarCuentas(),
        cargarTransacciones(),
        cargarArticulos(),
        cargarCategorias(),
      ]);
    } catch (error) {
      console.error('Error cargando datos completos:', error);
      dispatch({ tipo: 'ESTABLECER_ERROR', payload: 'Error al cargar los datos' });
    } finally {
      dispatch({ tipo: 'ESTABLECER_CARGANDO', payload: false });
    }
  };

  const actualizarDatos = async () => {
    if (!estado.usuarioActual) return;
    await cargarDatosCompletos();
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

  const actualizarCuenta = async (id: string, datosCuenta: Partial<CrearCuentaInput>): Promise<Cuenta | null> => {
    try {
      const respuesta = await fetch(`/api/cuentas/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(datosCuenta),
      });
      
      const datos = await respuesta.json();
      
      if (datos.exito) {
        dispatch({ tipo: 'ACTUALIZAR_CUENTA', payload: datos.datos });
        return datos.datos;
      } else {
        dispatch({ tipo: 'ESTABLECER_ERROR', payload: datos.error });
        return null;
      }
    } catch (error) {
      dispatch({ tipo: 'ESTABLECER_ERROR', payload: 'Error al actualizar la cuenta' });
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

  const actualizarTransaccion = async (id: string, datosTransaccion: Partial<CrearTransaccionInput>): Promise<Transaccion | null> => {
    try {
      const respuesta = await fetch(`/api/transacciones/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(datosTransaccion),
      });
      
      const datos = await respuesta.json();
      
      if (datos.exito) {
        dispatch({ tipo: 'ACTUALIZAR_TRANSACCION', payload: datos.datos });
        // Actualizar saldo de la cuenta
        await cargarCuentas();
        return datos.datos;
      } else {
        dispatch({ tipo: 'ESTABLECER_ERROR', payload: datos.error });
        return null;
      }
    } catch (error) {
      dispatch({ tipo: 'ESTABLECER_ERROR', payload: 'Error al actualizar la transacción' });
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

  const actualizarArticulo = async (id: string, datosArticulo: Partial<CrearArticuloInput>): Promise<Articulo | null> => {
    try {
      const respuesta = await fetch(`/api/articulos/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(datosArticulo),
      });
      
      const datos = await respuesta.json();
      
      if (datos.exito) {
        dispatch({ tipo: 'ACTUALIZAR_ARTICULO', payload: datos.datos });
        return datos.datos;
      } else {
        dispatch({ tipo: 'ESTABLECER_ERROR', payload: datos.error });
        return null;
      }
    } catch (error) {
      dispatch({ tipo: 'ESTABLECER_ERROR', payload: 'Error al actualizar el artículo' });
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
          dispatch({ tipo: 'ESTABLECER_CARGANDO', payload: true });
          
          const respuesta = await fetch('/api/auth/verificar', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const datos = await respuesta.json();
          
          if (datos.exito) {
            dispatch({ tipo: 'ESTABLECER_USUARIO', payload: datos.usuario });
            // Cargar datos después de verificar el usuario
            await cargarDatosCompletos();
          } else {
            localStorage.removeItem('token');
            dispatch({ tipo: 'LIMPIAR_DATOS', payload: null });
          }
        } catch (error) {
          console.error('Error verificando token:', error);
          localStorage.removeItem('token');
          dispatch({ tipo: 'LIMPIAR_DATOS', payload: null });
        } finally {
          dispatch({ tipo: 'ESTABLECER_CARGANDO', payload: false });
        }
      } else {
        dispatch({ tipo: 'ESTABLECER_CARGANDO', payload: false });
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
    actualizarCuenta,
    crearTransaccion,
    actualizarTransaccion,
    crearArticulo,
    actualizarArticulo,
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