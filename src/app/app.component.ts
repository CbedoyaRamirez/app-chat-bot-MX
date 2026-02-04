import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ResizableModule } from 'angular-resizable-element';

import { BotService } from './services/bot.service';
import { AudioService } from './services/audio.service';
import {
  Message,
  UserMessageEvent,
  ModalConfig,
  ChatRequest,
  SpeechToTextRequest,
  TextToSpeechRequest,
  BotType,
  BotConfig
} from './models/chat.models';
import { ChatTriggerComponent } from './components/chat-trigger.component';
import { ChatWindowComponent } from './components/chat-window.component';

// Enum para los temas de color
export enum CbColorTheme {
  PURPLE = 'purple',
  BLUE = 'blue',
  GREEN = 'green'
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    ChatTriggerComponent,
    ChatWindowComponent,
    ResizableModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  // Expose BotType enum to template
  readonly BotType = BotType;

  // Configuración de timeout de inactividad
  private readonly INACTIVITY_WARNING_TIME = 1 * 60 * 1000; // 1 minuto - Muestra advertencia
  private readonly INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutos - Cierra el chat
  private inactivityTimer: any = null;
  private warningTimer: any = null;
  showInactivityWarning = false;
  inactivityCountdown = 0; // Se calculará dinámicamente
  private countdownInterval: any = null;

  // Bot configurations
  readonly botConfigs: Record<BotType, BotConfig> = {
    [BotType.QUOTE_AUTO]: {
      botId: BotType.QUOTE_AUTO,
      title: 'Chubb Bot - Cotización Auto',
      welcomeMessage: '¡Hola! Soy tu asistente de cotización de seguros de auto. ¿En qué puedo ayudarte?',
      avatar: 'https://st5.depositphotos.com/72897924/62255/v/450/depositphotos_622556394-stock-illustration-robot-web-icon-vector-illustration.jpg',
      theme: CbColorTheme.PURPLE
    },
    [BotType.FAQ]: {
      botId: BotType.FAQ,
      title: 'Chubb Bot - Preguntas Frecuentes',
      welcomeMessage: '¡Hola! Soy tu asistente de preguntas frecuentes. Puedo responderte sobre pólizas, coberturas y más.',
      avatar: 'https://cdn-icons-png.flaticon.com/512/4712/4712027.png',
      theme: CbColorTheme.BLUE
    }
  };

  currentBotType: BotType = BotType.QUOTE_AUTO;
  title = this.botConfigs[this.currentBotType].title;

  // Configuración del chat
  theme = this.botConfigs[this.currentBotType].theme;
  enableTimeStamp = true;
  enableMicrophone = true;
  errorState = false;
  isTyping = false;
  isChatOpen = false;
  isRecording = false;

  // URL del avatar
  avatarUrl = this.botConfigs[this.currentBotType].avatar;

  // Mensajes del chat
  messages: Message[] = [];

  // Mensajes helper
  transferNotifyMessage!: string;
  timeStampHelperMessage!: string;

  // ID de sesión único
  private sessionId: string = '';

  get currentConfig(): BotConfig {
    return this.botConfigs[this.currentBotType];
  }

  // Configuración del modal de cierre
  modalConfig: ModalConfig = {
    typeVariant: 'destructive',
    title: '¿Desea finalizar el chat?',
    description: 'Finalizar el chat desconectará la conversación actual',
    primaryButtonLabel: 'Finalizar chat',
    secondaryButtonLabel: 'Cancelar',
    transcript: {
      label: 'Ver transcripción',
      rightIconKey: 'utility-arrow-right',
      leftIconKey: 'utility-email-stroke',
      linkConfiguration: {}
    }
  };

  constructor(
    private botService: BotService,
    private audioService: AudioService
  ) {}

