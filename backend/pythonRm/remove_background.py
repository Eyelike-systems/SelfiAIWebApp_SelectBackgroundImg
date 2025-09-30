import base64
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rembg import remove
from PIL import Image
from io import BytesIO
import numpy as np
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

class ImageData(BaseModel):
    image_base64: str

@app.post("/api/processImage")
async def process_image(data: ImageData):
    try:
        # Fix base64 padding
        image_base64 = data.image_base64.strip()
        if len(image_base64) % 4:
            image_base64 += '=' * (4 - len(image_base64) % 4)

        image_data = base64.b64decode(image_base64)

        # Remove background
        removed = remove(image_data)

        # Open image and crop empty transparent space
        image = Image.open(BytesIO(removed)).convert("RGBA")

        # --- Trim transparent edges in Python ---
        def crop_empty_edges(image: Image.Image) -> Image.Image:
            np_img = np.array(image)
            alpha = np_img[:, :, 3]
            non_empty_rows = np.where(alpha > 10)
            if non_empty_rows[0].size == 0:
                return image
            top = np.min(non_empty_rows[0])
            bottom = np.max(non_empty_rows[0])
            left = np.min(non_empty_rows[1])
            right = np.max(non_empty_rows[1])
            return image.crop((left, top, right + 1, bottom + 1))

        trimmed = crop_empty_edges(image)

        # Optionally: resize here in Python if you want
        # For example, scale width to max 400px but keep aspect ratio
        max_width = 400
        if trimmed.width > max_width:
            scale = max_width / trimmed.width
            new_width = int(trimmed.width * scale)
            new_height = int(trimmed.height * scale)
            trimmed = trimmed.resize((new_width, new_height), Image.LANCZOS)

        # Encode result to base64
        output_buffer = BytesIO()
        trimmed.save(output_buffer, format="PNG")
        result_base64 = base64.b64encode(output_buffer.getvalue()).decode("utf-8")

        return {"image": result_base64}

    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
