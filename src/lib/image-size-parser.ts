import fs from "fs/promises";

interface ImageSize {
  width: number;
  height: number;
}

/**
 * Extracts dimensions (width, height) of JPEG and PNG buffers.
 * Extremely lightweight and does not require native dependencies.
 */
export function parseImageSize(buffer: Buffer): ImageSize | null {
  try {
    // Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      // PNG width is at byte 16, height at byte 20 (Int32BE)
      const width = buffer.readInt32BE(16);
      const height = buffer.readInt32BE(20);
      return { width, height };
    }

    // Check JPEG signature: FF D8
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      let offset = 2;
      while (offset < buffer.length) {
        // Find next marker (starts with FF)
        if (buffer[offset] !== 0xff) {
          offset++;
          continue;
        }

        const marker = buffer[offset + 1];
        // Stop if we hit SOS (Start of Scan) or EOI (End of Image)
        if (marker === 0xda || marker === 0xd9) {
          break;
        }

        // Start of Frame markers: C0, C1, C2, C3, C5, C6, C7, C9, CA, CB, CD, CE, CF
        // These contain the height and width
        const isSOF = (marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf);

        if (isSOF) {
          // SOF structure:
          // offset + 2: segment length (2 bytes)
          // offset + 4: data precision (1 byte)
          // offset + 5: image height (2 bytes)
          // offset + 7: image width (2 bytes)
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }

        // Advance to next segment using length bytes at offset + 2
        const segmentLength = buffer.readUInt16BE(offset + 2);
        offset += 2 + segmentLength;
      }
    }
  } catch (error) {
    console.error("Failed to parse image size:", error);
  }

  return null;
}

/**
 * Helper to parse image file directly.
 */
export async function parseImageFile(filePath: string): Promise<ImageSize> {
  try {
    // Read first 1MB of file (usually more than enough for headers)
    const fileHandle = await fs.open(filePath, "r");
    const buffer = Buffer.alloc(1024 * 1024);
    const { bytesRead } = await fileHandle.read(buffer, 0, buffer.length, 0);
    await fileHandle.close();

    const size = parseImageSize(buffer.subarray(0, bytesRead));
    if (size) return size;
  } catch (error) {
    console.error(`Error reading dimensions of ${filePath}:`, error);
  }

  // Fallback dimension
  return { width: 1200, height: 800 };
}
