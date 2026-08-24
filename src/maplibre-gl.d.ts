// Declaración ambient para que TypeScript no falle si maplibre-gl aún no está instalado.
// Una vez instalado con `npm install maplibre-gl`, los tipos reales lo sobreescriben.
declare module 'maplibre-gl' {
  const Map: any;
  const Marker: any;
  const Popup: any;
  const NavigationControl: any;
  const LngLatBounds: any;
  export { Map, Marker, Popup, NavigationControl, LngLatBounds };
  export default any;
}
