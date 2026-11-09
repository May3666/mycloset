# MyCloset

MyCloset es un armario digital para organizar prendas y combinarlas en outfits. Permite procesar fotos para quitarles el fondo, buscar y filtrar prendas, y guardar combinaciones con vista previa descargable.

La interfaz inicial fue diseñada con Lovable AI y después ampliada para incluir la gestión de prendas y outfits.

## Cómo usarlo

1. En **Mi armario**, selecciona **Agregar prenda** y elige una foto PNG, JPG o WEBP. El sistema elimina el fondo automáticamente y muestra la vista previa sobre un fondo beige.
2. Completa nombre, marca, categoría, color y temporada, y guarda la prenda. Para modificarla o eliminarla, selecciona su tarjeta.
3. Usa el buscador por nombre y los filtros de categoría, color y temporada para encontrar prendas.
4. En **Mis outfits**, selecciona **Crear outfit**, asigna nombre y ocasión, y marca las prendas que quieres combinar.
5. Abre un outfit para ver su composición. Desde ahí puedes editarlo, eliminarlo o descargar la vista previa como PNG.

## Ejecutar en local

Requisitos: Node.js con npm y Docker Desktop.

```sh
npm install
docker compose -f background-removal/compose.yaml up --build
npm run dev
```

La app usa el primer puerto disponible a partir del 8080 y el servicio de procesamiento escucha en `http://localhost:7000`. Si Vite selecciona un puerto distinto a los incluidos en `ALLOWED_ORIGINS`, agrega ese origen a la variable del servicio para permitir la petición CORS. Para una URL de backend distinta, define `VITE_BACKGROUND_REMOVAL_API_URL` antes de iniciar o compilar el frontend.

En el primer inicio, el servicio descarga el modelo U²-Net (aprox. 176 MB) y lo conserva en un volumen Docker. El backend usa `rembg` (MIT) y los pesos de U²-Net (Apache-2.0). Es un modelo general, así que los resultados pueden variar con prendas de bajo contraste, oclusiones o sombras complejas.

Las prendas y outfits se guardan en IndexedDB del navegador y no se sincronizan entre dispositivos. Las fotos se procesan con el servicio Python autohospedado, no con una API externa.

## Escalabilidad y próximos pasos

MyCloset es una base altamente escalable: la gestión de prendas, outfits y el procesamiento de imágenes están separados en componentes y servicios que pueden evolucionar de forma independiente. Se planea seguir mejorándolo, incluyendo sincronización entre dispositivos, cuentas de usuario, mejores modelos de segmentación de ropa y nuevas herramientas para descubrir combinaciones.
