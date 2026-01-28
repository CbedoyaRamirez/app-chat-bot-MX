import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingSubject = new Subject<boolean>();

  public isRecording$ = this.recordingSubject.asObservable();

  constructor() {}

  /**
   * Inicia la grabación de audio desde el micrófono
   * @returns Promise que resuelve cuando la grabación está lista
   */
  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      });

      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      });

      this.mediaRecorder.start();
      this.recordingSubject.next(true);
      console.log('Grabación de audio iniciada');
    } catch (error) {
      console.error('Error al iniciar la grabación:', error);
      throw new Error('No se pudo acceder al micrófono');
    }
  }

  /**
   * Detiene la grabación de audio
   * @returns Promise que resuelve con el audio en base64
   */
  async stopRecording(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No hay grabación en progreso'));
        return;
      }

      this.mediaRecorder.addEventListener('stop', async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const base64Audio = await this.blobToBase64(audioBlob);

          // Detener todos los tracks del stream
          if (this.mediaRecorder?.stream) {
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
          }

          this.recordingSubject.next(false);
          console.log('Grabación de audio detenida');
          resolve(base64Audio);
        } catch (error) {
          console.error('Error al procesar el audio:', error);
          reject(error);
        }
      });

      this.mediaRecorder.stop();
    });
  }

  /**
   * Cancela la grabación actual sin retornar el audio
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();

      if (this.mediaRecorder.stream) {
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }

      this.audioChunks = [];
      this.recordingSubject.next(false);
      console.log('Grabación cancelada');
    }
  }

  /**
   * Verifica si actualmente se está grabando
   */
  isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
  }

  /**
   * Reproduce audio desde base64
   * @param base64Audio - Audio en formato base64
   * @param audioFormat - Formato del audio (ej: 'audio/mpeg', 'audio/wav')
   */
  async playAudio(base64Audio: string, audioFormat: string = 'audio/mpeg'): Promise<void> {
    try {
      // Convertir base64 a blob
      const audioBlob = this.base64ToBlob(base64Audio, audioFormat);
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);

      return new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };

        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          reject(error);
        };

        audio.play().catch(reject);
      });
    } catch (error) {
      console.error('Error al reproducir el audio:', error);
      throw error;
    }
  }

  /**
   * Convierte un Blob a base64
   * @param blob - Blob a convertir
   * @returns Promise con la cadena base64 (sin el prefijo data:)
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remover el prefijo "data:audio/webm;base64,"
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };

      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convierte base64 a Blob
   * @param base64 - Cadena base64 (sin prefijo)
   * @param contentType - Tipo de contenido del blob
   * @returns Blob creado
   */
  private base64ToBlob(base64: string, contentType: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays: Uint8Array[] = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  }

  /**
   * Verifica si el navegador soporta la grabación de audio
   */
  isAudioRecordingSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
}
