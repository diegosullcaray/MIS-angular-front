/** Valor actual de un `<input>`/`<textarea>` a partir de su evento nativo. */
export function inputValue(event: Event): string {
  return (event.target as HTMLInputElement).value;
}
