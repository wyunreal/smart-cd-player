# Configuración de Autenticación con Google OAuth

Este proyecto utiliza NextAuth.js con Google OAuth como único proveedor de autenticación.

## Configuración de Google OAuth

### 1. Crear un proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs & Services**

### 2. Configurar la pantalla de consentimiento OAuth

1. Ve a **OAuth consent screen**
2. Selecciona **External** (o **Internal** si es una organización de Google Workspace)
3. Completa la información requerida:
   - **App name**: Nombre de tu aplicación
   - **User support email**: Tu email
   - **Developer contact information**: Tu email
4. Agrega los scopes necesarios (email, profile)
5. Guarda y continúa

### 3. Crear credenciales OAuth 2.0

1. Ve a **Credentials** > **Create Credentials** > **OAuth client ID**
2. Selecciona **Web application**
3. Configura las URIs autorizadas:

   **Para Desarrollo:**

   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

   **Para Producción:**

   - Authorized JavaScript origins: `https://tu-dominio.com`
   - Authorized redirect URIs: `https://tu-dominio.com/api/auth/callback/google`

4. Guarda y descarga las credenciales

### 4. Configurar variables de entorno

Copia el archivo `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Completa las variables de entorno:

```env
# Genera un secret seguro con: openssl rand -base64 32
AUTH_SECRET=tu_secret_generado

# Credenciales de Google OAuth
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret

# URL de tu aplicación
NEXTAUTH_URL=http://localhost:3000  # Para desarrollo
# NEXTAUTH_URL=https://tu-dominio.com  # Para producción
```

## Notas Importantes

- **AUTH_SECRET**: Genera un secret seguro con `openssl rand -base64 32`
- **NEXTAUTH_URL**: En producción, asegúrate de usar HTTPS
- **Dominios autorizados**: Agrega todos los dominios donde se ejecutará tu aplicación (desarrollo, staging, producción)
- **Verificación de Google**: Para uso en producción, es recomendable completar el proceso de verificación de Google

## Limitaciones en Modo de Prueba

Si tu aplicación está en modo de prueba en Google Cloud Console:

- Solo los usuarios que agregues explícitamente podrán iniciar sesión
- Límite de 100 usuarios de prueba
- Para permitir que cualquier usuario de Gmail inicie sesión, debes publicar la aplicación

## Publicar la Aplicación (Producción)

Para permitir que cualquier usuario de Gmail inicie sesión:

1. Ve a **OAuth consent screen**
2. Click en **Publish App**
3. Si usas scopes sensibles, necesitarás pasar por el proceso de verificación de Google

## Troubleshooting

### Error: redirect_uri_mismatch

- Verifica que la URI de redirección en Google Cloud Console coincida exactamente con la de tu aplicación
- Formato correcto: `http://localhost:3000/api/auth/callback/google` (sin trailing slash)

### Error: invalid_client

- Verifica que las credenciales `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` sean correctas
- Asegúrate de no tener espacios en blanco al copiar las credenciales

### Usuario no puede iniciar sesión

- Si la app está en modo de prueba, agrega el usuario en Google Cloud Console > OAuth consent screen > Test users
- O publica la aplicación para permitir cualquier usuario de Gmail
