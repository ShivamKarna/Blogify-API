import { Context } from "hono";
import { uploadToCloudinary } from "./cloudinary.upload";

class CloudinaryController {
  uploadImage = async (c: Context) => {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return c.json({ success: false, error: "No file provided" }, 400);
    }

    const result = await uploadToCloudinary(
      file,
      c.env.CLOUDINARY_CLOUD_NAME,
      c.env.CLOUDINARY_UPLOAD_PRESET,
    );

    return c.json(
      {
        success: true,
        message: "File uploaded successfully",
        data: result,
      },
      200,
    );
  };
}

export const cloudinaryController = new CloudinaryController();
