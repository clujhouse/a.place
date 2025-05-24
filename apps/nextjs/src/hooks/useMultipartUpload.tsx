import { useMutation, useQueryClient } from "@tanstack/react-query";
import mimeDb from "mime-db";

import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

// import * as Sentry from "@sentry/nextjs";

const CHUNK_SIZE = 5 * 1024 * 1024;

/**
 * Gets the file extension from a MIME type using mime-db
 * @param mimeType The MIME type of the file
 * @returns The extension without the leading dot, or 'bin' as fallback
 */
const getExtensionFromMimeType = (mimeType: string): string => {
  const mime = mimeDb[mimeType];
  if (mime?.extensions && mime.extensions.length > 0) {
    // This ensures we don't get undefined
    return mime.extensions[0]!;
  }

  // Fallback extensions for common video types if mime-db doesn't have them
  const fallbackMap: Record<string, string> = {
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
    "video/x-msvideo": "avi",
    "video/x-matroska": "mkv",
  };

  const fallbackExt = fallbackMap[mimeType];
  return fallbackExt ?? "bin"; // Default to .bin if no extension found
};

export interface UploadState {
  uploaded: number;
  total: number;
  percentage: number;
  error: string | null;
}

export interface CompletedPart {
  ETag: string;
  PartNumber: number;
}

interface MultipartConfig {
  videoId: string;
  onError?: (error: Error) => void;
  onProgress?: (state: UploadState) => void;
  createdAt?: string;
  fileExtension?: string;
}

export const useMultipartUpload = () => {
  const trpc = useTRPC();

  const queryClient = useQueryClient();
  const { mutateAsync: initiateUpload } = useMutation(
    trpc.aws.initiateMultipartUpload.mutationOptions({
      onSuccess: async () => {
        // form.reset();
        // await queryClient.invalidateQueries(trpc.post.pathFilter());
      },
      onError: (err) => {
        toast.error(
          err.data?.code === "UNAUTHORIZED"
            ? "You must be logged in to post"
            : "Failed to create post",
        );
      },
    }),
  );
  const { mutateAsync: completeUpload } = useMutation(
    trpc.aws.completeMultipartUpload.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.video.pathFilter());
      },
    }),
  );

  const uploadPart = async (
    chunk: Blob,
    url: string,
    partNumber: number,
    retries = 3,
  ): Promise<CompletedPart> => {
    try {
      const response = await fetch(url, {
        method: "PUT",
        body: chunk,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const eTag = response.headers.get("etag") ?? response.headers.get("ETag");
      if (!eTag) {
        throw new Error("No ETag received");
      }

      return {
        ETag: eTag.replace(/^"(.*)"$/, "$1"),
        PartNumber: partNumber,
      };
    } catch (err) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return uploadPart(chunk, url, partNumber, retries - 1);
      }
      throw err;
    }
  };

  const uploadFile = async (
    file: File,
    config: MultipartConfig,
  ): Promise<string> => {
    try {
      const initialState: UploadState = {
        uploaded: 0,
        total: file.size,
        percentage: 0,
        error: null,
      };

      config.onProgress?.(initialState);

      // Get file extension with multiple fallbacks
      let fileExtension = config.fileExtension;

      // If not provided in config, try to extract from filename
      if (!fileExtension) {
        fileExtension = file.name.split(".").pop();
      }

      // If still not available, use MIME type to determine
      if (!fileExtension) {
        fileExtension = getExtensionFromMimeType(file.type);
      }

      // If we still don't have a valid extension, show error
      if (!fileExtension || fileExtension.trim() === "") {
        const error = new Error("Cannot determine file extension");
        toast.error("Failed to upload: Cannot determine file type");

        if (config.onError) {
          config.onError(error);
        }

        throw error;
      }

      const chunks = Math.ceil(file.size / CHUNK_SIZE);
      const { uploadId: multipartUploadId, signedUrls } = await initiateUpload({
        videoId: config.videoId,
        contentLength: file.size,
        parts: chunks,
        fileExtension,
      });

      const uploads = signedUrls.map(({ url, partNumber }) => {
        const start = (partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        return uploadPart(chunk, url, partNumber);
      });

      // Track progress of all uploads
      let completedSize = 0;
      const progressPromises = uploads.map(async (promise, index) => {
        await promise;
        completedSize += Math.min(CHUNK_SIZE, file.size - index * CHUNK_SIZE);
        config.onProgress?.({
          uploaded: completedSize,
          total: file.size,
          percentage: Math.round((completedSize / file.size) * 100),
          error: null,
        });
      });

      // Wait for all uploads and progress updates
      const [parts] = await Promise.all([
        Promise.all(uploads),
        Promise.all(progressPromises),
      ]);

      await completeUpload({
        videoId: config.videoId,
        uploadId: multipartUploadId,
        parts,
        fileExtension,
      });

      return config.videoId;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Upload failed");
      const errorMessage = error.message;

      config.onProgress?.({
        uploaded: 0,
        total: file.size,
        percentage: 0,
        error: errorMessage,
      });

      if (config.onError) {
        config.onError(error);
      }

      //   Sentry.captureException(err);
      throw error;
    }
  };

  return {
    uploadFile,
  };
};
