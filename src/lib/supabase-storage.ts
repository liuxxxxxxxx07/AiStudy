"use client";

import { getSupabase, isSupabaseConfigured } from "./supabase";

const BUCKET_NAME = "user-files";

export function isStorageConfigured(): boolean {
  return isSupabaseConfigured();
}

export async function uploadFile(
  file: File,
  userId: string,
  folder: string = "uploads"
): Promise<string | null> {
  if (!isStorageConfigured()) return null;

  const sb = getSupabase();
  if (!sb) return null;

  const filePath = `${userId}/${folder}/${Date.now()}_${file.name}`;

  const { error } = await sb.storage.from(BUCKET_NAME).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    console.error("[supabase-storage] Upload failed:", error.message);
    return null;
  }

  const { data } = sb.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function deleteFile(filePath: string): Promise<boolean> {
  if (!isStorageConfigured()) return false;

  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb.storage.from(BUCKET_NAME).remove([filePath]);
  if (error) {
    console.error("[supabase-storage] Delete failed:", error.message);
    return false;
  }
  return true;
}

export async function listFiles(
  userId: string,
  folder: string = "uploads"
): Promise<{ name: string; url: string }[]> {
  if (!isStorageConfigured()) return [];

  const sb = getSupabase();
  if (!sb) return [];

  const prefix = `${userId}/${folder}`;
  const { data, error } = await sb.storage.from(BUCKET_NAME).list(prefix);

  if (error) {
    console.error("[supabase-storage] List failed:", error.message);
    return [];
  }

  return (data || []).map((file) => ({
    name: file.name,
    url: sb.storage.from(BUCKET_NAME).getPublicUrl(`${prefix}/${file.name}`).data.publicUrl,
  }));
}