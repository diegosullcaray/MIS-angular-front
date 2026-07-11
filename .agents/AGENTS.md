# Workspace Rules: Angular 22 Signal Forms

Todas las tareas de desarrollo e implementación de formularios en este proyecto deben seguir las pautas detalladas en [03_TRD.md](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/mis-host/docs_proyecto/03_TRD.md).

## Reglas de Codificación de Formularios:

1. **Uso de Signal Forms:** Está estrictamente prohibido utilizar el módulo tradicional `ReactiveFormsModule` (`FormGroup`, `FormControl`, `FormBuilder`, `Validators`) o `FormsModule` (`ngModel`) para nuevos componentes. Se debe utilizar la API nativa de **Signal Forms** (`@angular/forms/signals`).
2. **Importaciones obligatorias:**
   * Importar `form`, `FormField` (directiva) y los validadores necesarios (`required`, `email`, `minLength`, `maxLength`, etc.) desde `@angular/forms/signals`.
   * Registrar `FormField` en la sección `imports` del componente standalone.
3. **Sincronización del Modelo:** Definir siempre el modelo de datos inicial mediante un `signal()` de Angular y pasarlo como primer argumento a `form(this.model)`.
4. **Validaciones en Esquema:** Configurar las validaciones del formulario utilizando el callback del segundo parámetro de la función `form()`. Evitar validaciones manuales dispersas.
5. **Evaluación de Estados:** En plantillas HTML y lógica de TS, evaluar los estados reactivos llamando a los campos del formulario como signals (ej. `form.campo().invalid()`, `form.campo().touched()`, `form.campo().errors()`).
6. **Vinculación de Inputs:** Vincular campos usando la directiva `[formField]="myForm.campo"` en lugar de `formControlName` o `[(ngModel)]`.
