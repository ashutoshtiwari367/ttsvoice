export interface SynthesizeParams { text: string; lang: string; voice: string; speed: number; pitch?: number; }
export interface TtsProvider {
  name: string;
  synthesize(params: SynthesizeParams): Promise<Buffer>;
}
