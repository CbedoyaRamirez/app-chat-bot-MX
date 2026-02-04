# Configuración del Timeout de Inactividad

## ⚙️ Configuración Actual

El sistema está configurado con los siguientes tiempos en `src/app/app.component.ts`:

```typescript
private readonly INACTIVITY_WARNING_TIME = 1 * 60 * 1000; // 1 minuto
private readonly INACTIVITY_TIMEOUT = 2 * 60 * 1000;      // 2 minutos
```

## 📊 Cronología del Timeout

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  0 seg                1 min              2 min          │
│   │─────────────────────│─────────────────│            │
│   │                     │                 │            │
│   │  Usuario activo     │  Advertencia    │  Cierre    │
│   │  en el chat         │  aparece        │  automático│
│   │                     │                 │            │
│   │                     └─ Countdown 60s ─┘            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🔍 Explicación Detallada

### Fase 1: Actividad Normal (0 - 1 minuto)
- El usuario puede interactuar libralmente con el chat
- Cada mensaje enviado reinicia el contador a 0
- No hay indicadores visuales de timeout

### Fase 2: Advertencia (1 - 2 minutos)
- **A 1 minuto** de inactividad: Aparece modal de advertencia
- Se muestra una cuenta regresiva de **60 segundos**
- El usuario puede:
  - Hacer clic en "Continuar conversación" → Reinicia el contador
  - No hacer nada → El chat se cerrará cuando llegue a 0

### Fase 3: Cierre Automático (2 minutos)
- **A los 2 minutos** totales de inactividad: El chat se cierra
- Se muestra un mensaje: "Chat cerrado por inactividad"
- Después de 2 segundos adicionales:
  - El chat se oculta
  - Los mensajes se borran
  - Se genera una nueva sesión

## ⚠️ Importante: Relación entre Tiempos

**REGLA FUNDAMENTAL:** `INACTIVITY_TIMEOUT` debe ser **mayor** que `INACTIVITY_WARNING_TIME`

```typescript
// ✅ CORRECTO
INACTIVITY_WARNING_TIME = 1 min
INACTIVITY_TIMEOUT = 2 min
// Diferencia = 1 min = 60 segundos de countdown

// ❌ INCORRECTO (Lo que causaba el problema)
INACTIVITY_WARNING_TIME = 1 min
INACTIVITY_TIMEOUT = 1 min
// Diferencia = 0 min = Modal aparece y se cierra inmediatamente
```

## 🎯 Cuenta Regresiva Automática

El countdown se calcula automáticamente:

```typescript
this.inactivityCountdown = Math.floor(
  (this.INACTIVITY_TIMEOUT - this.INACTIVITY_WARNING_TIME) / 1000
);
```

**Ejemplo con configuración actual:**
- Timeout: 2 minutos (120,000 ms)
- Advertencia: 1 minuto (60,000 ms)
- Countdown: (120,000 - 60,000) / 1000 = **60 segundos**

## 🔧 Cómo Personalizar los Tiempos

### Ejemplo 1: Timeout más largo (5 minutos)
```typescript
private readonly INACTIVITY_WARNING_TIME = 4 * 60 * 1000; // 4 minutos
private readonly INACTIVITY_TIMEOUT = 5 * 60 * 1000;      // 5 minutos
// Countdown = 60 segundos
```

### Ejemplo 2: Timeout corto (30 segundos)
```typescript
private readonly INACTIVITY_WARNING_TIME = 20 * 1000;     // 20 segundos
private readonly INACTIVITY_TIMEOUT = 30 * 1000;          // 30 segundos
// Countdown = 10 segundos
```

### Ejemplo 3: Countdown más largo
```typescript
private readonly INACTIVITY_WARNING_TIME = 1 * 60 * 1000; // 1 minuto
private readonly INACTIVITY_TIMEOUT = 3 * 60 * 1000;      // 3 minutos
// Countdown = 120 segundos (2 minutos)
```

## 🧪 Testing

Los tests están diseñados para adaptarse automáticamente a la configuración:

```typescript
// Los tests leen dinámicamente las constantes
const warningTime = (app as any).INACTIVITY_WARNING_TIME;
const timeoutTime = (app as any).INACTIVITY_TIMEOUT;

// Y calculan el countdown esperado
const expectedCountdown = (timeoutTime - warningTime) / 1000;
```

Esto significa que puedes cambiar los tiempos en `app.component.ts` y los tests seguirán funcionando correctamente.

## 📝 Checklist al Modificar Tiempos

- [ ] `INACTIVITY_TIMEOUT` > `INACTIVITY_WARNING_TIME`
- [ ] La diferencia es suficiente para que el usuario reaccione (mínimo 10 segundos)
- [ ] Ejecutar `npm test` para verificar que los tests pasan
- [ ] Probar manualmente en el navegador
- [ ] Actualizar esta documentación si cambias los valores por defecto

## 🐛 Solución de Problemas

### Problema: El modal aparece y desaparece inmediatamente
**Causa:** Los dos timers tienen el mismo valor
**Solución:** Asegúrate que `INACTIVITY_TIMEOUT` > `INACTIVITY_WARNING_TIME`

### Problema: El countdown es negativo o 0
**Causa:** `INACTIVITY_WARNING_TIME` ≥ `INACTIVITY_TIMEOUT`
**Solución:** Aumenta `INACTIVITY_TIMEOUT` o reduce `INACTIVITY_WARNING_TIME`

### Problema: El countdown no se actualiza
**Causa:** El intervalo no se está iniciando correctamente
**Solución:** Verifica que `startCountdown()` se llame después de mostrar la advertencia

### Problema: El timer no se resetea al enviar mensajes
**Causa:** `resetInactivityTimer()` no se está llamando
**Solución:** Verifica que se llame en `onHandleMessage()` y en el botón del modal

## 💡 Mejores Prácticas

1. **Tiempos Recomendados:**
   - Mínimo: 30 segundos de advertencia, 1 minuto de timeout
   - Óptimo: 1 minuto de advertencia, 2 minutos de timeout
   - Máximo: 4 minutos de advertencia, 5 minutos de timeout

2. **Countdown:**
   - Mínimo recomendado: 10 segundos
   - Óptimo: 30-60 segundos
   - Permite al usuario reaccionar sin presión

3. **Testing:**
   - Siempre ejecutar `npm test` después de cambiar tiempos
   - Probar manualmente en navegador
   - Verificar en móviles también

## 📊 Configuraciones por Tipo de Chat

### Chat de Soporte (Alta Prioridad)
```typescript
INACTIVITY_WARNING_TIME = 2 * 60 * 1000; // 2 minutos
INACTIVITY_TIMEOUT = 3 * 60 * 1000;      // 3 minutos
```

### Chat de Ventas (Media Prioridad)
```typescript
INACTIVITY_WARNING_TIME = 3 * 60 * 1000; // 3 minutos
INACTIVITY_TIMEOUT = 5 * 60 * 1000;      // 5 minutos
```

### Chat Informativo (Baja Prioridad)
```typescript
INACTIVITY_WARNING_TIME = 4 * 60 * 1000; // 4 minutos
INACTIVITY_TIMEOUT = 5 * 60 * 1000;      // 5 minutos
```

---

**Última actualización:** Febrero 2026
**Versión:** 1.1.0 (Corregido problema de timers simultáneos)
