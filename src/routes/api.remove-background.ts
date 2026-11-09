import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/remove-background")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
          return Response.json(
            { detail: "Se esperaba una imagen en formato multipart/form-data." },
            { status: 415 },
          );
        }

        let body: FormData;
        try {
          body = await request.formData();
        } catch {
          return Response.json(
            { detail: "No se pudo leer el formulario de imagen." },
            { status: 400 },
          );
        }

        if (!body.has("file")) {
          return Response.json({ detail: "Falta el archivo de imagen." }, { status: 400 });
        }

        const serviceUrl = process.env.BACKGROUND_REMOVAL_URL ?? "http://localhost:7000";
        const targetUrl = new URL("/api/remove-background", serviceUrl);

        try {
          const upstream = await fetch(targetUrl, {
            method: "POST",
            body,
            signal: request.signal,
          });
          const headers = new Headers();
          const contentType = upstream.headers.get("content-type");
          if (contentType) headers.set("content-type", contentType);
          return new Response(upstream.body, { status: upstream.status, headers });
        } catch {
          return Response.json(
            { detail: "El servicio de eliminación de fondo no está disponible." },
            { status: 502 },
          );
        }
      },
    },
  },
});
