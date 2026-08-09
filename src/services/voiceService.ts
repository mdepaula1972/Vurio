/**
 * Vurio v1.0.0 — Gestor Inteligente de Processos com IA
 * Serviço para entrada de voz nativa no Vurio (Voice First)
 */

export interface VoiceRecognitionResult {

  transcript: string;
  isFinal: boolean;
}

export class VoiceService {
  private recognition: any = null;
  private isListening = false;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'pt-BR';
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public setLanguage(lang: string) {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public startListening(
    onResult: (result: VoiceRecognitionResult) => void,
    onError?: (err: any) => void
  ) {
    if (!this.recognition) {
      if (onError) onError('Reconhecimento de voz não suportado neste navegador.');
      return;
    }

    if (this.isListening) return;

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      onResult({
        transcript: final || interim,
        isFinal: !!final
      });
    };

    this.recognition.onerror = (err: any) => {
      if (onError) onError(err);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.recognition.start();
    this.isListening = true;
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

export const voiceService = new VoiceService();
