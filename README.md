# Arista Partners

Web publica y arquitectura inicial de panel privado para Arista Partners, iniciativa chilena de representacion, intermediacion y desarrollo comercial.

El sitio publico informa servicios, explica el proceso comercial y permite preparar consultas u oportunidades mediante formularios locales. El panel privado queda preparado para conectarse posteriormente a Supabase, sin credenciales reales ni backend remoto configurado.

## Tecnologias

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- lucide-react
- `@supabase/supabase-js`

## Instalacion

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Si el puerto 5173 esta ocupado:

```bash
npm run dev -- --port 5174
```

## Validacion

```bash
npm run lint
npm run build
npm test
```

Las pruebas automatizadas viven junto a los modulos que verifican.

## Estructura principal

- `src/pages`: paginas publicas.
- `src/admin`: rutas, autenticacion y pantallas del panel privado.
- `src/components`: layout publico, SEO, bloques legales y componentes reutilizables.
- `src/components/admin`: shell y componentes del panel.
- `src/components/opportunities`: campos, secciones y formularios de oportunidades.
- `src/lib`: configuracion y cliente Supabase.
- `src/repositories`: interfaces e implementaciones de acceso a datos.
- `src/types`: tipos TypeScript del dominio administrativo.
- `src/data/site.ts`: navegacion, metadatos SEO y URL publica.
- `src/data/contact.ts`: canales oficiales de contacto, pendientes de configuracion real.
- `src/data/legal.ts`: datos legales y estado provisional de documentos.
- `src/data/opportunityForms.ts`: definicion tipada de formularios de compra, venta y proveedor.
- `supabase/migrations`: migraciones SQL versionadas.
- `public/brand`: identidad visual oficial y recortes usados por la web.

## Rutas publicas

- `/`
- `/nosotros`
- `/servicios`
- `/como-funciona`
- `/oportunidades`
- `/oportunidades?tipo=comprar`
- `/oportunidades?tipo=vender`
- `/oportunidades?tipo=proveedor`
- `/contacto`
- `/privacidad`
- `/terminos`
- `/terminos-y-privacidad` mantiene una pagina puente para enlaces antiguos.

## Rutas administrativas

- `/admin/login`
- `/admin`
- `/admin/oportunidades`
- `/admin/proveedores`
- `/admin/contactos`
- `/admin/consultas`
- `/admin/seguimiento`
- `/admin/acuerdos`
- `/admin/configuracion`

Las rutas administrativas no aparecen en el menu ni footer publicos. El modulo admin se carga de forma diferida para no aumentar innecesariamente la carga inicial publica.

## Variables de entorno

Copia `.env.example` a un archivo local no versionado y completa los valores cuando exista un proyecto Supabase:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_TURNSTILE_SITE_KEY=
VITE_PUBLIC_FORMS_ENABLED=false
```

Usa una publishable key en el navegador. Si el proyecto todavia entrega una clave `anon` heredada, puede usarse por compatibilidad segun la documentacion de Supabase, pero no debe incluirse una clave real en el repositorio.

Nunca uses en variables `VITE_*`:

- `service_role`
- secret keys
- password de base de datos
- connection strings

## Edge Function de recepcion publica

Se preparo la funcion `submit-public-form` en:

```text
supabase/functions/submit-public-form
```

La funcion fue desplegada y debe mantenerse configurada con `verify_jwt = false` en `supabase/config.toml` para invocacion publica. Su seguridad depende de validacion de origen, Turnstile, honeypot y whitelist estricta de campos. La insercion se realiza solamente en `form_submissions`; no crea automaticamente contactos, oportunidades, proveedores ni consultas.

Secretos esperados solo en el entorno seguro de Supabase Edge Functions:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
TURNSTILE_SECRET_KEY=
TURNSTILE_EXPECTED_HOSTNAMES=
PUBLIC_SITE_ORIGINS=
```

`PUBLIC_SITE_ORIGINS` acepta una lista separada por comas. En desarrollo pueden agregarse explicitamente `http://127.0.0.1:5174` y `http://localhost:5174`. No uses `*` en produccion. La service role nunca debe agregarse al frontend ni a variables `VITE_*`.

## Estado actual de Supabase

- `@supabase/supabase-js` esta instalado.
- `src/lib/supabase-config.ts` valida si existen variables reales.
- `src/lib/supabase.ts` crea el cliente solo si la configuracion es valida.
- Si faltan variables, la web publica funciona normalmente y `/admin` muestra estado de configuracion pendiente.
- El proyecto local esta preparado para trabajar con un proyecto Supabase vinculado mediante la CLI local.
- Las migraciones deben verificarse con `npx supabase migration list --linked` antes de cualquier cambio de base.
- No hay credenciales reales versionadas en el proyecto.

## Migraciones

La migracion inicial esta en:

```text
supabase/migrations/20260812000000_initial_admin_architecture.sql
```

Incluye:

- `admin_profiles`
- `contacts`
- `opportunities`
- `suppliers`
- `inquiries`
- `opportunity_suppliers`
- `opportunity_activities`
- `commercial_agreements`
- `form_submissions`

La CLI de Supabase no estaba disponible en este entorno. Antes de aplicar migraciones, instala o habilita la CLI y valida comandos con:

