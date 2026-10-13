import { Directory, File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { Alert, Linking } from "react-native";
import { apiRequest, filePart, type LocalFile } from "@/lib/api/client";
import { ASSET_ORIGIN, assetUrl } from "@/lib/api/config";
import { ENDPOINTS } from "@/lib/api/endpoints";

type PickOptions = {
  source: "camera" | "library";
  /** Front camera for selfies. */
  front?: boolean;
  /** Show the crop UI; `aspect` applies on Android. */
  edit?: boolean;
  aspect?: [number, number];
};

function permissionAlert(what: string) {
  Alert.alert(`${what} access is off`, `Allow ${what.toLowerCase()} access for Threadflank in Settings to continue.`, [
    { text: "Cancel", style: "cancel" },
    { text: "Open Settings", onPress: () => Linking.openSettings() },
  ]);
}

/** Opens the camera or photo library and returns the chosen image, or null when cancelled. */
export async function pickImage({ source, front = false, edit = false, aspect }: PickOptions): Promise<LocalFile | null> {
  if (source === "camera") {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      permissionAlert("Camera");
      return null;
    }
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: edit,
    aspect,
    quality: 0.9,
    cameraType: front ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
  };
  const result = source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  // The picker re-encodes compressed photos; trust the output file's extension over the original name (e.g. HEIC).
  const uriExt = /\.([a-z0-9]{3,4})(?:\?|$)/i.exec(asset.uri)?.[1]?.toLowerCase();
  const ext = uriExt ?? asset.mimeType?.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : asset.mimeType && !/heic|heif/i.test(asset.mimeType) ? asset.mimeType : "image/jpeg";
  return { uri: asset.uri, name: `photo-${Date.now()}.${ext}`, type };
}

/** Stores a file on the backend and returns its relative path (resolve with `assetUrl`). */
export async function uploadFile(token: string, file: LocalFile, folder = "general") {
  const form = new FormData();
  form.append("imagePath", folder);
  form.append("file", filePart(file));
  const res = await apiRequest<{ url: string }>(ENDPOINTS.uploads, { method: "POST", token, body: form, timeoutMs: 120_000 });
  return res.data.url;
}

/** Our own uploads (backend origin) must be inlined: the AI providers can't reach a LAN/localhost URL. */
export function isOwnAsset(path: string) {
  return !/^https?:/i.test(path) || path.startsWith(ASSET_ORIGIN);
}

let downloads = 0;

/** Downloads a remote image into the cache and returns the local file. */
async function downloadToCache(url: string, ext = "jpg") {
  const dir = new Directory(Paths.cache, "tf-media");
  if (!dir.exists) dir.create({ intermediates: true });
  downloads += 1;
  const target = new File(dir, `dl-${Date.now()}-${downloads}.${ext}`);
  return File.downloadFileAsync(url, target, { idempotent: true });
}

/**
 * Loads an image (resized so its longest side is at most `max`) and returns it as a JPEG
 * data: URI — the format the Drape endpoints accept for our own and local images.
 */
export async function toDataUrl(path: string, max = 1024): Promise<string> {
  if (path.startsWith("data:")) return path;
  const url = assetUrl(path);
  const isRemote = /^https?:/i.test(url);
  const local = isRemote ? await downloadToCache(url) : null;
  try {
    const context = ImageManipulator.manipulate(local ? local.uri : url);
    const probe = await context.renderAsync();
    const scale = Math.min(1, max / Math.max(probe.width, probe.height));
    const image = scale < 1 ? await ImageManipulator.manipulate(local ? local.uri : url).resize({ width: Math.round(probe.width * scale), height: null }).renderAsync() : probe;
    const saved = await image.saveAsync({ base64: true, compress: 0.9, format: SaveFormat.JPEG });
    if (!saved.base64) throw new Error("Couldn't read the image.");
    return `data:image/jpeg;base64,${saved.base64}`;
  } finally {
    try {
      local?.delete();
    } catch {
      // Cache cleanup is best-effort.
    }
  }
}

/** Sends an image the Drape routes can read: own/local images are inlined, public URLs pass through. */
export async function editableImage(path: string, max = 1280) {
  return isOwnAsset(path) ? toDataUrl(path, max) : path;
}

/**
 * Keeps our own copy of a generated image or video (AI provider URLs expire): downloads it and
 * uploads it to the backend. Falls back to the original URL if that fails.
 */
export async function persistMedia(token: string, path: string, folder = "looks", kind: "image" | "video" = "image") {
  if (path.startsWith("/public/") || (path.startsWith(ASSET_ORIGIN) && !path.startsWith("data:"))) return path;
  try {
    const ext = kind === "video" ? "mp4" : "jpg";
    const url = assetUrl(path);
    const local = /^https?:/i.test(url) ? await downloadToCache(url, ext) : null;
    const uri = local ? local.uri : url;
    try {
      return await uploadFile(token, { uri, name: `look-${Date.now()}.${ext}`, type: kind === "video" ? "video/mp4" : "image/jpeg" }, folder);
    } finally {
      try {
        local?.delete();
      } catch {
        // Cache cleanup is best-effort.
      }
    }
  } catch {
    return path;
  }
}

/** Opens the system share sheet with an image or video (downloaded first when remote). */
export async function shareMedia(path: string, mimeType = "image/jpeg") {
  const url = assetUrl(path);
  const ext = mimeType.startsWith("video") ? "mp4" : "jpg";
  const file = /^https?:/i.test(url) ? await downloadToCache(url, ext) : null;
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing isn't available on this device.");
  await Sharing.shareAsync(file ? file.uri : url, { mimeType, dialogTitle: "Share look" });
}
