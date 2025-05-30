'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'next/navigation';

const { Title, Text, Link } = Typography;

interface DatosLogin {
  email: string;
  password: string; // ✅ Cambiar de 'contraseña' a 'password'
}

interface DatosRegistro {
  nombre: string;
  email: string;
  password: string; // ✅ Cambiar aquí
  confirmarPassword: string; // ✅ Y aquí también
}

const FormularioLogin: React.FC = () => {
  const [modoRegistro, setModoRegistro] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { iniciarSesion } = useApp();
  const router = useRouter();

  const manejarLogin = async (valores: DatosLogin) => {
    setCargando(true);
    setError(null);

    try {
      const exito = await iniciarSesion(valores.email, valores.password);
      if (exito) {
        router.push('/dashboard');
      } else {
        setError('Email o contraseña incorrectos');
      }
    } catch (error) {
      setError('Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  const manejarRegistro = async (valores: DatosRegistro) => {
    setCargando(true);
    setError(null);

    if (valores.password !== valores.confirmarPassword) {
      setError('Las contraseñas no coinciden');
      setCargando(false);
      return;
    }

    try {
      const respuesta = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: valores.nombre,
          email: valores.email,
          password: valores.password,
        }),
      });

      const datos = await respuesta.json();

      if (datos.exito) {
        // Automáticamente iniciar sesión después del registro
        await iniciarSesion(valores.email, valores.password);
        router.push('/dashboard');
      } else {
        setError(datos.error || 'Error al crear la cuenta');
      }
    } catch (error) {
      setError('Error al registrarse. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          borderRadius: '12px',
        }}
        bodyStyle={{ padding: '40px 32px' }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              Mi ERP Personal
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              {modoRegistro ? 'Crear nueva cuenta' : 'Iniciar sesión en tu cuenta'}
            </Text>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ borderRadius: '6px' }}
            />
          )}

          {/* Login Form */}
          {!modoRegistro ? (
            <Form
              name="login"
              onFinish={manejarLogin}
              layout="vertical"
              size="large"
              autoComplete="off"
            >
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Por favor ingresa tu email' },
                  { type: 'email', message: 'Ingresa un email válido' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="tu@email.com"
                  style={{ borderRadius: '6px' }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Contraseña"
                rules={[{ required: true, message: 'Por favor ingresa tu contraseña' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Tu contraseña"
                  style={{ borderRadius: '6px' }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: '16px' }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={cargando}
                  block
                  style={{ 
                    height: '48px',
                    fontSize: '16px',
                    borderRadius: '6px',
                    fontWeight: 600
                  }}
                >
                  Iniciar Sesión
                </Button>
              </Form.Item>
            </Form>
          ) : (
            /* Register Form */
            <Form
              name="registro"
              onFinish={manejarRegistro}
              layout="vertical"
              size="large"
              autoComplete="off"
            >
              <Form.Item
                name="nombre"
                label="Nombre Completo"
                rules={[
                  { required: true, message: 'Por favor ingresa tu nombre' },
                  { min: 2, message: 'El nombre debe tener al menos 2 caracteres' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="Tu nombre completo"
                  style={{ borderRadius: '6px' }}
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Por favor ingresa tu email' },
                  { type: 'email', message: 'Ingresa un email válido' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="tu@email.com"
                  style={{ borderRadius: '6px' }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Contraseña"
                rules={[
                  { required: true, message: 'Por favor ingresa una contraseña' },
                  { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Mínimo 6 caracteres"
                  style={{ borderRadius: '6px' }}
                />
              </Form.Item>

              <Form.Item
                name="confirmarPassword"
                label="Confirmar Contraseña"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Por favor confirma tu contraseña' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Las contraseñas no coinciden'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Confirma tu contraseña"
                  style={{ borderRadius: '6px' }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: '16px' }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={cargando}
                  block
                  style={{ 
                    height: '48px',
                    fontSize: '16px',
                    borderRadius: '6px',
                    fontWeight: 600
                  }}
                >
                  Crear Cuenta
                </Button>
              </Form.Item>
            </Form>
          )}

          {/* Toggle Mode */}
          <Divider style={{ margin: '16px 0' }} />
          
          <div style={{ textAlign: 'center' }}>
            <Text>
              {modoRegistro ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
              <Link 
                onClick={() => {
                  setModoRegistro(!modoRegistro);
                  setError(null);
                }}
                style={{ fontWeight: 600 }}
              >
                {modoRegistro ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default FormularioLogin;