const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: /^https?.*/, 
      handler: 'NetworkFirst',
      options: {
        cacheName: 'https-calls',
        networkTimeoutSeconds: 15,
        expiration: {
          maxEntries: 150,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Optimizaciones de performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Configuración de imágenes
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },

  // Variables de entorno públicas
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Headers de seguridad y PWA
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()'
          }
        ]
      }
    ];
  },

  // Configuración para Ant Design
  transpilePackages: ['antd'],
  
  // Configuración experimental
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Configuración de webpack para optimizaciones
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimización para producción
    if (!dev && !isServer) {
      // Optimizar bundle splitting
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          antd: {
            name: 'antd',
            test: /[\\/]node_modules[\\/]antd[\\/]/,
            priority: 20,
          },
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            enforce: true,
          },
        },
      };
    }

    // Alias para imports más limpios
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };

    return config;
  },

  // Redirects para mejor SEO
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },

  // Configuración de salida para static export si es necesario
  output: 'standalone',
  
  // Configuración de compresión
  compress: true,
  
  // Configuración para Railway deployment
  generateBuildId: async () => {
    // Usar timestamp para build ID en desarrollo
    if (process.env.NODE_ENV === 'development') {
      return 'development';
    }
    // Usar git commit hash en producción si está disponible
    return process.env.RAILWAY_GIT_COMMIT_SHA || `build-${Date.now()}`;
  },
};

module.exports = withPWA(nextConfig);
