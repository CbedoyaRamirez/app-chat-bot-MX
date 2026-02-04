# Sistema de Timeout por Inactividad

## 📋 Descripción General

El sistema de timeout por inactividad cierra automáticamente el chat después de un período de tiempo sin actividad del usuario. Esta funcionalidad mejora la experiencia del usuario y optimiza el uso de recursos.

## ⚙️ Configuración

### Tiempos Configurables

Los tiempos están definidos en `app.component.ts`:

```typescript
// Configuración de timeout de inactividad
private readonly INACTIVITY_WARNING_TIME = 4 * 60 * 1000; // 4 minutos
private readonly INACTIVITY_TIMEOUT = 5 * 60 * 1000;      // 5 minutos
```

### Parámetros:

- **INACTIVITY_WARNING_TIME**: `4 minutos` - Tiempo tras el cual se muestra la advertencia
- **INACTIVITY_TIMEOUT**: `5 minutos` - Tiempo total antes de cerrar el chat
- **Countdown**: `60 segundos` - Tiempo que el usuario tiene para responder a la advertencia

## 🔄 Flujo de Funcionamiento

### 1. Inicio del Timer

El timer se inicia automáticamente cuando:
- El usuario abre el chat
- El usuario cambia entre bots (Quote Auto ↔ FAQ)

### 2. Advertencia de Inactividad

Después de **4 minutos** sin actividad:
- Se muestra un modal con advertencia
- Comienza cuenta regresiva de 60 segundos
- El usuario puede:
  - Hacer clic en "Continuar conversación" → Resetea el timer
  - No hacer nada → El chat se cierra al llegar a 0

### 3. Cierre Automático

Si el usuario no responde después de **5 minutos**:
- Se agrega un mensaje de sistema notificando el cierre
- El chat se cierra automáticamente después de 2 segundos
- Se reinicia la sesión y se limpian los mensajes

### 4. Reset del Timer

El timer se resetea cuando el usuario:
- Envía un mensaje de texto
- Envía un mensaje de voz (micrófono)
- Hace clic en "Continuar conversación" en el modal de advertencia

### 5. Limpieza del Timer

Los timers se limpian automáticamente cuando:
- El usuario minimiza el chat
- El usuario cierra el chat
- El componente se destruye (OnDestroy)

## 🎨 Componentes UI

### Modal de Advertencia

El modal incluye:
- **Icono de reloj animado** con efecto pulse
- **Título**: "¿Sigues ahí?"
- **Mensaje explicativo**
- **Cuenta regresiva grande** con animación
- **Botón de acción**: "Continuar conversación"

### Estilos Visuales

```scss
- Background blur: backdrop-filter
- Animaciones: fadeIn, modalScaleIn, countdownPulse
- Colores: Naranja (#FF6B00) para el countdown
- Efecto hover en botón con ripple
```

## 💻 Implementación Técnica

### Métodos Principales

#### `startInactivityTimer()`
Inicia los temporizadores de advertencia y cierre.

```typescript
private startInactivityTimer(): void {
  this.clearInactivityTimers();

  // Timer para advertencia (4 min)
  this.warningTimer = setTimeout(() => {
    this.showInactivityWarning = true;
    this.startCountdown();
  }, this.INACTIVITY_WARNING_TIME);

  // Timer para cierre (5 min)
  this.inactivityTimer = setTimeout(() => {
    this.closeByInactivity();
  }, this.INACTIVITY_TIMEOUT);
}
```

#### `resetInactivityTimer()`
Resetea los timers cuando hay actividad del usuario.

```typescript
private resetInactivityTimer(): void {
  this.showInactivityWarning = false;
  this.clearCountdown();
  this.startInactivityTimer();
}
```

#### `clearInactivityTimers()`
Limpia todos los temporizadores.

```typescript
private clearInactivityTimers(): void {
  if (this.warningTimer) clearTimeout(this.warningTimer);
  if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
  this.clearCountdown();
}
```

#### `startCountdown()`
Inicia la cuenta regresiva en el modal.

```typescript
private startCountdown(): void {
  this.countdownInterval = setInterval(() => {
    this.inactivityCountdown--;
    if (this.inactivityCountdown <= 0) {
      this.clearCountdown();
    }
  }, 1000);
}
```

#### `closeByInactivity()`
Cierra el chat por inactividad.

```typescript
private closeByInactivity(): void {
  // Agregar mensaje de sistema
  const inactivityMessage: Message = {
    message: 'Chat cerrado por inactividad.',
    messageType: 'text',
    fromUser: false,
    timestamp: new Date()
  };

  this.messages.push(inactivityMessage);

  // Cerrar después de 2 segundos
  setTimeout(() => {
    this.isChatOpen = false;
    this.messages = [];
    this.sessionId = this.botService.generateSessionId();
  }, 2000);
}
```

#### `keepChatActive()`
Mantiene el chat activo cuando el usuario responde.

