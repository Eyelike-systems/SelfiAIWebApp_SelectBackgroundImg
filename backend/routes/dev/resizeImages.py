from PIL import Image
import os

# Folders
input_folder = "input_images"
output_folder = "output_images"

# Create output folder if it doesn't exist
os.makedirs(output_folder, exist_ok=True)

# Target dimensions
target_width = 1000
target_height = 560

def resize_and_crop_force(input_path, output_path):
    img = Image.open(input_path)
    original_width, original_height = img.size
    target_ratio = target_width / target_height
    original_ratio = original_width / original_height

    # Resize while keeping aspect ratio
    if original_ratio > target_ratio:
        # Image is wider than target: height fixed
        new_height = target_height
        new_width = round(target_height * original_ratio)
    else:
        # Image is taller than target: width fixed
        new_width = target_width
        new_height = round(target_width / original_ratio)

    # Resize image (can upscale if image is smaller)
    img_resized = img.resize((new_width, new_height), Image.LANCZOS)

    # Crop or center to exact target size
    left = max((new_width - target_width) // 2, 0)
    top = max((new_height - target_height) // 2, 0)
    right = left + target_width
    bottom = top + target_height

    img_cropped = img_resized.crop((left, top, right, bottom))

    # Save to output folder
    img_cropped.save(output_path)
    print(f"Saved: {output_path}")

# Process all images in the input folder
for filename in os.listdir(input_folder):
    if filename.lower().endswith((".jpg", ".jpeg", ".png")):
        input_path = os.path.join(input_folder, filename)
        output_path = os.path.join(output_folder, filename)
        resize_and_crop_force(input_path, output_path)
