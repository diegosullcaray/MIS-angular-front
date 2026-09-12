---
name: mis-host-rules
description: Reglas y configuración global de Gemini para el repositorio MIS Host.
always_on: true
---

# Gobernanza y Reglas Base de MIS Host

Bienvenido al repositorio **MIS Host** (Financiera Confianza).
Este proyecto sigue reglas estrictas de arquitectura y un pipeline de gobernanza que DEBES respetar en todo momento.

**Regla de oro: cuando la documentación y el código discrepan, gana el código.** Si notas una discrepancia, respeta el código.

## 1. Pila Tecnológica (El "Idioma Local")
El proyecto utiliza **Angular 22 (zoneless)**, **PrimeNG 21** y **Tailwind CSS v4**.
El backend es **Ant** mediante el transporte **Winder**. NO existen APIs REST.

Cuando escribas o modifiques código Angular, aplica siempre las siguientes reglas:
- **Zoneless**: Todo el proyecto es zoneless. No uses ni importes `zone.js`.
- **Señales**: Usa `signal()`, `computed()`, `input()`, `output()`. No uses `@Input()`, `@Output()` ni RxJS para estado síncrono.
- **OnPush PROHIBIDO**: NO agregues `ChangeDetectionStrategy.OnPush` en ningún lado. Ningún componente lo usa.
- **Standalone**: Usa siempre `standalone: true`.
- **Inyección**: Usa `inject()` siempre. No inyectes dependencias por constructor.
- **Control de Flujo**: Usa `@if`, `@for`, `@switch`. Prohibido usar `*ngIf`, `*ngFor` y no importes `CommonModule`.
- **Mapeos puros**: Funciones puras en `utils/`, estado y transporte en `services/`, presentación en `ui/`, orquestación en `components/`.

## 2. Estilos (Tailwind v4 y Tokens)
- La fuente de verdad son los tokens en `src/app/theme/tokens.css`.
- **No inventes clases semánticas** (ej. prohibido `bg-surface-card` o `text-primary-600`).
- Usa siempre los tokens de CSS nativos (ej. `text-[var(--mis-text-primary)]` o vía el atributo `style="background: var(--mis-surface)"`).

## 3. Manejo de Estado (Errores y Vacíos)
Siempre modela los cuatro estados (en este orden estricto):
1. **Error**: Si falla el servidor. (No lo disfraces de vacío).
2. **Cargando**: Mientras se espera respuesta.
3. **Vacío**: Respuesta exitosa sin datos.
4. **Contenido**: Data lista.
Usa los componentes compartidos de `src/app/shared/ui/` (`app-inline-error`, `app-empty-state`, `app-list-skeleton`).

## 4. Agentes y Skills del Repositorio
El repositorio cuenta con su propio pipeline de agentes y sus propias skills (guías operativas).
- **Agentes**: Documentados en [governance/agents/README.md](file:///c:/Users/24681/Videos/DD/MIS-angular-front/governance/agents/README.md). Cuando se te pida asumir un rol específico del pipeline (por ejemplo, "Agente Desarrollador Angular"), debes leer y acatar estrictamente su documento `.md` correspondiente en `governance/agents/`.
- **Skills**: Ubicados en `governance/skills/`. Contienen el "cómo hacer" local para tareas específicas (ej. reportes por bloques, tours guiados, arquitectura de módulos). Consúltalos si no sabes cómo implementar algo que ya está resuelto en el proyecto.

## 5. Scripts y Verificación
No subas ni apruebes código sin antes verificar. Puedes ejecutar:
- `npm run verify` para verificar gobernanza, docs, tokens, etc. (tarda segundos, sin compilar).
- `npx ng build --configuration production` para validar compilación estricta.
