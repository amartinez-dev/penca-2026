# Penca Salados 2026

Web app moderna para organizar una penca del Mundial 2026 para la Escuela de Música Salados.

Incluye:

- Registro por nombre y PIN.
- Login simple con nombre + PIN.
- Carga de pronósticos partido por partido.
- Opción de guardar varios pronósticos de una vez.
- Bloqueo automático 15 minutos antes de cada partido.
- Tabla de posiciones automática.
- Ranking general de participantes.
- Panel admin.
- Carga manual de partidos y resultados.
- Recalcular puntajes.
- Sincronización opcional con API-Football.
- Edge Function opcional para Supabase Cron.

> Importante: dentro de la app se usa la palabra **pronóstico** para evitar que parezca una plataforma de apuestas.

---

## Stack

- Next.js
- React
- Supabase Postgres
- Vercel
- API-Football / API-Sports, opcional para fixtures y resultados

---

## 1. Crear proyecto Supabase

1. Entrar a Supabase.
2. Crear un proyecto nuevo.
3. Ir a **SQL Editor**.
4. Ejecutar el archivo:

```bash
supabase/schema.sql
```

Opcionalmente, para probar sin la API:

```bash
supabase/seed-demo.sql
```

Ese seed carga partidos ficticios de prueba. No es el fixture oficial completo.

---

## 2. Variables de entorno

Copiar `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Completar:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
ADMIN_PASSWORD=cambia-esta-clave
API_FOOTBALL_KEY=tu_api_key
API_FOOTBALL_HOST=v3.football.api-sports.io
API_FOOTBALL_LEAGUE_ID=1
API_FOOTBALL_SEASON=2026
CRON_SECRET=cambia-este-secreto
```

Dónde encontrar las claves en Supabase:

- Project Settings → API → Project URL
- Project Settings → API → service_role key

No subas `.env.local` a GitHub.

---

## 3. Ejecutar en local

```bash
npm install
npm run dev
```

Abrir:

```text
http://localhost:3000
```

---

## 4. Subir a GitHub

```bash
git init
git add .
git commit -m "Penca Salados 2026"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/penca-salados.git
git push -u origin main
```

---

## 5. Publicar en Vercel

1. Entrar a Vercel.
2. Importar el repositorio de GitHub.
3. Configurar las mismas variables de entorno.
4. Deploy.

Variables necesarias en Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`
- `API_FOOTBALL_KEY`
- `API_FOOTBALL_HOST`
- `API_FOOTBALL_LEAGUE_ID`
- `API_FOOTBALL_SEASON`
- `CRON_SECRET`

---

## 6. Uso de la app

### Participante

1. Entra a la web.
2. Se registra con nombre y PIN.
3. Carga pronósticos.
4. Puede editar hasta 15 minutos antes de cada partido.
5. Mira la tabla.

### Admin

Entrar a:

```text
/admin
```

Usar la clave definida en `ADMIN_PASSWORD`.

Desde el panel podés:

- Ver resumen.
- Crear partidos manuales.
- Cargar resultados manuales.
- Ver participantes.
- Sincronizar API-Football.
- Recalcular tabla.

---

## 7. Reglas de puntaje

- Marcador exacto: 5 puntos.
- Acierto de ganador o empate: 3 puntos.
- Diferencia exacta con resultado correcto: +1 punto.
- Sin acierto: 0 puntos.

Ejemplo:

Resultado real: Uruguay 2 - 1 España

| Pronóstico | Puntos |
|---|---:|
| Uruguay 2 - 1 España | 5 |
| Uruguay 1 - 0 España | 3 |
| Uruguay 3 - 2 España | 4 |
| España 1 - 0 Uruguay | 0 |

---

## 8. Sincronizar API-Football manualmente

Desde el panel admin:

```text
Admin → sync → Sincronizar ahora
```

También se puede llamar por HTTP:

```bash
curl -X POST https://TU-DOMINIO.vercel.app/api/admin/sync-api-football \
  -H "x-admin-password: TU_ADMIN_PASSWORD"
```

---

## 9. Automatizar actualización de resultados

La app incluye dos caminos.

### Opción A: endpoint de la app

Endpoint:

```text
/api/cron/sync
```

Llamarlo con:

```bash
curl https://TU-DOMINIO.vercel.app/api/cron/sync \
  -H "x-cron-secret: TU_CRON_SECRET"
```

Podés programarlo desde Supabase Cron o cualquier servicio externo gratuito.

### Opción B: Supabase Edge Function

Archivo incluido:

```text
supabase/functions/sync-results/index.ts
```

Deploy:

```bash
supabase functions deploy sync-results
```

Secrets:

```bash
supabase secrets set API_FOOTBALL_KEY=tu_api_key
supabase secrets set API_FOOTBALL_HOST=v3.football.api-sports.io
supabase secrets set API_FOOTBALL_LEAGUE_ID=1
supabase secrets set API_FOOTBALL_SEASON=2026
supabase secrets set SUPABASE_URL=https://TU-PROYECTO.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

Luego programar el cron siguiendo `supabase/cron.sql`.

---

## 10. Qué falta para dejarla 100% lista para producción

Este paquete ya es funcional, pero antes de usarlo con mucha gente conviene revisar:

- Cargar el fixture oficial completo desde API-Football.
- Probar zona horaria de los partidos en Uruguay.
- Cambiar el texto y colores finales.
- Definir si se permite empate en fase eliminatoria: esta app pronostica el resultado del partido tal como lo entregue la API.
- Definir premios o categorías.
- Decidir si el cierre será 15, 30 o 60 minutos antes.

---

## Estructura

```text
app/                    Pantallas y rutas API de Next.js
components/             Navegación
lib/                    Supabase, auth y cálculo de puntos
supabase/schema.sql     Tablas y vista leaderboard
supabase/seed-demo.sql  Datos de prueba
supabase/functions/     Edge Function opcional
```

---

## Seguridad

Este proyecto usa una autenticación simple con nombre + PIN, pensada para una penca escolar. El PIN se guarda hasheado. Las operaciones sensibles pasan por API routes de Next.js con `SUPABASE_SERVICE_ROLE_KEY`, que nunca debe exponerse en el navegador.

Para un uso masivo o público, conviene migrar a Supabase Auth real con OTP o magic links.
