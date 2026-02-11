import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface UploadResult {
  url: string | null;
  error: string | null;
}

/**
 * Uploads a file to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name
 * @param folder - Optional folder path within the bucket
 * @param userId - User ID for organizing files
 * @returns Upload result with URL or error
 */
export async function uploadFile(
  file: File,
  bucket: string,
  folder: string = "",
  userId: string
): Promise<UploadResult> {
  try {
    // Validate file size (max 50MB for documents, 10MB for images)
    const isDocument = bucket === "company-documents";
    const maxSize = isDocument ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for documents, 10MB for images
    if (file.size > maxSize) {
      return {
        url: null,
        error: `File size exceeds ${isDocument ? "50MB" : "10MB"} limit`,
      };
    }

    // Validate file type based on bucket
    if (bucket === "company-documents") {
      const documentTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/plain",
      ];
      if (!documentTypes.includes(file.type)) {
        return {
          url: null,
          error: "Invalid file type. Please upload PDF, DOCX, or TXT",
        };
      }
    } else {
      // For other buckets (avatars, kyc-documents), use original validation
      const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      const documentTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];
      const allowedTypes = [...new Set([...imageTypes, ...documentTypes])];
      if (!allowedTypes.includes(file.type)) {
        return {
          url: null,
          error: "Invalid file type. Please upload an image (JPEG, PNG, WebP) or PDF",
        };
      }
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${folder ? `${folder}/` : ""}${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return {
        url: null,
        error: error.message || "Failed to upload file",
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return {
      url: urlData.publicUrl,
      error: null,
    };
  } catch (error: any) {
    return {
      url: null,
      error: error.message || "An unexpected error occurred",
    };
  }
}

/**
 * Deletes a file from Supabase Storage
 * @param bucket - The storage bucket name
 * @param filePath - The path to the file to delete
 */
export async function deleteFile(
  bucket: string,
  filePath: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to delete file",
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

/**
 * Extracts file path from Supabase storage URL
 */
export function extractFilePathFromUrl(url: string, bucket: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split(`/${bucket}/`);
    if (pathParts.length > 1) {
      return pathParts[1];
    }
    return null;
  } catch {
    return null;
  }
}
