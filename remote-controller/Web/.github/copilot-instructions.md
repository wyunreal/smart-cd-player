# GitHub Copilot Instructions - SmartHomeController

## Contexto del Proyecto

SmartHomeController es una aplicación web para gestionar y controlar dispositivos IoT en un hogar inteligente.

## Stack Tecnológico

-   **Frontend**: React/Vue.js/Angular (especificar según el proyecto)
-   **Backend**: Node.js/ASP.NET Core (especificar según el proyecto)
-   **Comunicación IoT**: MQTT/WebSockets

## Reglas de Código

### General

-   Usar TypeScript para todo el código JavaScript
-   Escribir código limpio, legible y bien documentado
-   Seguir principios SOLID
-   Preferir programación funcional cuando sea posible
-   Usar async/await en lugar de callbacks

### Nombrado

-   Variables y funciones: camelCase
-   Clases y componentes: PascalCase
-   Constantes: UPPER_SNAKE_CASE
-   Archivos: kebab-case o PascalCase según el tipo
-   Nombres descriptivos y en inglés

### Estructura de Archivos

```
/src
  /components      # Componentes reutilizables UI
  /pages          # Páginas/vistas principales
  /services       # Lógica de negocio y APIs
  /models         # Modelos de datos y tipos
  /utils          # Funciones auxiliares
  /hooks          # Custom hooks (React)
  /store          # Estado global (Redux/Zustand)
  /config         # Configuraciones
  /assets         # Recursos estáticos
```

### Frontend

-   Crear componentes pequeños y reutilizables
-   Un componente por archivo
-   Usar hooks personalizados para lógica reutilizable
-   Implementar manejo de errores con ErrorBoundary
-   Separar lógica de presentación
-   Usar PropTypes o TypeScript para validación de props
-   Implementar lazy loading para rutas

### Backend

-   Separar rutas, controladores y servicios
-   Validar datos de entrada con middleware
-   Implementar manejo centralizado de errores
-   Usar variables de entorno para configuración sensible
-   Implementar logging apropiado
-   Añadir autenticación y autorización a endpoints protegidos

### Base de Datos

-   Usar migraciones para cambios de esquema
-   Crear índices apropiados para optimización
-   Implementar transacciones para operaciones críticas
-   Validar datos antes de insertar en BD

### IoT y Dispositivos

-   Implementar reconexión automática para MQTT/WebSockets
-   Manejar timeouts de dispositivos
-   Validar comandos antes de enviar a dispositivos
-   Implementar cola de mensajes para alta concurrencia
-   Logging de todos los eventos de dispositivos

### Seguridad

-   Nunca hardcodear credenciales o tokens
-   Usar HTTPS para todas las comunicaciones
-   Implementar rate limiting
-   Validar y sanitizar todas las entradas de usuario
-   Usar JWT con expiración corta
-   Implementar CORS apropiadamente

### Testing

-   Escribir tests unitarios para lógica de negocio
-   Tests de integración para APIs
-   Mocking de servicios externos
-   Cobertura mínima del 70%

### Performance

-   Implementar paginación para listas grandes
-   Usar caché cuando sea apropiado
-   Optimizar queries de base de datos
-   Comprimir respuestas HTTP
-   Minimizar llamadas a APIs externas

### Documentación

-   Documentar funciones complejas con JSDoc
-   README actualizado con instrucciones de instalación
-   Documentar APIs con Swagger/OpenAPI
-   Comentarios para lógica no obvia

## Patrones Preferidos

### Manejo de Estado

```typescript
// Usar custom hooks para estado local complejo
function useDeviceState(deviceId: string) {
    const [state, setState] = useState();
    // ...lógica
    return { state, actions };
}
```

### Manejo de Errores

```typescript
// Siempre usar try-catch con async/await
try {
    const result = await apiCall();
    return result;
} catch (error) {
    logger.error('Error description', error);
    throw new AppError('User friendly message', error);
}
```

### API Responses

```typescript
// Estructura consistente de respuestas
{
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}
```

## Evitar

-   ❌ Código duplicado
-   ❌ Variables globales
-   ❌ Funciones muy largas (>50 líneas)
-   ❌ Anidar callbacks (callback hell)
-   ❌ Mutación directa de estado
-   ❌ Console.log en producción
-   ❌ Any types en TypeScript
-   ❌ Commits sin mensajes descriptivos

## Cuando crees nuevos archivos

1. Incluir comentario de filepath al inicio
2. Importaciones organizadas (librerías, luego locales)
3. Interfaces/tipos antes de implementación
4. Exportar al final del archivo
5. Incluir comentarios JSDoc para funciones públicas

## Preguntas antes de generar código

Si la solicitud no es clara, preguntar sobre:

-   ¿Qué dispositivos específicos se van a controlar?
-   ¿Qué datos necesitan almacenarse?
-   ¿Hay requisitos de tiempo real?
-   ¿Autenticación requerida?
-   ¿Necesita funcionar offline?
