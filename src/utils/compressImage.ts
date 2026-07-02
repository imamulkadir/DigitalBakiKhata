import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.6;

export async function compressImage(uri: string): Promise<string> {
  const context = ImageManipulator.manipulate(uri).resize({ width: MAX_DIMENSION });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
  return result.uri;
}
