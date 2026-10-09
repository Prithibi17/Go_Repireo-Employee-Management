import * as faceapi from '@vladmandic/face-api';
import { EnrolledFaceAccount } from '@/types';

let modelsLoaded = false;
let modelLoadingPromise: Promise<boolean> | null = null;

export async function loadFaceModels(): Promise<boolean> {
  if (modelsLoaded) return true;
  if (modelLoadingPromise) return modelLoadingPromise;

  modelLoadingPromise = (async () => {
    try {
      const MODEL_URL = '/models/face-api';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      modelsLoaded = true;
      return true;
    } catch (err) {
      console.error('Failed to load face recognition models:', err);
      modelLoadingPromise = null;
      throw err;
    }
  })();

  return modelLoadingPromise;
}

export function areModelsLoaded(): boolean {
  return modelsLoaded;
}

export interface FaceDetectionResult {
  descriptor: number[];
  detectionScore: number;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks: faceapi.FaceLandmarks68;
}

export async function detectFaceDescriptor(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  customOptions?: faceapi.TinyFaceDetectorOptions
): Promise<FaceDetectionResult | null> {
  await loadFaceModels();

  const options =
    customOptions ||
    new faceapi.TinyFaceDetectorOptions({
      inputSize: 224,
      scoreThreshold: 0.35,
    });

  const result = await faceapi
    .detectSingleFace(input, options)
    .withFaceLandmarks(true)
    .withFaceDescriptor();

  if (!result || !result.descriptor) {
    return null;
  }

  return {
    descriptor: Array.from(result.descriptor),
    detectionScore: result.detection.score,
    box: {
      x: result.detection.box.x,
      y: result.detection.box.y,
      width: result.detection.box.width,
      height: result.detection.box.height,
    },
    landmarks: result.landmarks,
  };
}

export function computeEuclideanDistance(desc1: number[], desc2: number[]): number {
  if (!desc1 || !desc2 || desc1.length !== desc2.length) return 1.0;
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function getSimilarityPercentage(distance: number): number {
  // Properly calibrated FaceNet Euclidean distance scale:
  // Distance 0.0 = 100%, Distance 0.15 = ~88%, Distance 0.30 = ~76%, Distance 0.5 = ~55%
  const similarity = Math.max(0, Math.min(100, Math.round((1 - distance * 0.9) * 100)));
  return similarity;
}

export interface MatchResult {
  matchedAccount: EnrolledFaceAccount | null;
  minDistance: number;
  similarityPercent: number;
  isMatch: boolean;
}

export function findBestMatchingAccount(
  candidateDescriptor: number[],
  enrolledAccounts: EnrolledFaceAccount[],
  threshold = 0.52
): MatchResult {
  if (!candidateDescriptor || enrolledAccounts.length === 0) {
    return {
      matchedAccount: null,
      minDistance: 999,
      similarityPercent: 0,
      isMatch: false,
    };
  }

  let bestAccount: EnrolledFaceAccount | null = null;
  let minDistance = 999;

  for (const acc of enrolledAccounts) {
    if (!acc.descriptor || acc.descriptor.length !== 128) continue;
    const dist = computeEuclideanDistance(candidateDescriptor, acc.descriptor);
    if (dist < minDistance) {
      minDistance = dist;
      bestAccount = acc;
    }
  }

  const similarityPercent = getSimilarityPercentage(minDistance);
  const isMatch = Boolean(bestAccount && minDistance <= threshold);

  return {
    matchedAccount: isMatch ? bestAccount : null,
    minDistance,
    similarityPercent,
    isMatch,
  };
}

export function captureFrameThumbnail(
  video: HTMLVideoElement,
  box?: { x: number; y: number; width: number; height: number }
): string {
  try {
    const canvas = document.createElement('canvas');
    const width = 160;
    const height = 160;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    if (box && box.width > 20 && box.height > 20) {
      // Expand bounding box slightly for context
      const pad = Math.min(box.width, box.height) * 0.2;
      const sx = Math.max(0, box.x - pad);
      const sy = Math.max(0, box.y - pad);
      const sWidth = Math.min(video.videoWidth - sx, box.width + pad * 2);
      const sHeight = Math.min(video.videoHeight - sy, box.height + pad * 2);
      ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, width, height);
    } else {
      ctx.drawImage(video, 0, 0, width, height);
    }

    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (err) {
    console.warn('Could not generate frame thumbnail', err);
    return '';
  }
}