  ngOnInit(): void {
    // Generar ID de sesión al iniciar
    this.sessionId = this.botService.generateSessionId();
    console.log('Sesión iniciada:', this.sessionId);

    // Suscribirse al estado de grabación
    this.audioService.isRecording$.subscribe(recording => {
      this.isRecording = recording;
    });

    // Mensaje de bienvenida inicial del bot seleccionado
    this.messages = [
      {
        message: this.currentConfig.welcomeMessage,
        messageType: 'text',
        fromUser: false,
        timestamp: new Date()
      }
    ];
  }

  /**
   * Cambia el bot activo y abre el chat automáticamente
   * @param botType - Tipo de bot a activar
   */
  switchBot(botType: BotType): void {
    // Si ya está activo este bot y el chat está abierto, no hacer nada
    if (this.currentBotType === botType && this.isChatOpen) {
      return;
    }

    // Si estamos cambiando de bot, cerrar el chat temporalmente
    const isSwitchingBot = this.currentBotType !== botType;
    if (isSwitchingBot && this.isChatOpen) {
      this.isChatOpen = false;
    }

    // Cambiar bot
    this.currentBotType = botType;

    // Reiniciar estado del chat
    this.sessionId = this.botService.generateSessionId();

    // Actualizar configuración de UI
    this.title = this.currentConfig.title;
    this.theme = this.currentConfig.theme;
    this.avatarUrl = this.currentConfig.avatar;

    // Inicializar mensajes con bienvenida del nuevo bot
    this.messages = [
      {
        message: this.currentConfig.welcomeMessage,
        messageType: 'text',
        fromUser: false,
        timestamp: new Date()
      }
    ];

    // Abrir el chat automáticamente
    this.isChatOpen = true;

    // Iniciar timer de inactividad
    this.startInactivityTimer();

    console.log('Bot cambiado a:', botType, '- Chat abierto automáticamente');
  }

  /**
   * Alterna la visibilidad del chat
   */
  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;

    // Si se abre el chat y no hay mensajes de bienvenida, agregarlos
    if (this.isChatOpen && this.messages.length === 0) {
      this.messages = [
        {
          message: this.currentConfig.welcomeMessage,
          messageType: 'text',
          fromUser: false,
          timestamp: new Date()
        }
      ];
    }

