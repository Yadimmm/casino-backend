-- CreateTable
CREATE TABLE "participantes" (
    "id" TEXT NOT NULL,
    "codigo_publico" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "rango_edad" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "creado_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anonimizado_at" TIMESTAMP(3),

    CONSTRAINT "participantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas" (
    "id" TEXT NOT NULL,
    "participante_id" TEXT NOT NULL,
    "email_hash" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acceso_at" TIMESTAMP(3),
    "creado_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuentas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "huellas" (
    "id" TEXT NOT NULL,
    "hash_huella" TEXT NOT NULL,
    "canvas_hash" TEXT NOT NULL,
    "gpu_webgl" TEXT NOT NULL,
    "resolucion" TEXT NOT NULL,
    "zona_horaria" TEXT NOT NULL,
    "visitas" INTEGER NOT NULL DEFAULT 1,
    "creado_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "huellas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones" (
    "id" TEXT NOT NULL,
    "participante_id" TEXT NOT NULL,
    "cuenta_id" TEXT NOT NULL,
    "huella_id" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "version_laboratorio" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "ip_hash" TEXT,
    "iniciada_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizada_at" TIMESTAMP(3),

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "datos_pasivos" (
    "id" TEXT NOT NULL,
    "sesion_id" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "capturado_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "datos_pasivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" TEXT NOT NULL,
    "sesion_id" TEXT NOT NULL,
    "juego_id" TEXT,
    "tipo" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "ms_decision" INTEGER,
    "respondido_at" TIMESTAMP(3),
    "solicitado_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consentimientos" (
    "id" TEXT NOT NULL,
    "sesion_id" TEXT NOT NULL,
    "version_aviso" TEXT NOT NULL,
    "aceptado" BOOLEAN NOT NULL,
    "alcance" JSONB NOT NULL,
    "ms_decision" INTEGER,
    "respondido_at" TIMESTAMP(3) NOT NULL,
    "revocado_at" TIMESTAMP(3),

    CONSTRAINT "consentimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "juegos" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tecnologia_demo" TEXT NOT NULL,
    "instrucciones_seguridad" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" SMALLINT NOT NULL,
    "creado_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "juegos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cookies_laboratorio" (
    "id" TEXT NOT NULL,
    "sesion_id" TEXT NOT NULL,
    "juego_id" TEXT,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "proposito" TEXT NOT NULL,
    "valor_hash" TEXT NOT NULL,
    "secure_flag" BOOLEAN NOT NULL,
    "http_only_flag" BOOLEAN NOT NULL,
    "same_site" TEXT NOT NULL,
    "creada_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_at" TIMESTAMP(3),
    "eliminada_at" TIMESTAMP(3),

    CONSTRAINT "cookies_laboratorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultados_juego" (
    "id" TEXT NOT NULL,
    "sesion_id" TEXT NOT NULL,
    "juego_id" TEXT NOT NULL,
    "puntaje" INTEGER NOT NULL,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "metricas" JSONB NOT NULL,
    "iniciado_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completado_at" TIMESTAMP(3),

    CONSTRAINT "resultados_juego_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogo_riesgos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "recomendacion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catalogo_riesgos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respuestas_concientizacion" (
    "id" TEXT NOT NULL,
    "sesion_id" TEXT NOT NULL,
    "juego_id" TEXT,
    "riesgo_id" TEXT NOT NULL,
    "pregunta_codigo" TEXT NOT NULL,
    "respuesta" TEXT NOT NULL,
    "es_correcta" BOOLEAN NOT NULL,
    "respondido_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "respuestas_concientizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_navegador" (
    "id" TEXT NOT NULL,
    "sesion_id" TEXT NOT NULL,
    "juego_id" TEXT,
    "tipo_evento" TEXT NOT NULL,
    "detalle" JSONB NOT NULL,
    "ocurrido_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_navegador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_accesos" (
    "id" TEXT NOT NULL,
    "cuenta_actor_id" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "registro_id" TEXT,
    "datos_antes" JSONB,
    "datos_despues" JSONB,
    "ip_hash" TEXT,
    "ocurrido_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_accesos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "participantes_codigo_publico_key" ON "participantes"("codigo_publico");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_participante_id_key" ON "cuentas"("participante_id");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_email_hash_key" ON "cuentas"("email_hash");

-- CreateIndex
CREATE UNIQUE INDEX "huellas_hash_huella_key" ON "huellas"("hash_huella");

-- CreateIndex
CREATE UNIQUE INDEX "datos_pasivos_sesion_id_clave_key" ON "datos_pasivos"("sesion_id", "clave");

-- CreateIndex
CREATE UNIQUE INDEX "consentimientos_sesion_id_key" ON "consentimientos"("sesion_id");

-- CreateIndex
CREATE UNIQUE INDEX "juegos_slug_key" ON "juegos"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "resultados_juego_sesion_id_juego_id_key" ON "resultados_juego"("sesion_id", "juego_id");

-- CreateIndex
CREATE UNIQUE INDEX "catalogo_riesgos_codigo_key" ON "catalogo_riesgos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "respuestas_concientizacion_sesion_id_riesgo_id_pregunta_cod_key" ON "respuestas_concientizacion"("sesion_id", "riesgo_id", "pregunta_codigo");

-- AddForeignKey
ALTER TABLE "cuentas" ADD CONSTRAINT "cuentas_participante_id_fkey" FOREIGN KEY ("participante_id") REFERENCES "participantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_participante_id_fkey" FOREIGN KEY ("participante_id") REFERENCES "participantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_huella_id_fkey" FOREIGN KEY ("huella_id") REFERENCES "huellas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datos_pasivos" ADD CONSTRAINT "datos_pasivos_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "sesiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permisos" ADD CONSTRAINT "permisos_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "sesiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permisos" ADD CONSTRAINT "permisos_juego_id_fkey" FOREIGN KEY ("juego_id") REFERENCES "juegos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentimientos" ADD CONSTRAINT "consentimientos_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "sesiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cookies_laboratorio" ADD CONSTRAINT "cookies_laboratorio_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "sesiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cookies_laboratorio" ADD CONSTRAINT "cookies_laboratorio_juego_id_fkey" FOREIGN KEY ("juego_id") REFERENCES "juegos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_juego" ADD CONSTRAINT "resultados_juego_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "sesiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_juego" ADD CONSTRAINT "resultados_juego_juego_id_fkey" FOREIGN KEY ("juego_id") REFERENCES "juegos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_concientizacion" ADD CONSTRAINT "respuestas_concientizacion_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "sesiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_concientizacion" ADD CONSTRAINT "respuestas_concientizacion_juego_id_fkey" FOREIGN KEY ("juego_id") REFERENCES "juegos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas_concientizacion" ADD CONSTRAINT "respuestas_concientizacion_riesgo_id_fkey" FOREIGN KEY ("riesgo_id") REFERENCES "catalogo_riesgos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_navegador" ADD CONSTRAINT "eventos_navegador_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "sesiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_navegador" ADD CONSTRAINT "eventos_navegador_juego_id_fkey" FOREIGN KEY ("juego_id") REFERENCES "juegos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