```bash
supabase --help
supabase migration --help
supabase db --help
```

La documentacion oficial revisada indica estos comandos para el flujo posterior:

```bash
supabase migration new nombre_descriptivo
supabase login
supabase link
supabase db push
```

No ejecutes `db push` hasta revisar el SQL, conectar el proyecto correcto y confirmar que no se aplicara sobre una base equivocada.

## RLS, grants y Data API

La migracion:

- Activa RLS en todas las tablas publicas creadas.
- Revoca privilegios a `anon`.
- Concede privilegios a `authenticated` solo para que la Data API pueda acceder a las tablas.
- Restringe filas mediante politicas que exigen un `admin_profile` activo con rol `owner`.
- No usa `auth.role()`.
- No usa `user_metadata` para autorizacion.
- No habilita insercion publica en `form_submissions`.

RLS y GRANT son capas distintas: GRANT permite que una tabla sea accesible para el rol/PostgREST; RLS decide que filas puede ver o modificar una solicitud autorizada. En proyectos nuevos, revisa tambien la configuracion de Data API del dashboard porque las tablas nuevas pueden no exponerse automaticamente.

## Primer administrador

No existe registro publico de administradores.

Flujo recomendado cuando Supabase este conectado:

1. Crear manualmente el usuario desde Supabase Auth Dashboard o un flujo administrativo seguro.
2. Insertar manualmente su fila en `admin_profiles` con el mismo `auth.users.id`, `role = 'owner'` e `is_active = true`.
3. No crear triggers que conviertan cualquier registro de Auth en administrador.

El SQL exacto de insercion debe prepararse solo con el UUID real del usuario ya creado. No uses datos de ejemplo en produccion.

## Tipos generados

`src/types/supabase.generated.ts` contiene los tipos oficiales generados desde el proyecto Supabase vinculado. Es un archivo autogenerado: no debe editarse manualmente.

Regenera los tipos cuando se aplique una migracion o cambie el esquema remoto:

```bash
npm run types:supabase
```

El script usa la CLI local fijada en `package-lock.json`, lee el proyecto linked y genera solo el esquema `public` en UTF-8. Generar tipos no aplica migraciones, no ejecuta `db push` y no modifica datos.

Requisitos previos:

- Haber ejecutado `supabase login` en el entorno local.
- Tener el proyecto correcto vinculado con `supabase link`.
- Verificar la ayuda real con `npx supabase gen types --help` si cambia la version de CLI.

Si el archivo generado no contiene una tabla o columna esperada por las migraciones locales, hay drift entre el esquema remoto y las migraciones del repositorio. En ese caso no edites `supabase.generated.ts`; revisa que la migracion correspondiente este aplicada en Supabase.

`src/types/database.ts` mantiene aliases de dominio derivados del archivo generado y unions TypeScript para valores definidos mediante CHECK constraints. `src/types/admin.ts` conserva tipos de presentacion, formularios y joins que no son filas directas de base de datos.

## Formularios publicos

Los formularios de oportunidades y contacto general validan en el navegador y muestran mensajes en espanol. No guardan borradores ni consentimientos en `localStorage`; si el envio falla, los datos se conservan solamente en el estado de la pagina actual.

La recepcion digital sigue deshabilitada por defecto con `VITE_PUBLIC_FORMS_ENABLED=false`. En ese estado no se invoca Supabase y no se carga Turnstile. Si se habilita, el frontend exige `VITE_TURNSTILE_SITE_KEY`, obtiene un token Turnstile y llama `supabase.functions.invoke('submit-public-form')`. Solo limpia el formulario si la funcion confirma una insercion real.

## Preparacion para Vercel

`vercel.json` incluye una regla de rewrite hacia `index.html` para que React Router funcione al recargar rutas internas y cabeceras basicas de seguridad compatibles con el estado actual. No hay dominio, variables secretas ni integraciones externas configuradas.

## Pendientes antes de produccion

- Configurar datos reales en `src/data/contact.ts`.
- Completar informacion legal real en `src/data/legal.ts`.
- Revisar profesionalmente Politica de privacidad y Terminos.
- Actualizar la politica antes del 1 de diciembre de 2026 por la entrada en vigor de la Ley N. 21.719.
- Configurar URL publica en `src/data/site.ts` antes de generar canonical.
- Revisar y aplicar migraciones en un entorno controlado.
- Crear manualmente el primer usuario administrador y su `admin_profile`.
- Generar tipos TypeScript desde Supabase despues de aplicar la migracion.
- Conectar recepcion digital de formularios con validacion de servidor, antispam y limites de solicitudes en produccion.
- Antes de habilitar recepcion publica en produccion:
  - Completar identidad legal.
  - Definir correo de privacidad.
  - Revisar Politica de Privacidad.
  - Informar Supabase como proveedor tecnologico cuando corresponda.
  - Informar Turnstile/Cloudflare cuando corresponda.
  - Definir conservacion de formularios.
  - Configurar version legal real.
  - Realizar revision juridica.
  - Configurar dominios permitidos.
  - Configurar claves reales.
  - Probar antispam.
- Definir mecanismo seguro para documentos adjuntos si se requiere.
