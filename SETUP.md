# ComeBien — Guía de instalación local

Instrucciones paso a paso para correr la app por primera vez.

---

## Requisitos previos

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **Cuenta en Supabase** — [supabase.com](https://supabase.com) (gratis)
- **Cuenta en OpenAI** — [platform.openai.com](https://platform.openai.com) (necesitas saldo o tier 1+)

---

## 1. Clona el repositorio

```bash
git clone https://github.com/LinamariaMartinez/ComeBien.git
cd ComeBien
```

## 2. Instala las dependencias

```bash
npm install
```

## 3. Configura las variables de entorno

Copia el archivo de ejemplo y ábrelo:

```bash
cp .env.local.example .env.local
```

Luego edita `.env.local` con tus valores reales (ver Paso 4 y 5).

## 4. Crea el proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) → **New project**
2. Elige un nombre (ej. `comebien`) y una contraseña de base de datos → **Create**
3. Espera a que el proyecto se inicialice (~1 min)
4. Ve a **Project Settings → API** y copia:
   - **Project URL** → pégala como `NEXT_PUBLIC_SUPABASE_URL` en `.env.local`
   - **anon / public** key → pégala como `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env.local`

## 5. Crea la clave de OpenAI

1. Ve a [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Clic en **Create new secret key**
3. Copia la clave → pégala como `OPENAI_API_KEY` en `.env.local`

> ⚠️ Asegúrate de tener saldo o estar en Tier 1. La app usa `gpt-4o-mini`.

## 6. Crea el esquema de base de datos

1. En Supabase, ve a **SQL Editor**
2. Abre el archivo `supabase/schema.sql` de este proyecto
3. Copia todo el contenido y pégalo en el SQL Editor → **Run**

Esto crea:
- Tabla `user_profiles` (perfil por usuario)
- Tabla `daily_logs` (registro diario de comidas)
- Tabla `user_recipes` (recetas, para uso futuro)
- Políticas RLS (cada usuario solo ve sus propios datos)
- Trigger que crea el perfil automáticamente al registrarse

## 7. Habilita la autenticación en Supabase

1. Ve a **Authentication → Providers**
2. Asegúrate de que **Email** esté habilitado (lo está por defecto)
3. Ve a **Authentication → Settings** y, si quieres evitar confirmación por correo en desarrollo, activa **"Disable email confirmations"**

## 8. Crea las cuentas de usuario manualmente

> La app **no tiene registro público** — los usuarios se crean aquí.

1. Ve a **Authentication → Users → Add user**
2. Crea las dos cuentas con correo y contraseña
3. Después de crearlas, puedes editar su perfil (nombre, metas diarias) desde la app misma en ⚙️ Configuración

### Configurar metas de Linamaría (usuario 1)

Después de hacer login como Linamaría, ve a ⚙️ → ajusta:
- Nombre: `Linamaría`
- Metas diarias: Legumbres 3, Cereales 3, Huevos 2, Verduras 4, Frutas 4, Grasas 3, Leche soya 2, Yogur 1
- Día actual del ciclo y duración

## 9. Corre la app en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

## 10. Verifica que todo funcione

- [ ] La pantalla de login aparece correctamente
- [ ] Puedes iniciar sesión con una de las cuentas creadas
- [ ] El nombre del usuario aparece en el encabezado
- [ ] Las tarjetas de progreso muestran las metas correctas
- [ ] Puedes registrar una comida desde el formulario
- [ ] El chat de Consúltame responde correctamente
- [ ] Al cerrar sesión, vuelve a la pantalla de login

---

## Estructura de carpetas

```
ComeBien/
├── app/
│   ├── api/          # Rutas del servidor (Next.js App Router)
│   │   ├── chat/     # Chat con IA (OpenAI)
│   │   ├── logs/     # Registro de comidas (CRUD)
│   │   ├── parse-meal/  # Parseo de porciones con IA
│   │   ├── profile/  # Perfil del usuario
│   │   └── settings/ # Configuración (metas, ciclo)
│   └── components/   # Componentes React
├── lib/
│   ├── auth.ts       # Cliente Supabase para el navegador
│   ├── constants.ts  # Grupos de alimentos y utilidades
│   ├── supabase.ts   # Cliente Supabase para el servidor
│   └── types.ts      # Tipos TypeScript
└── supabase/
    └── schema.sql    # Esquema completo de la base de datos
```

---

## Problemas frecuentes

| Error | Solución |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` vacío | Asegúrate de copiar `.env.local.example` a `.env.local` y rellenar los valores |
| Error 401 en la API | El token de sesión venció — cierra sesión y vuelve a entrar |
| Error 500 en el chat | Verifica que `OPENAI_API_KEY` sea válida y tenga saldo |
| Las metas no se guardan | Asegúrate de haber ejecutado `schema.sql` completo en Supabase |
| Datos de otro usuario visibles | Verifica que las políticas RLS estén activas en el SQL Editor |
