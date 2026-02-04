import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AppComponent } from './app.component';
import { BotService } from './services/bot.service';
import { AudioService } from './services/audio.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { BotType, ChatResponse } from './models/chat.models';
import { CommonModule } from '@angular/common';

describe('AppComponent', () => {
  const mockBotService = {
    generateSessionId: jest.fn().mockReturnValue('session-test-123'),
    sendMessage: jest.fn(),
    speechToText: jest.fn(),
    textToSpeech: jest.fn(),
    healthCheck: jest.fn()
  };

  const mockIsRecording$ = new BehaviorSubject<boolean>(false);
  const mockAudioService = {
    isRecording$: mockIsRecording$,
    isAudioRecordingSupported: jest.fn().mockReturnValue(true),
    startRecording: jest.fn().mockResolvedValue(undefined),
    stopRecording: jest.fn().mockResolvedValue('base64audio'),
    playAudio: jest.fn().mockResolvedValue(undefined)
  };

  describe('Component Initialization', () => {
    it('should create the app component', async () => {
      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      expect(app).toBeTruthy();
    });

    it('should initialize with default bot (QUOTE_AUTO)', async () => {
      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      expect(app.currentBotType).toBe(BotType.QUOTE_AUTO);
      expect(app.title).toBe('Chubb Bot - Cotización Auto');
    });

    it('should generate a session ID on initialization', async () => {
      await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      expect(mockBotService.generateSessionId).toHaveBeenCalled();
    });

    it('should initialize with welcome message', async () => {
      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      expect(app.messages.length).toBe(1);
      expect(app.messages[0].fromUser).toBe(false);
      expect(app.messages[0].message).toContain('cotización de seguros de auto');
    });

    it('should have timestamps enabled', async () => {
      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      expect(app.enableTimeStamp).toBe(true);
    });
  });

  describe('Bot Switching', () => {
    it('should switch to FAQ bot', async () => {
      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      app.switchBot(BotType.FAQ);

      expect(app.currentBotType).toBe(BotType.FAQ);
      expect(app.title).toBe('Chubb Bot - Preguntas Frecuentes');
      expect(app.isChatOpen).toBe(true);
    });

    it('should reset messages when switching bots', async () => {
      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;

      // Add some messages
      app.messages = [
        { message: 'Test', messageType: 'text', fromUser: true, timestamp: new Date() },
        { message: 'Response', messageType: 'text', fromUser: false, timestamp: new Date() }
      ];

      app.switchBot(BotType.FAQ);

      expect(app.messages.length).toBe(1);
      expect(app.messages[0].fromUser).toBe(false);
      expect(app.messages[0].message).toContain('preguntas frecuentes');
    });

    it('should generate new session ID when switching bots', async () => {
      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      mockBotService.generateSessionId.mockClear();

      app.switchBot(BotType.FAQ);

      expect(mockBotService.generateSessionId).toHaveBeenCalled();
    });
  });

  describe('Message Handling', () => {
    it('should send user message to bot service', async () => {
      const mockResponse: ChatResponse = {
        sessionId: 'session-test-123',
        botId: 'quote-auto',
        response: 'Claro, ¿qué tipo de vehículo tienes?',
        isComplete: false
      };

      mockBotService.sendMessage.mockReturnValue(of(mockResponse));

      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;

      const userMessageEvent = {
        userMessage: 'Necesito cotizar un seguro',
        messages: [...app.messages]
      };

      app.onHandleMessage(userMessageEvent);

      expect(mockBotService.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: expect.any(String),
          botId: 'quote-auto',
          message: 'Necesito cotizar un seguro'
        })
      );
    });

    it('should add bot response to messages', async () => {
      const mockResponse: ChatResponse = {
        sessionId: 'session-test-123',
        botId: 'quote-auto',
        response: 'Claro, ¿qué tipo de vehículo tienes?',
        isComplete: false
      };

      mockBotService.sendMessage.mockReturnValue(of(mockResponse));

      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      const initialMessageCount = app.messages.length;

      const userMessageEvent = {
        userMessage: 'Necesito cotizar un seguro',
        messages: [...app.messages]
      };

      app.onHandleMessage(userMessageEvent);

      await waitFor(() => {
        expect(userMessageEvent.messages.length).toBe(initialMessageCount + 1);
        expect(userMessageEvent.messages[userMessageEvent.messages.length - 1].message).toBe('Claro, ¿qué tipo de vehículo tienes?');
      });
    });

    it('should set isTyping to true while waiting for response', async () => {
      const mockResponse: ChatResponse = {
        sessionId: 'session-test-123',
        botId: 'quote-auto',
        response: 'Respuesta del bot',
        isComplete: false
      };

      mockBotService.sendMessage.mockReturnValue(of(mockResponse));

      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;

      const userMessageEvent = {
        userMessage: 'Test message',
        messages: [...app.messages]
      };

      expect(app.isTyping).toBe(false);

      app.onHandleMessage(userMessageEvent);

      // Wait for async operation to complete
      await waitFor(() => {
        expect(app.isTyping).toBe(false); // After response, should be back to false
      });
    });

    it('should handle error when sending message fails', async () => {
      mockBotService.sendMessage.mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;

      const userMessageEvent = {
        userMessage: 'Test message',
        messages: [...app.messages]
      };

      app.onHandleMessage(userMessageEvent);

      await waitFor(() => {
        expect(app.errorState).toBe(true);
        expect(app.isTyping).toBe(false);
        const lastMessage = userMessageEvent.messages[userMessageEvent.messages.length - 1];
        expect(lastMessage.errorState).toBe(true);
      });
    });

    it('should add sources message for FAQ bot', async () => {
      const mockResponse: ChatResponse = {
        sessionId: 'session-test-123',
        botId: 'faq-bot',
        response: 'Información sobre pólizas',
        isComplete: false,
        metadata: {
          sources: ['documento1.pdf', 'documento2.pdf']
        }
      };

      mockBotService.sendMessage.mockReturnValue(of(mockResponse));

      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      app.switchBot(BotType.FAQ);

      const userMessageEvent = {
        userMessage: '¿Qué es una póliza?',
        messages: [...app.messages]
      };

      app.onHandleMessage(userMessageEvent);

      await waitFor(() => {
        const messages = userMessageEvent.messages;
        const sourcesMessage = messages.find(m => m.message.includes('Fuentes consultadas'));
        expect(sourcesMessage).toBeTruthy();
        expect(sourcesMessage?.message).toContain('documento1.pdf');
      });
    });
  });

  describe('Microphone Functionality', () => {
    it('should start recording when microphone button is clicked and not recording', async () => {
      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      await app.onHandleMicrophone();

      expect(mockAudioService.startRecording).toHaveBeenCalled();
    });

    it('should stop recording and transcribe when microphone button is clicked while recording', async () => {
      mockIsRecording$.next(true);

      const mockSttResponse = {
        text: 'Texto transcrito',
        success: true,
        confidence: 0.95
      };

      mockAudioService.stopRecording.mockResolvedValue('base64audio');
      mockBotService.speechToText.mockReturnValue(of(mockSttResponse));
      mockBotService.sendMessage.mockReturnValue(of({
        sessionId: 'session-test-123',
        botId: 'quote-auto',
        response: 'Respuesta del bot',
        isComplete: false
      }));

      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      app.isRecording = true;

      await app.onHandleMicrophone();

      expect(mockAudioService.stopRecording).toHaveBeenCalled();

      await waitFor(() => {
        expect(mockBotService.speechToText).toHaveBeenCalledWith(
          expect.objectContaining({
            audioBase64: 'base64audio',
            audioFormat: 'webm',
            language: 'es-MX'
          })
        );
      });
    });

    it('should handle error when audio recording is not supported', async () => {
      mockAudioService.isAudioRecordingSupported.mockReturnValue(false);
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      await app.onHandleMicrophone();

      expect(alertSpy).toHaveBeenCalledWith('Tu navegador no soporta la grabación de audio');
      alertSpy.mockRestore();
    });
  });

  describe('Chat Controls', () => {
    it('should toggle chat visibility', async () => {
      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      expect(app.isChatOpen).toBe(false);

      app.toggleChat();
      expect(app.isChatOpen).toBe(true);

      app.toggleChat();
      expect(app.isChatOpen).toBe(false);
    });

    it('should minimize chat and keep messages', async () => {
      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      app.isChatOpen = true;
      const testMessages = [
        { message: 'Test', messageType: 'text' as const, fromUser: true, timestamp: new Date() }
      ];

      app.onMinimizeChat(testMessages);

      expect(app.isChatOpen).toBe(false);
      expect(app.messages).toEqual(testMessages);
    });

    it('should close chat and reset messages', async () => {
      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      app.isChatOpen = true;
      app.messages = [
        { message: 'Test', messageType: 'text', fromUser: true, timestamp: new Date() }
      ];

      mockBotService.generateSessionId.mockClear();
      app.onCloseChat([]);

      expect(app.isChatOpen).toBe(false);
      expect(app.messages).toEqual([]);
      expect(mockBotService.generateSessionId).toHaveBeenCalled();
    });
  });

  describe('Bot Configuration', () => {
    it('should have correct configuration for QUOTE_AUTO bot', async () => {
      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      const config = app.botConfigs[BotType.QUOTE_AUTO];

      expect(config.botId).toBe(BotType.QUOTE_AUTO);
      expect(config.title).toBe('Chubb Bot - Cotización Auto');
      expect(config.welcomeMessage).toContain('cotización de seguros de auto');
      expect(config.theme).toBe('purple');
    });

    it('should have correct configuration for FAQ bot', async () => {
      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      const config = app.botConfigs[BotType.FAQ];

      expect(config.botId).toBe(BotType.FAQ);
      expect(config.title).toBe('Chubb Bot - Preguntas Frecuentes');
      expect(config.welcomeMessage).toContain('preguntas frecuentes');
      expect(config.theme).toBe('blue');
    });
  });

  describe('Inactivity Timeout', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should start inactivity timer when chat opens', async () => {
      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      app.toggleChat();

      expect(app.isChatOpen).toBe(true);
      // Verificar que los timers se iniciaron (no null)
      expect((app as any).warningTimer).toBeTruthy();
      expect((app as any).inactivityTimer).toBeTruthy();
    });

    it('should show warning after configured warning time', async () => {
      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      app.toggleChat();

      expect(app.showInactivityWarning).toBe(false);

      // Avanzar al tiempo de advertencia (1 minuto actualmente)
      const warningTime = (app as any).INACTIVITY_WARNING_TIME;
      jest.advanceTimersByTime(warningTime);

      expect(app.showInactivityWarning).toBe(true);
      expect(app.inactivityCountdown).toBeGreaterThan(0);
    });

    it('should close chat after configured timeout', async () => {
      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      app.toggleChat();

      expect(app.isChatOpen).toBe(true);

      // Avanzar al tiempo de timeout (2 minutos actualmente)
      const timeoutTime = (app as any).INACTIVITY_TIMEOUT;
      jest.advanceTimersByTime(timeoutTime);

      // El chat debería estar cerrado (o cerrándose)
      expect(app.showInactivityWarning).toBe(true);

      // Avanzar el delay adicional de cierre
      jest.advanceTimersByTime(2000);

      expect(app.isChatOpen).toBe(false);
      expect(app.messages.length).toBe(0);
    });

    it('should reset timer when user sends a message', async () => {
      mockBotService.sendMessage.mockReturnValue(of({
        sessionId: 'session-test-123',
        botId: 'quote-auto',
        response: 'Respuesta',
        isComplete: false
      }));

      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      app.toggleChat();

      const warningTime = (app as any).INACTIVITY_WARNING_TIME;
      const halfWarningTime = warningTime / 2;

      // Avanzar la mitad del tiempo de advertencia
      jest.advanceTimersByTime(halfWarningTime);

      // Usuario envía un mensaje
      const userMessageEvent = {
        userMessage: 'Hello',
        messages: [...app.messages]
      };
      app.onHandleMessage(userMessageEvent);

      // El timer debería haberse reseteado
      // Avanzar otra vez la mitad del tiempo (tiempo total = warningTime, pero reseteó)
      jest.advanceTimersByTime(halfWarningTime);

      // No debería mostrar advertencia aún (solo ha pasado la mitad del tiempo desde el reset)
      expect(app.showInactivityWarning).toBe(false);
    });

    it('should keep chat active when user clicks continue button', async () => {
      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      app.toggleChat();

      const warningTime = (app as any).INACTIVITY_WARNING_TIME;

      // Avanzar al tiempo de advertencia para mostrar el modal
      jest.advanceTimersByTime(warningTime);

      expect(app.showInactivityWarning).toBe(true);

      // Usuario hace clic en continuar
      app.keepChatActive();

      expect(app.showInactivityWarning).toBe(false);
      expect(app.isChatOpen).toBe(true);
    });

    it('should clear timers when chat is minimized', async () => {
      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      app.toggleChat();

      const testMessages = [
        { message: 'Test', messageType: 'text' as const, fromUser: true, timestamp: new Date() }
      ];

      app.onMinimizeChat(testMessages);

      expect((app as any).warningTimer).toBeNull();
      expect((app as any).inactivityTimer).toBeNull();
      expect(app.showInactivityWarning).toBe(false);
    });

    it('should clear timers when chat is closed', async () => {
      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      app.toggleChat();

      app.onCloseChat([]);

      expect((app as any).warningTimer).toBeNull();
      expect((app as any).inactivityTimer).toBeNull();
      expect(app.showInactivityWarning).toBe(false);
    });

    it('should update countdown every second', async () => {
      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      app.toggleChat();

      const warningTime = (app as any).INACTIVITY_WARNING_TIME;

      // Avanzar al tiempo de advertencia para mostrar el modal
      jest.advanceTimersByTime(warningTime);

      const initialCountdown = app.inactivityCountdown;
      expect(initialCountdown).toBeGreaterThan(0);

      // Avanzar 5 segundos
      jest.advanceTimersByTime(5000);

      expect(app.inactivityCountdown).toBe(initialCountdown - 5);
    });

    it('should clear all timers on component destroy', async () => {
      const { fixture } = await render(AppComponent, {
        imports: [CommonModule, HttpClientTestingModule],
        providers: [
          { provide: BotService, useValue: mockBotService },
          { provide: AudioService, useValue: mockAudioService }
        ]
      });

      const app = fixture.componentInstance;
      app.toggleChat();

      // Destruir el componente
      app.ngOnDestroy();

      expect((app as any).warningTimer).toBeNull();
      expect((app as any).inactivityTimer).toBeNull();
      expect((app as any).countdownInterval).toBeNull();
    });
  });
});
