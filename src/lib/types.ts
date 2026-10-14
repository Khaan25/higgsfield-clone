export type AspectRatio = "1:1" | "4:3" | "3:4" | "16:9" | "9:16";

export interface StyleOption {
  id: string;
  label: string;
  bestFor: string;
  promptSuffix: string;
}

export interface GenerationSettings {
  prompt: string;
  styleId: string;
  aspectRatio: AspectRatio;
  count: number;
}

export interface GeneratedImage {
  id: string;
  src: string;
  width: number;
  height: number;
  seed: number;
}

export interface Generation {
  id: string;
  settings: GenerationSettings;
  images: GeneratedImage[];
  source: "live" | "demo";
  model: string;
  createdAt: string;
  notice?: string;
}

export type GenerateErrorKind = "invalid" | "rate_limited" | "provider_error" | "timeout";

export interface GenerateError {
  kind: GenerateErrorKind;
  message: string;
  retryAfter?: number;
}
