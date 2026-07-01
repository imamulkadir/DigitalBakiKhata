import { File } from 'expo-file-system';
import { supabase } from '../lib/supabase';

// fetch(localUri).blob() throws "Network request failed" for local file URIs
// on React Native — fetch's blob handling doesn't cover the local file
// scheme the same way it does on web. Reading the file directly with
// expo-file-system and uploading the raw bytes avoids that fetch layer.
export async function uploadFile(
  uri: string,
  bucket: string,
  path: string,
  contentType: string
): Promise<string> {
  const file = new File(uri);
  const arrayBuffer = await file.arrayBuffer();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, { upsert: true, contentType });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}
