import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';

const MAX_BYTES = 30 * 1024;
const WIDTHS = [400, 320, 240, 180, 130];
const QUALITIES = [0.5, 0.35, 0.2, 0.1];

async function renderAt(uri: string, width: number, quality: number) {
  const context = ImageManipulator.manipulate(uri).resize({ width });
  const image = await context.renderAsync();
  return image.saveAsync({ compress: quality, format: SaveFormat.JPEG });
}

// Images (customer photos, owner avatars) must stay under 30KB with a max
// 400x400 footprint — capture resolutions vary wildly across devices, so
// dimension + quality are stepped down together until the file fits.
export async function compressImage(uri: string): Promise<string> {
  let lastUri = uri;
  for (const width of WIDTHS) {
    for (const quality of QUALITIES) {
      const result = await renderAt(uri, width, quality);
      lastUri = result.uri;
      if (new File(result.uri).size <= MAX_BYTES) return result.uri;
    }
  }
  return lastUri;
}
