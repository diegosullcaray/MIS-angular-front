import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Arranque standalone (desarrollo aislado en el puerto propio).
// Cuando el Host embebe este remote NO se ejecuta este bootstrap:
// el Host carga directamente el componente expuesto './Component'.
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
