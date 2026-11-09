from contextlib import asynccontextmanager
from io import BytesIO
import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from PIL import Image, ImageOps, UnidentifiedImageError
from rembg import new_session, remove
from starlette.concurrency import run_in_threadpool

MAX_UPLOAD_BYTES = 15 * 1024 * 1024
MAX_IMAGE_PIXELS = 20_000_000
SUPPORTED_FORMATS = {"PNG", "JPEG", "WEBP"}


def crop_to_subject(image: Image.Image) -> Image.Image:
    bounds = image.getchannel("A").getbbox()
    if bounds is None:
        raise HTTPException(status_code=422, detail="No se detectó una prenda en la imagen.")

    left, top, right, bottom = bounds
    padding = max(2, round(max(right - left, bottom - top) * 0.015))
    bounds = (
        max(0, left - padding),
        max(0, top - padding),
        min(image.width, right + padding),
        min(image.height, bottom + padding),
    )
    return image.crop(bounds)


def encode_png(image: Image.Image) -> bytes:
    output_buffer = BytesIO()
    image.save(output_buffer, format="PNG", optimize=True)
    return output_buffer.getvalue()


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.session = await run_in_threadpool(new_session, "u2net")
    yield


app = FastAPI(title="MyCloset background removal", docs_url=None, redoc_url=None, lifespan=lifespan)
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://localhost:8080,http://127.0.0.1:8080,http://localhost:8081,http://127.0.0.1:8081",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/remove-background")
async def remove_background(file: UploadFile = File(...)):
    raw_image = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(raw_image) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="La imagen supera el límite de 15 MB.")

    try:
        with Image.open(BytesIO(raw_image)) as source:
            if source.format not in SUPPORTED_FORMATS:
                raise HTTPException(status_code=415, detail="Formato de imagen no compatible.")
            if source.width * source.height > MAX_IMAGE_PIXELS:
                raise HTTPException(status_code=413, detail="La resolución de la imagen es demasiado alta.")
            image = ImageOps.exif_transpose(source)
            has_transparency = "A" in image.getbands() or "transparency" in image.info
            cutout = image.convert("RGBA")
            if has_transparency and cutout.getchannel("A").getextrema()[0] < 255:
                result = encode_png(crop_to_subject(cutout))
                await file.close()
                return Response(content=result, media_type="image/png")
            image = image.convert("RGB")
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as error:
        raise HTTPException(status_code=400, detail="No se pudo leer la imagen.") from error

    input_buffer = BytesIO()
    image.save(input_buffer, format="PNG")

    try:
        result = await run_in_threadpool(
            remove,
            input_buffer.getvalue(),
            session=app.state.session,
            post_process_mask=True,
        )
        with Image.open(BytesIO(result)) as output:
            cutout = crop_to_subject(output.convert("RGBA"))
            output_bytes = encode_png(cutout)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail="No se pudo eliminar el fondo.") from error
    finally:
        await file.close()

    return Response(content=output_bytes, media_type="image/png")