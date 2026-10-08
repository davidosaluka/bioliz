"use client";

import { useCallback, useState } from "react";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, GripVertical } from "lucide-react";
import { toast } from "sonner";

export function ImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);
      const uploadedUrls: string[] = [];

      try {
        for (const file of Array.from(files)) {
          const ext = file.name.split(".").pop()?.toLowerCase();
          if (!ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXTENSIONS.includes(ext ?? "")) {
            toast.error(`${file.name} is not a supported image type`);
            continue;
          }

          const compressed = await imageCompression(file, {
            maxWidthOrHeight: 1600,
            maxSizeMB: 0.5,
            useWebWorker: true,
            fileType: file.type,
          });

          const safeExt = ALLOWED_EXTENSIONS.includes(ext ?? "") ? ext : "jpg";
          const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 10)}.${safeExt}`;

          const { data, error } = await supabase.storage
            .from("product-images")
            .upload(fileName, compressed);

          if (error) {
            toast.error(`Upload failed: ${error.message}`);
            continue;
          }

          const { data: publicUrlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(data.path);

          uploadedUrls.push(publicUrlData.publicUrl);
        }

        if (uploadedUrls.length > 0) {
          onChange([...images, ...uploadedUrls]);
        }
      } catch (err) {
        toast.error("Failed to upload images");
      } finally {
        setUploading(false);
      }
    },
    [images, onChange, supabase]
  );

  async function removeImage(index: number) {
    const url = images[index];
    if (url) {
      try {
        const path = url.split("/product-images/")[1]?.split("?")[0];
        if (path) {
          await supabase.storage.from("product-images").remove([decodeURIComponent(path)]);
        }
      } catch {
        // Best-effort cleanup; don't block the UI if storage delete fails.
      }
    }
    onChange(images.filter((_, i) => i !== index));
  }

  function moveImage(index: number, direction: "up" | "down") {
    const newImages = [...images];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    [newImages[index], newImages[targetIndex]] = [
      newImages[targetIndex],
      newImages[index],
    ];
    onChange(newImages);
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="images">Product Images</Label>
      <div className="flex items-center gap-3">
        <Input
          id="images"
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          disabled={uploading}
          className="cursor-pointer"
        />
        {uploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
      </div>
      <p className="text-xs text-muted-foreground">
        Images are compressed to ~500 KB before upload. Maximum 1 MB per file.
      </p>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border/50 bg-muted"
            >
              <img
                src={url}
                alt={`Product image ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 top-0 flex justify-between p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveImage(index, "up")}
                    disabled={index === 0}
                  >
                    <GripVertical className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