```typescript
keepChatActive(): void {
  this.showInactivityWarning = false;
  this.resetInactivityTimer();
}
```

## 🧪 Testing

Se incluyen **9 tests** completos que cubren:

### Test Suite: Inactivity Timeout

1. ✅ **Inicio del timer al abrir el chat**
   - Verifica que los timers se inicien correctamente

2. ✅ **Mostrar advertencia después de 4 minutos**
   - Simula el paso del tiempo y verifica el modal

3. ✅ **Cerrar chat después de 5 minutos**
   - Verifica el cierre automático completo

4. ✅ **Reset del timer al enviar mensaje**
   - Verifica que la actividad resetea el contador

5. ✅ **Mantener chat activo con botón continuar**
   - Verifica la funcionalidad del botón de advertencia

6. ✅ **Limpiar timers al minimizar**
   - Verifica la limpieza correcta de recursos

7. ✅ **Limpiar timers al cerrar**
   - Verifica la limpieza al cerrar el chat

8. ✅ **Actualización de countdown cada segundo**
   - Verifica la cuenta regresiva funciona

9. ✅ **Limpiar timers en ngOnDestroy**
   - Verifica la limpieza al destruir el componente

### Ejecutar Tests

```bash
npm test                  # Ejecutar todos los tests
npm run test:watch        # Modo watch
npm run test:coverage     # Con cobertura
```

## 📊 Estadísticas

```
Total de Tests: 65 pasando ✅
- bot.service.spec.ts: 13 tests
- chat-window.component.spec.ts: 29 tests
- app.component.spec.ts: 23 tests (incluye 9 de timeout)
```

## 🎯 Casos de Uso

### Escenario 1: Usuario Inactivo
```
1. Usuario abre chat → Timer inicia
2. Pasan 4 minutos sin actividad → Modal aparece
3. Countdown llega a 0 → Chat se cierra
```

### Escenario 2: Usuario Activo
```
1. Usuario abre chat → Timer inicia
2. Pasan 3 minutos
3. Usuario envía mensaje → Timer se resetea
4. Pasan otros 3 minutos → No se muestra advertencia (solo 3 min desde reset)
```

### Escenario 3: Usuario Responde a Advertencia
```
1. Usuario abre chat → Timer inicia
2. Pasan 4 minutos → Modal aparece
3. Usuario hace clic en "Continuar" → Timer se resetea
4. Modal se cierra y chat continúa activo
```

## 🔧 Personalización

### Modificar Tiempos

Para cambiar los tiempos de timeout, edita las constantes en `app.component.ts`:

```typescript
// Advertencia a los 2 minutos
private readonly INACTIVITY_WARNING_TIME = 2 * 60 * 1000;

// Cierre a los 3 minutos
private readonly INACTIVITY_TIMEOUT = 3 * 60 * 1000;

// Countdown de 30 segundos
inactivityCountdown = 30;
```

### Modificar Mensajes

Edita el mensaje de cierre en el método `closeByInactivity()`:

```typescript
const inactivityMessage: Message = {
  message: 'Tu mensaje personalizado aquí',
  messageType: 'text',
  fromUser: false,
  timestamp: new Date()
};
```

### Personalizar Modal

Los estilos del modal están en `app.component.scss`:
- `.inactivity-modal`: Contenedor principal
- `.countdown-timer`: Estilos del contador
- `.btn-primary`: Botón de acción

## 🐛 Troubleshooting

### El timer no se inicia
**Causa**: El chat no está abriendo correctamente
**Solución**: Verifica que `isChatOpen` sea `true`

### El timer no se resetea
**Causa**: El método `resetInactivityTimer()` no se está llamando
**Solución**: Verifica que esté integrado en `onHandleMessage()`

### Múltiples timers activos
**Causa**: No se están limpiando los timers anteriores
**Solución**: Verifica que `clearInactivityTimers()` se llame antes de crear nuevos timers

### Modal no desaparece
**Causa**: `showInactivityWarning` no se está seteando a `false`
**Solución**: Verifica el método `keepChatActive()` y `clearInactivityTimers()`

## 📝 Mejores Prácticas

1. **Siempre limpiar timers**: Usar `clearTimeout()` y `clearInterval()` apropiadamente
2. **Resetear en toda actividad**: Cualquier interacción del usuario debe resetear el timer
3. **Proveer feedback visual**: El modal debe ser claro y obvio
4. **Countdown visible**: Mostrar tiempo restante aumenta engagement
5. **Graceful shutdown**: Dar tiempo al usuario para ver el mensaje de cierre

## 🚀 Mejoras Futuras

- [ ] Configuración personalizable por usuario
- [ ] Diferentes tiempos según tipo de bot
- [ ] Sonido de notificación antes de cerrar
- [ ] Guardar estado antes de cerrar (recovery)
- [ ] Analytics de inactividad
- [ ] A/B testing de tiempos óptimos

---

**Última Actualización**: Febrero 2026
**Versión**: 1.0.0
**Tests**: 9/9 pasando ✅
