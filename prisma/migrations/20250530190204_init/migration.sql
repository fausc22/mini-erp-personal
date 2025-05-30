-- CreateEnum
CREATE TYPE "TipoCuenta" AS ENUM ('EFECTIVO', 'BANCO', 'TARJETA_CREDITO', 'INVERSION', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoTransaccion" AS ENUM ('INGRESO', 'GASTO', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "TipoArticulo" AS ENUM ('PRODUCTO', 'SERVICIO', 'GASTO');

-- CreateEnum
CREATE TYPE "TipoCategoria" AS ENUM ('PRODUCTO', 'SERVICIO', 'GASTO');

-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('ARS', 'USD');

-- CreateEnum
CREATE TYPE "Frecuencia" AS ENUM ('MENSUAL', 'TRIMESTRAL', 'ANUAL');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoCuenta" NOT NULL,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "descripcion" TEXT,
    "color" TEXT DEFAULT '#1890ff',
    "moneda" "Moneda" NOT NULL DEFAULT 'ARS',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacciones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "tipo" "TipoTransaccion" NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "notas" TEXT,
    "articuloId" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transacciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articulos" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DOUBLE PRECISION NOT NULL,
    "costo" DOUBLE PRECISION DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER DEFAULT 0,
    "categoriaId" TEXT NOT NULL,
    "unidad" TEXT DEFAULT 'unidad',
    "codigoBarras" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "tipo" "TipoArticulo" NOT NULL DEFAULT 'PRODUCTO',
    "esRecurrente" BOOLEAN DEFAULT false,
    "frecuencia" "Frecuencia",
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articulos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoCategoria" NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#1890ff',
    "icono" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuraciones" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuraciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_usuarioId_nombre_key" ON "cuentas"("usuarioId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "articulos_usuarioId_nombre_key" ON "articulos"("usuarioId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "articulos_usuarioId_codigoBarras_key" ON "articulos"("usuarioId", "codigoBarras");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_usuarioId_nombre_tipo_key" ON "categorias"("usuarioId", "nombre", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "configuraciones_clave_key" ON "configuraciones"("clave");

-- AddForeignKey
ALTER TABLE "cuentas" ADD CONSTRAINT "cuentas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "cuentas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "articulos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articulos" ADD CONSTRAINT "articulos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articulos" ADD CONSTRAINT "articulos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
