/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Lista COMPLETA de transpilePackages para Ant Design
  transpilePackages: [
    // Ant Design core
    'antd',
    '@ant-design/icons',
    '@ant-design/icons-svg',  // ← ESTE ES EL QUE FALTABA
    '@ant-design/colors',
    '@ant-design/cssinjs',
    
    // RC Components (React Components usados por Ant Design)
    'rc-util',
    'rc-pagination',
    'rc-picker', 
    'rc-notification',
    'rc-tooltip',
    'rc-tree',
    'rc-table',
    'rc-cascader',
    'rc-checkbox',
    'rc-collapse',
    'rc-dialog',
    'rc-drawer',
    'rc-dropdown',
    'rc-field-form',
    'rc-image',
    'rc-input',
    'rc-input-number',
    'rc-mentions',
    'rc-menu',
    'rc-motion',
    'rc-overflow',
    'rc-progress',
    'rc-rate',
    'rc-resize-observer',
    'rc-segmented',
    'rc-select',
    'rc-slider',
    'rc-steps',
    'rc-switch',
    'rc-textarea',
    'rc-time-picker',
    'rc-trigger',
    'rc-upload',
    'rc-virtual-list',
    'rc-tree-select',
    'rc-tabs'
  ],
  
  // Configuración experimental
  experimental: {
    optimizeCss: false,
    scrollRestoration: true,
  },

  // Configuración de webpack
  webpack: (config, { isServer }) => {
    // Alias para imports más limpios
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };

    // Configuración específica para el servidor
    if (isServer) {
      // Asegurar que ciertos módulos se traten correctamente
      config.module.rules.push({
        test: /\.m?js$/,
        type: 'javascript/auto',
        resolve: {
          fullySpecified: false,
        },
      });
    }

    return config;
  },
};

module.exports = nextConfig;