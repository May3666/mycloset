# Screenshot Match

Implement exactly the screenshot and nothing else

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b23db6d5-0dda-4c84-9295-2449c3695466).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Background removal service

Garment photos are processed by a separate self-hosted Python service. Start it with Docker Desktop running:

```sh
docker compose -f background-removal/compose.yaml up --build
```

The first startup downloads the U²-Net model (about 176 MB); Docker keeps it in a named volume. The service listens on `http://localhost:7000`. Set `VITE_BACKGROUND_REMOVAL_API_URL=http://localhost:7000/api/remove-background` in the frontend environment before building it. Set `ALLOWED_ORIGINS` on the service to the frontend's origin; for production, set the frontend URL to the deployed HTTPS endpoint and protect/rate-limit the service at its reverse proxy.

The service uses `rembg` (MIT) with U²-Net weights (Apache-2.0). U²-Net is a general foreground model, so results can vary with low contrast, occlusion, or complex shadows. Saved PNG blobs are stored in the browser's IndexedDB and are not synchronized to other devices.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
