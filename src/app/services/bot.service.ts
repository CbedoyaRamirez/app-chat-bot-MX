import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  ChatRequest,
  ChatResponse,
  SpeechToTextRequest,
  SpeechToTextResponse,
  TextToSpeechRequest,
  TextToSpeechResponse
} from '../models/chat.models';

@Injectable({
  providedIn: 'root'
})
export class BotService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Envía un mensaje al bot y obtiene la respuesta
   * @param request - Solicitud del chat con sessionId, botId y mensaje
   * @returns Observable con la respuesta del bot
   */
  sendMessage(request: ChatRequest): Observable<ChatResponse> {
    // Determinar endpoint según el botId
    const endpoint = request.botId === 'faq-bot'
      ? `http://localhost:5119/api/faq/chat`
      : `${this.apiUrl}/chat`;

    return this.http.post<ChatResponse>(endpoint, request)
      .pipe(
        retry(2), // Reintenta hasta 2 veces en caso de error
        catchError(this.handleError)
      );
  }

  /**
   * Convierte audio a texto usando Speech Recognition
   * @param request - Solicitud con audio en base64
   * @returns Observable con el texto transcrito
   */
  speechToText(request: SpeechToTextRequest): Observable<SpeechToTextResponse> {
    return this.http.post<SpeechToTextResponse>(`${this.apiUrl}/speech/stt`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Convierte texto a audio usando Text-to-Speech
   * @param request - Solicitud con el texto a convertir
   * @returns Observable con el audio en base64
   */
  textToSpeech(request: TextToSpeechRequest): Observable<TextToSpeechResponse> {
    return this.http.post<TextToSpeechResponse>(`${this.apiUrl}/speech/tts`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Genera un nuevo ID de sesión único
   * @returns Un ID de sesión único
   */
  generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Maneja errores HTTP
   * @param error - Error HTTP
   * @returns Observable con el error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;

      // Intentar extraer mensaje del backend
      if (error.error && error.error.errorMessage) {
        errorMessage = error.error.errorMessage;
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      }
    }

    console.error('Error en BotService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Verifica el estado de salud del servicio
   * @returns Observable con el estado
   */
  healthCheck(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`)
      .pipe(
        catchError(this.handleError)
      );
  }
}
