import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";

export interface CompareOptions {
  baselinePath: string;
  currentPath: string;
  outputDir: string;
  threshold: number;
}

export interface CompareResult {
  baselinePath: string;
  currentPath: string;
  diffPath: string;
  diffPercentage: number;
  totalPixels: number;
  changedPixels: number;
  isRegression: boolean;
  dimensions: {
    baseline: { width: number; height: number };
    current: { width: number; height: number };
    sizeChanged: boolean;
  };
}

export async function compareScreenshots(options: CompareOptions): Promise<CompareResult> {
  await mkdir(options.outputDir, { recursive: true });

  const baselineImg = await loadImage(options.baselinePath);
  const currentImg = await loadImage(options.currentPath);

  const sizeChanged =
    baselineImg.width !== currentImg.width || baselineImg.height !== currentImg.height;

  // Use the larger dimensions for comparison canvas
  const width = Math.max(baselineImg.width, currentImg.width);
  const height = Math.max(baselineImg.height, currentImg.height);

  // Draw baseline
  const baselineCanvas = createCanvas(width, height);
  const baselineCtx = baselineCanvas.getContext("2d");
  baselineCtx.drawImage(baselineImg, 0, 0);
  const baselineData = baselineCtx.getImageData(0, 0, width, height);

  // Draw current
  const currentCanvas = createCanvas(width, height);
  const currentCtx = currentCanvas.getContext("2d");
  currentCtx.drawImage(currentImg, 0, 0);
  const currentData = currentCtx.getImageData(0, 0, width, height);

  // Create diff canvas
  const diffCanvas = createCanvas(width, height);
  const diffCtx = diffCanvas.getContext("2d");
  const diffData = diffCtx.createImageData(width, height);

  let changedPixels = 0;
  const totalPixels = width * height;

  for (let i = 0; i < baselineData.data.length; i += 4) {
    const rDiff = Math.abs(baselineData.data[i] - currentData.data[i]);
    const gDiff = Math.abs(baselineData.data[i + 1] - currentData.data[i + 1]);
    const bDiff = Math.abs(baselineData.data[i + 2] - currentData.data[i + 2]);

    const pixelDiff = (rDiff + gDiff + bDiff) / (3 * 255);

    if (pixelDiff > 0.05) {
      // Mark changed pixels in red
      diffData.data[i] = 255;     // R
      diffData.data[i + 1] = 0;   // G
      diffData.data[i + 2] = 0;   // B
      diffData.data[i + 3] = 200; // A
      changedPixels++;
    } else {
      // Dim unchanged pixels
      diffData.data[i] = currentData.data[i];
      diffData.data[i + 1] = currentData.data[i + 1];
      diffData.data[i + 2] = currentData.data[i + 2];
      diffData.data[i + 3] = 60;
    }
  }

  diffCtx.putImageData(diffData, 0, 0);

  const diffPercentage = changedPixels / totalPixels;
  const diffFilename = `diff-${basename(options.currentPath)}`;
  const diffPath = join(options.outputDir, diffFilename);

  const diffBuffer = diffCanvas.toBuffer("image/png");
  await writeFile(diffPath, diffBuffer);

  return {
    baselinePath: options.baselinePath,
    currentPath: options.currentPath,
    diffPath,
    diffPercentage,
    totalPixels,
    changedPixels,
    isRegression: diffPercentage > options.threshold,
    dimensions: {
      baseline: { width: baselineImg.width, height: baselineImg.height },
      current: { width: currentImg.width, height: currentImg.height },
      sizeChanged,
    },
  };
}

export async function imageToBase64(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  return buffer.toString("base64");
}
