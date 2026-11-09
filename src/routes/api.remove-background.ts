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

        try {
          const environment = typeof process === "undefined" ? undefined : process.env;
          const serviceUrl =
            environment?.BACKGROUND_REMOVAL_URL ??
            (environment?.VERCEL ? undefined : "http://localhost:7000");
          if (!serviceUrl) {
            console.error("The BACKGROUND_REMOVAL_URL service binding is missing.");
            return Response.json(
              {
                detail:
                  "El servicio de eliminación de fondo no está configurado en este despliegue.",
              },
              { status: 503 },
            );
          }

          const targetUrl = new URL("/api/remove-background", serviceUrl);
          const upstream = await fetch(targetUrl, {
            method: "POST",
            body,
            signal: request.signal,
          });
          const headers = new Headers();
          const contentType = upstream.headers.get("content-type");
          if (contentType) headers.set("content-type", contentType);
          return new Response(upstream.body, { status: upstream.status, headers });
        } catch (error) {
          console.error("Failed to proxy image to background-removal service:", error);
          return Response.json(
            { detail: "El servicio de eliminación de fondo no está disponible." },
            { status: 502 },
          );
        }
      },
    },
  },
});
