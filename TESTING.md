# Guía de Testing - Chubb App Bot

Este proyecto utiliza **Jest** y **Angular Testing Library** para realizar pruebas unitarias y de integración.

## 📋 Tabla de Contenidos

- [Requisitos](#requisitos)
- [Configuración](#configuración)
- [Ejecutar Tests](#ejecutar-tests)
- [Estructura de Tests](#estructura-de-tests)
- [Cobertura](#cobertura)
- [Convenciones](#convenciones)

## ✅ Requisitos

- Node.js 18+
- npm 9+
- Angular 18.2+

## ⚙️ Configuración

El proyecto ya está configurado con Jest y Angular Testing Library. Los archivos de configuración son:

- `jest.config.js` - Configuración principal de Jest
- `setup-jest.ts` - Configuración del entorno de pruebas
- `tsconfig.spec.json` - Configuración de TypeScript para tests

### Dependencias de Testing

```json
{
  "@testing-library/angular": "^19.0.0",
  "@testing-library/dom": "^10.4.1",
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/user-event": "^14.6.1",
  "@types/jest": "^30.0.0",
  "jest": "^29.7.0",
  "jest-preset-angular": "^14.6.2"
}
```

## 🚀 Ejecutar Tests

### Comandos Disponibles

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch (re-ejecuta al detectar cambios)
npm run test:watch

# Ejecutar tests con reporte de cobertura
npm run test:coverage

# Ejecutar tests en modo CI (para integración continua)
npm run test:ci
```

### Ejemplos de Uso

```bash
# Ejecutar un archivo de test específico
npm test -- bot.service.spec.ts

# Ejecutar tests que coincidan con un patrón
npm test -- --testNamePattern="BotService"

# Ejecutar tests con mayor detalle (verbose)
npm test -- --verbose

# Ejecutar tests en modo silencioso
npm test -- --silent
```

## 📁 Estructura de Tests

```
src/
├── app/
│   ├── components/
│   │   ├── chat-window.component.ts
│   │   └── chat-window.component.spec.ts       # Tests del componente de ventana de chat
│   ├── services/
│   │   ├── bot.service.ts
│   │   └── bot.service.spec.ts                 # Tests del servicio de bot
│   ├── app.component.ts
│   └── app.component.spec.ts                   # Tests del componente principal
├── jest.config.js                              # Configuración de Jest
└── setup-jest.ts                               # Setup del entorno de testing
```

## 📊 Cobertura

### Ver Reporte de Cobertura

```bash
npm run test:coverage
```

Esto generará un reporte en `coverage/` con:
- Reporte HTML en `coverage/index.html` (abrir en navegador)
- Reporte en consola con resumen de cobertura
- Reporte LCOV para herramientas de CI/CD

### Objetivos de Cobertura

El proyecto no tiene umbrales mínimos de cobertura configurados, pero se recomienda:

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## 📝 Convenciones

### Nomenclatura de Tests

```typescript
describe('NombreDelComponente/Servicio', () => {
  describe('Funcionalidad Específica', () => {
    it('should comportamiento esperado', () => {
      // Arrange - Preparar
      // Act - Ejecutar
      // Assert - Verificar
    });
  });
});
```

### Patrones de Testing

#### 1. Testing de Servicios (bot.service.spec.ts)

```typescript
describe('BotService', () => {
  let service: BotService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BotService]
    });
    service = TestBed.inject(BotService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should send a message successfully', (done) => {
    // Test implementation
  });
});
```

#### 2. Testing de Componentes (chat-window.component.spec.ts)

```typescript
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

describe('ChatWindowComponent', () => {
  it('should render messages correctly', async () => {
    await render(ChatWindowComponent, {
      imports: [CommonModule, FormsModule],
      componentProperties: {
        messages: defaultMessages
      }
    });

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

#### 3. Testing de Interacciones de Usuario

```typescript
it('should send a message when clicking the send button', async () => {
  const handleBotMessageSpy = jest.fn();

  await render(ChatWindowComponent, {
    componentProperties: {
      handleBotMessage: { emit: handleBotMessageSpy } as any
    }
  });

  const input = screen.getByPlaceholderText('Escribe tu mensaje...');
  await userEvent.type(input, 'Hello');
  await userEvent.click(sendButton);

  expect(handleBotMessageSpy).toHaveBeenCalled();
});
```

## 🐛 Troubleshooting

### Problema: Tests fallan con error de módulos ESM

**Solución**: Asegúrate de que `transformIgnorePatterns` en `jest.config.js` incluya los paquetes necesarios:

```javascript
transformIgnorePatterns: [
  'node_modules/(?!.*\\.mjs$|marked|@testing-library)'
]
```

### Problema: Tests lentos

**Solución**:
- Usa `jest --maxWorkers=4` para limitar workers
- Considera usar `--testPathPattern` para ejecutar tests específicos
- Revisa que no haya console.log innecesarios

### Problema: Error con zone.js

**Solución**: Verifica que `setup-jest.ts` use la nueva sintaxis:

```typescript
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
setupZoneTestEnv();
```

## 📚 Recursos Adicionales

- [Jest Documentation](https://jestjs.io/)
- [Angular Testing Library](https://testing-library.com/docs/angular-testing-library/intro/)
- [jest-preset-angular](https://thymikee.github.io/jest-preset-angular/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)

## 🎯 Mejores Prácticas

1. **Escribir tests legibles**: Los tests son documentación viviente del código
2. **Un concepto por test**: Cada test debe verificar un único comportamiento
3. **Arrange-Act-Assert**: Seguir el patrón AAA para estructurar tests
4. **Mocking apropiado**: Mockear dependencias externas, no lógica de negocio
5. **Tests independientes**: Cada test debe poder ejecutarse independientemente
6. **Nombres descriptivos**: Los nombres de tests deben describir el comportamiento esperado
7. **Evitar lógica en tests**: Los tests deben ser simples y directos

## 📊 Resumen de Suites de Tests

### BotService (bot.service.spec.ts)
- ✅ 13 tests
- Cubre: HTTP requests, error handling, retry logic, session management

### ChatWindowComponent (chat-window.component.spec.ts)
- ✅ 29 tests
- Cubre: Rendering, user interactions, themes, error states, modals

### AppComponent (app.component.spec.ts)
- ✅ 14 tests
- Cubre: Initialization, bot switching, message handling, microphone, chat controls

**Total: 56 tests pasando ✅**

---

Actualizado: Febrero 2026
