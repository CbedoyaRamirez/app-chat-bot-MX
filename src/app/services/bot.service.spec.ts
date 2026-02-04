import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BotService } from './bot.service';
import { ChatRequest, ChatResponse, SpeechToTextRequest, TextToSpeechRequest } from '../models/chat.models';
import { environment } from '../../environments/environment';

describe('BotService', () => {
  let service: BotService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BotService]
    });
    service = TestBed.inject(BotService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('sendMessage', () => {
    it('should send a message to the FAQ bot and return a response', (done) => {
      const mockRequest: ChatRequest = {
        sessionId: 'session-123',
        botId: 'faq-bot',
        message: 'What is your refund policy?'
      };

      const mockResponse: ChatResponse = {
        sessionId: 'session-123',
        botId: 'faq-bot',
        response: 'Our refund policy allows returns within 30 days.',
        isComplete: false
      };

      service.sendMessage(mockRequest).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.response).toBe('Our refund policy allows returns within 30 days.');
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:5119/api/faq/chat');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });

    it('should send a message to the quote-auto bot and return a response', (done) => {
      const mockRequest: ChatRequest = {
        sessionId: 'session-456',
        botId: 'quote-auto',
        message: 'I need a car insurance quote'
      };

      const mockResponse: ChatResponse = {
        sessionId: 'session-456',
        botId: 'quote-auto',
        response: 'Sure! Let me help you with that.',
        isComplete: false
      };

      service.sendMessage(mockRequest).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/chat`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should retry twice on error before failing', (done) => {
      const mockRequest: ChatRequest = {
        sessionId: 'session-error',
        botId: 'faq-bot',
        message: 'Test error'
      };

      service.sendMessage(mockRequest).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      // First attempt + 2 retries = 3 total requests
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne('http://localhost:5119/api/faq/chat');
        req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      }
    });

    it('should handle client-side errors', (done) => {
      const mockRequest: ChatRequest = {
        sessionId: 'session-client-error',
        botId: 'faq-bot',
        message: 'Test client error'
      };

      service.sendMessage(mockRequest).subscribe({
        error: (error) => {
          expect(error.message).toContain('Error');
          done();
        }
      });

      // Esperar las 3 peticiones (1 inicial + 2 reintentos)
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne('http://localhost:5119/api/faq/chat');
        req.error(new ProgressEvent('Network error'), {
          status: 0,
          statusText: 'Unknown Error'
        });
      }
    });
  });

  describe('speechToText', () => {
    it('should convert audio to text successfully', (done) => {
      const mockRequest: SpeechToTextRequest = {
        audioBase64: 'base64encodedaudio',
        audioFormat: 'webm',
        language: 'es-MX'
      };

      const mockResponse = {
        text: 'Hola, necesito ayuda',
        success: true,
        confidence: 0.95
      };

      service.speechToText(mockRequest).subscribe({
        next: (response) => {
          expect(response.text).toBe('Hola, necesito ayuda');
          expect(response.success).toBe(true);
          expect(response.confidence).toBe(0.95);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/speech/stt`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });

    it('should handle speech to text errors', (done) => {
      const mockRequest: SpeechToTextRequest = {
        audioBase64: 'invalidaudio',
        audioFormat: 'webm'
      };

      service.speechToText(mockRequest).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/speech/stt`);
      req.flush('Processing error', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('textToSpeech', () => {
    it('should convert text to audio successfully', (done) => {
      const mockRequest: TextToSpeechRequest = {
        text: 'Hola, ¿cómo estás?',
        language: 'es-MX',
        voice: 'es-MX-DaliaNeural'
      };

      const mockResponse = {
        audioBase64: 'base64encodedaudio',
        audioFormat: 'audio/mpeg',
        success: true,
        audioSizeBytes: 12345,
        durationSeconds: 2.5
      };

      service.textToSpeech(mockRequest).subscribe({
        next: (response) => {
          expect(response.audioBase64).toBe('base64encodedaudio');
          expect(response.success).toBe(true);
          expect(response.audioSizeBytes).toBe(12345);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/speech/tts`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });

    it('should handle text to speech errors', (done) => {
      const mockRequest: TextToSpeechRequest = {
        text: ''
      };

      service.textToSpeech(mockRequest).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/speech/tts`);
      req.flush('Invalid text', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('generateSessionId', () => {
    it('should generate a unique session ID', () => {
      const sessionId1 = service.generateSessionId();
      const sessionId2 = service.generateSessionId();

      expect(sessionId1).toBeTruthy();
      expect(sessionId2).toBeTruthy();
      expect(sessionId1).not.toBe(sessionId2);
      expect(sessionId1).toMatch(/^session-\d+-[a-z0-9]{9}$/);
    });

    it('should generate session IDs with the correct format', () => {
      const sessionId = service.generateSessionId();
      expect(sessionId).toMatch(/^session-/);
      expect(sessionId.split('-').length).toBe(3);
    });
  });

  describe('healthCheck', () => {
    it('should check the health of the service', (done) => {
      const mockHealth = { status: 'OK', timestamp: Date.now() };

      service.healthCheck().subscribe({
        next: (response) => {
          expect(response.status).toBe('OK');
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/health`);
      expect(req.request.method).toBe('GET');
      req.flush(mockHealth);
    });

    it('should handle health check errors', (done) => {
      service.healthCheck().subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/health`);
      req.flush('Service unavailable', { status: 503, statusText: 'Service Unavailable' });
    });
  });
});
