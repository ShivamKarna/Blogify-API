type ResponseType = {
  secure_url: string;
  public_id: string;
};
async function uploadToCloudinary(
  file: File,
  cloudName: string,
  uploadPreset: string,
): Promise<{ url: string; publicId: string; type: string }> {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Only images (jpg, png, webp, gif) and PDF files are allowed",
    );
  }

  const MAX_SIZE = 10 * 1024 * 1024;

  if (file.size > MAX_SIZE) {
    throw new Error("File size must be under 10MB");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const folder = file.type.startsWith("image/")
    ? "Blogify/images"
    : "Blogify/pdfs";

  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    { method: "POST", body: formData },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary Upload Failed : ${err}`);
  }
  const data = (await res.json()) as ResponseType;

  return {
    url: data.secure_url,
    publicId: data.public_id,
    type: file.type,
  };
}

export { uploadToCloudinary };