    // Iniciar timer de inactividad al abrir el chat
    if (this.isChatOpen) {
      this.startInactivityTimer();
    } else {
      this.clearInactivityTimers();
    }
  }

  /**
   * Maneja el evento de envío de mensaje del usuario
   * @param event - Evento con el mensaje del usuario
   */
  onHandleMessage(event: UserMessageEvent): void {
    console.log('Mensaje del usuario recibido:', event);

    const userMessage = event.userMessage.trim();

    if (!userMessage) {
      return;
    }

    // Resetear el timer de inactividad cuando el usuario envía un mensaje
    this.resetInactivityTimer();

    // Indicar que el bot está "escribiendo"
    this.isTyping = true;
    this.errorState = false;

    // Crear la solicitud para el bot usando el botId dinámico
    const request: ChatRequest = {
      sessionId: this.sessionId,
      botId: this.currentConfig.botId,
      message: userMessage
    };

    // Enviar mensaje al backend
    this.botService.sendMessage(request).subscribe({
      next: (response) => {
        this.isTyping = false;

        // Agregar la respuesta del bot a los mensajes
        const botMessage: Message = {
          message: response.response,
          messageType: 'text',
          fromUser: false,
          timestamp: new Date()
        };

        event.messages.push(botMessage);

        // Mostrar fuentes para FAQ bot si están disponibles
        if (this.currentBotType === BotType.FAQ && response.metadata?.['sources']) {
          const sources = Array.isArray(response.metadata['sources'])
            ? response.metadata['sources'].join(', ')
            : response.metadata['sources'];

          const sourcesMessage: Message = {
            message: `📚 Fuentes consultadas: ${sources}`,
            messageType: 'text',
            fromUser: false,
            timestamp: new Date()
          };
          event.messages.push(sourcesMessage);
        }

        // Si la conversación está completa (Quote Bot), mostrar mensaje adicional
        if (response.isComplete) {
          const completeMessage: Message = {
            message: '¡Gracias por usar nuestro servicio! Tu cotización ha sido procesada.',
            messageType: 'text',
            fromUser: false,
            timestamp: new Date()
          };
          event.messages.push(completeMessage);
        }

        console.log('Respuesta del bot:', response);
      },
      error: (error) => {
        this.isTyping = false;
        this.errorState = true;

        // Agregar mensaje de error
        const errorMessage: Message = {
          message: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta nuevamente.',
          messageType: 'text',
          fromUser: false,
          errorState: true,
          timestamp: new Date()
        };

        event.messages.push(errorMessage);
        console.error('Error al enviar mensaje:', error);
      }
    });
  }

  /**
   * Maneja el evento del botón de micrófono
   */
  async onHandleMicrophone(): Promise<void> {
    console.log('Botón de micrófono presionado');

    try {
      if (!this.audioService.isAudioRecordingSupported()) {
        alert('Tu navegador no soporta la grabación de audio');
        return;
      }

      if (this.isRecording) {
        // Detener grabación y enviar audio
        const audioBase64 = await this.audioService.stopRecording();

        // Mostrar indicador de procesamiento
        this.isTyping = true;

        // Crear solicitud de Speech-to-Text
        const sttRequest: SpeechToTextRequest = {
          audioBase64: audioBase64,
          audioFormat: 'webm',
          language: 'es-MX'
        };

        // Enviar audio para transcripción
        this.botService.speechToText(sttRequest).subscribe({
          next: (sttResponse) => {
            if (sttResponse.success && sttResponse.text) {
              // Simular que el usuario escribió el texto transcrito
              const userMessage: Message = {
                message: sttResponse.text,
                messageType: 'text',
                fromUser: true,
                timestamp: new Date()
              };

              this.messages.push(userMessage);

              // Enviar el mensaje transcrito al bot
              const userMessageEvent: UserMessageEvent = {
                userMessage: sttResponse.text,
                messages: this.messages
              };

              this.onHandleMessage(userMessageEvent);
            } else {
              this.isTyping = false;
              alert('No se pudo transcribir el audio. Por favor, intenta nuevamente.');
            }
          },
          error: (error) => {
            this.isTyping = false;
            console.error('Error en Speech-to-Text:', error);
            alert('Error al procesar el audio. Por favor, intenta nuevamente.');
          }
        });
      } else {
        // Iniciar grabación
        await this.audioService.startRecording();
      }
    } catch (error) {
      console.error('Error con el micrófono:', error);
      alert('Error al acceder al micrófono. Verifica los permisos del navegador.');
    }
  }

  /**
   * Maneja el evento de minimizar el chat
   * @param event - Mensajes actuales
   */
  onMinimizeChat(event: Message[]): void {
    this.messages = event;
    this.isChatOpen = false;

    // Limpiar timers de inactividad
    this.clearInactivityTimers();
    this.showInactivityWarning = false;

    console.log('Chat minimizado');
  }

  /**
   * Maneja el evento de cerrar el chat
   * @param event - Mensajes actuales
   */
  onCloseChat(event: Message[]): void {
    // Reiniciar el estado del chat
    this.messages = [];
    this.isChatOpen = false;

    // Limpiar timers de inactividad
    this.clearInactivityTimers();
    this.showInactivityWarning = false;

    // Generar nuevo ID de sesión
    this.sessionId = this.botService.generateSessionId();

    console.log('Chat cerrado. Nueva sesión:', this.sessionId);
  }

  /**
   * Maneja el evento de solicitud de transcripción
   * @param event - Mensajes para la transcripción
   */
  onHandleTranscript(event: Message[]): void {
    console.log('Mensajes para transcripción:', event);

    // Aquí podrías implementar la lógica para enviar la transcripción por email
    // o generar un PDF con el historial de la conversación
  }

  /**
   * Maneja el evento del botón secundario del modal
   * @param event - Evento del botón
   */
  onHandleSecondaryButton(event: any): void {
    console.log('Botón secundario del modal presionado', event);
  }

  /**
   * Inicia el temporizador de inactividad
   */
  private startInactivityTimer(): void {
    this.clearInactivityTimers();

    // Timer para mostrar advertencia
    this.warningTimer = setTimeout(() => {
      if (this.isChatOpen) {
        this.showInactivityWarning = true;
        // Calcular los segundos restantes hasta el cierre
        this.inactivityCountdown = Math.floor((this.INACTIVITY_TIMEOUT - this.INACTIVITY_WARNING_TIME) / 1000);
        this.startCountdown();
      }
    }, this.INACTIVITY_WARNING_TIME);

    // Timer para cerrar el chat automáticamente
    this.inactivityTimer = setTimeout(() => {
      if (this.isChatOpen) {
        this.closeByInactivity();
      }
    }, this.INACTIVITY_TIMEOUT);
  }

  /**
   * Reinicia el temporizador de inactividad
   */
  private resetInactivityTimer(): void {
    this.showInactivityWarning = false;
    this.clearCountdown();
    this.startInactivityTimer();
  }

  /**
   * Limpia todos los temporizadores de inactividad
   */
  private clearInactivityTimers(): void {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    this.clearCountdown();
  }

  /**
   * Inicia la cuenta regresiva en el modal de advertencia
   */
  private startCountdown(): void {
    this.clearCountdown();
    this.countdownInterval = setInterval(() => {
      this.inactivityCountdown--;
      if (this.inactivityCountdown <= 0) {
        this.clearCountdown();
      }
    }, 1000);
  }

  /**
   * Limpia el intervalo de cuenta regresiva
   */
  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  /**
   * Cierra el chat por inactividad
   */
  private closeByInactivity(): void {
    console.log('Chat cerrado por inactividad');

    // Agregar mensaje de sistema sobre el cierre
    const inactivityMessage: Message = {
      message: 'Chat cerrado por inactividad. ¡Gracias por usar nuestro servicio!',
      messageType: 'text',
      fromUser: false,
      timestamp: new Date()
    };

    this.messages.push(inactivityMessage);

    // Cerrar el chat después de un breve delay
    setTimeout(() => {
      this.showInactivityWarning = false;
      this.isChatOpen = false;
      this.clearInactivityTimers();

      // Reiniciar estado del chat
      this.messages = [];
      this.sessionId = this.botService.generateSessionId();
    }, 2000);
  }

  /**
   * Mantiene el chat activo cuando el usuario responde a la advertencia
   */
  keepChatActive(): void {
    this.showInactivityWarning = false;
    this.resetInactivityTimer();
  }

  /**
   * Lifecycle hook - Limpia los temporizadores al destruir el componente
   */
  ngOnDestroy(): void {
    this.clearInactivityTimers();
  }

  /**
   * Habilita/deshabilita Text-to-Speech para las respuestas del bot
   * @param response - Texto de la respuesta
   */
  private async speakBotResponse(response: string): Promise<void> {
    try {
      const ttsRequest: TextToSpeechRequest = {
        text: response,
        language: 'es-MX',
        voice: 'es-MX-DaliaNeural'
      };

      this.botService.textToSpeech(ttsRequest).subscribe({
        next: async (ttsResponse) => {
          if (ttsResponse.success) {
            await this.audioService.playAudio(ttsResponse.audioBase64, 'audio/mpeg');
          }
        },
        error: (error) => {
          console.error('Error en Text-to-Speech:', error);
        }
      });
    } catch (error) {
      console.error('Error al reproducir respuesta:', error);
    }
  }
}
