import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadTaskSnapshot,
} from "firebase/storage"
import { storage } from "@/lib/firebase"
import type { Screenshot } from "@/types"

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export interface UploadProgressEvent {
  screenshotId: string
  progress: number
  snapshot: UploadTaskSnapshot
}

export async function uploadScreenshot(
  userId: string,
  tradeIdOrTemp: string,
  file: File,
  onProgress?: (event: UploadProgressEvent) => void
): Promise<Screenshot> {
  const id = generateId()
  const fileExt = file.name.split(".").pop() || "jpg"
  const storagePath = `users/${userId}/trades/${tradeIdOrTemp}/screenshots/${id}.${fileExt}`
  const storageRef = ref(storage, storagePath)

  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type || "image/jpeg",
  })

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress?.({ screenshotId: id, progress, snapshot })
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref)
        resolve({
          id,
          url,
          name: file.name,
          createdAt: new Date().toISOString(),
        })
      }
    )
  })
}

export async function deleteScreenshot(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url)
    await deleteObject(storageRef)
  } catch {
    // Ignore failures for already-deleted or malformed refs
  }
}

export async function uploadScreenshots(
  userId: string,
  tradeIdOrTemp: string,
  files: File[],
  onProgress?: (event: UploadProgressEvent) => void
): Promise<Screenshot[]> {
  return Promise.all(files.map((file) => uploadScreenshot(userId, tradeIdOrTemp, file, onProgress)))
}
