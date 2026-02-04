import { render, screen, fireEvent, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ChatWindowComponent } from './chat-window.component';
import { Message, ModalConfig } from '../models/chat.models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

describe('ChatWindowComponent', () => {
  const defaultModalConfig: ModalConfig = {
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

  const defaultMessages: Message[] = [
    {
      message: 'Hola, ¿en qué puedo ayudarte?',
      messageType: 'text',
      fromUser: false,
      timestamp: new Date('2026-02-04T10:00:00')
    },
    {
      message: 'Necesito información sobre seguros',
      messageType: 'text',
      fromUser: true,
      timestamp: new Date('2026-02-04T10:01:00')
    }
  ];

  describe('Component Rendering', () => {
    it('should render the chat window with default props', async () => {
      await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: [],
          enableTimeStamp: false,
          enableMicrophone: true
        }
      });

      expect(screen.getByText('Test Chat')).toBeInTheDocument();
    });

    it('should display the avatar when showAvatar is true', async () => {
      await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          showAvatar: true,
          avatarUrl: 'https://example.com/avatar.jpg',
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: []
        }
      });

      const avatar = screen.getByAltText('Avatar');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should not display the avatar when showAvatar is false', async () => {
      await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          showAvatar: false,
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: []
        }
      });

      const avatar = screen.queryByAltText('Avatar');
      expect(avatar).not.toBeInTheDocument();
    });

    it('should render messages correctly', async () => {
      await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: defaultMessages,
          enableTimeStamp: false
        }
      });

      expect(screen.getByText('Hola, ¿en qué puedo ayudarte?')).toBeInTheDocument();
      expect(screen.getByText('Necesito información sobre seguros')).toBeInTheDocument();
    });

    it('should display timestamps when enableTimeStamp is true', async () => {
      await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: defaultMessages,
          enableTimeStamp: true
        }
      });

      const timestamps = screen.getAllByText(/2\/4\/26/);
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });

  describe('User Interactions', () => {
    it('should send a message when clicking the send button', async () => {
      const handleBotMessageSpy = jest.fn();

      await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: [],
          handleBotMessage: {
            emit: handleBotMessageSpy
          } as any
        }
      });

      const input = screen.getByPlaceholderText('Escribe tu mensaje...');
      const buttons = screen.getAllByRole('button');
      const sendButton = buttons.find(btn => !btn.getAttribute('title')); // El botón de enviar no tiene title

      await userEvent.type(input, 'Hola, necesito ayuda');
      if (sendButton) {
        await userEvent.click(sendButton);
      }

      expect(handleBotMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userMessage: 'Hola, necesito ayuda'
        })
      );
    });

    it('should send a message when pressing Enter key', async () => {
      const handleBotMessageSpy = jest.fn();

      await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: [],
          handleBotMessage: {
            emit: handleBotMessageSpy
          } as any
        }
      });

      const input = screen.getByPlaceholderText('Escribe tu mensaje...');

      await userEvent.type(input, 'Mensaje con Enter{Enter}');

      expect(handleBotMessageSpy).toHaveBeenCalled();
    });

    it('should not send empty messages', async () => {
      const handleBotMessageSpy = jest.fn();

      await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: [],
          handleBotMessage: {
            emit: handleBotMessageSpy
          } as any
        }
      });

      const buttons = screen.getAllByRole('button');
      const sendButton = buttons.find(btn => !btn.getAttribute('title')); // El botón de enviar no tiene title
      if (sendButton) {
        await userEvent.click(sendButton);
      }

      expect(handleBotMessageSpy).not.toHaveBeenCalled();
    });

    it('should disable input and send button when isTyping is true', async () => {
      await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: [],
          isTyping: true
        }
      });

      const input = screen.getByPlaceholderText('Escribe tu mensaje...');
      const buttons = screen.getAllByRole('button');
      const sendButton = buttons.find(btn => !btn.getAttribute('title')); // El botón de enviar no tiene title

      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });

    it('should display typing indicator when isTyping is true', async () => {
      await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: [],
          isTyping: true
        }
      });

      expect(screen.getByText('Escribiendo...')).toBeInTheDocument();
      const typingDots = document.querySelectorAll('.typing-dot');
      expect(typingDots.length).toBe(3);
    });
  });

  describe('Microphone Button', () => {
    it('should render microphone button when enableMicrophone is true', async () => {
      await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: [],
          enableMicrophone: true
        }
      });

      const micButton = screen.getByTitle('Usar micrófono');
      expect(micButton).toBeInTheDocument();
    });

    it('should not render microphone button when enableMicrophone is false', async () => {
      await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: [],
          enableMicrophone: false
        }
      });

      const micButton = screen.queryByTitle('Usar micrófono');
      expect(micButton).not.toBeInTheDocument();
    });

    it('should emit microphoneClick event when clicking microphone button', async () => {
      const microphoneClickSpy = jest.fn();

      await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: [],
          enableMicrophone: true,
          microphoneClick: {
            emit: microphoneClickSpy
          } as any
        }
      });

      const micButton = screen.getByTitle('Usar micrófono');
      await userEvent.click(micButton);

      expect(microphoneClickSpy).toHaveBeenCalled();
    });
  });

  describe('Chat Controls', () => {
    it('should emit minimizeChat event when clicking minimize button', async () => {
      const minimizeChatSpy = jest.fn();

      await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: defaultMessages,
          minimizeChat: {
            emit: minimizeChatSpy
          } as any
        }
      });

      const minimizeButton = screen.getByTitle('Minimizar');
      await userEvent.click(minimizeButton);

      expect(minimizeChatSpy).toHaveBeenCalledWith(defaultMessages);
    });

    it('should show close modal when clicking close button', async () => {
      await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: []
        }
      });

      const closeButton = screen.getByTitle('Cerrar');
      await userEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.getByText('¿Desea finalizar el chat?')).toBeInTheDocument();
        expect(screen.getByText('Finalizar el chat desconectará la conversación actual')).toBeInTheDocument();
      });
    });

    it('should emit closeChat event when confirming close in modal', async () => {
      const closeChatSpy = jest.fn();

      await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: defaultMessages,
          closeChat: {
            emit: closeChatSpy
          } as any
        }
      });

      const closeButton = screen.getByTitle('Cerrar');
      await userEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.getByText('Finalizar chat')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText('Finalizar chat');
      await userEvent.click(confirmButton);

      expect(closeChatSpy).toHaveBeenCalledWith(defaultMessages);
    });

    it('should hide modal when clicking cancel in close modal', async () => {
      await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: []
        }
      });

      const closeButton = screen.getByTitle('Cerrar');
      await userEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.getByText('Cancelar')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancelar');
      await userEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('¿Desea finalizar el chat?')).not.toBeInTheDocument();
      });
    });
  });

  describe('Theme Support', () => {
    it('should apply purple theme class', async () => {
      const { container } = await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: [],
          theme: 'purple'
        }
      });

      const chatContainer = container.querySelector('.chat-purple');
      expect(chatContainer).toBeInTheDocument();
    });

    it('should apply blue theme class', async () => {
      const { container } = await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: [],
          theme: 'blue'
        }
      });

      const chatContainer = container.querySelector('.chat-blue');
      expect(chatContainer).toBeInTheDocument();
    });

    it('should apply green theme class', async () => {
      const { container } = await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: [],
          theme: 'green'
        }
      });

      const chatContainer = container.querySelector('.chat-green');
      expect(chatContainer).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error state styling when errorState is true', async () => {
      const { container } = await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: [],
          errorState: true
        }
      });

      const inputArea = container.querySelector('.chat-input-area.error-state');
      expect(inputArea).toBeInTheDocument();
    });

    it('should display error messages with error styling', async () => {
      const errorMessages: Message[] = [
        {
          message: 'Error al procesar el mensaje',
          messageType: 'text',
          fromUser: false,
          errorState: true,
          timestamp: new Date()
        }
      ];

      const { container } = await render(ChatWindowComponent, {
        imports: [CommonModule, FormsModule],
        componentProperties: {
          title: 'Test Chat',
          modalConfig: defaultModalConfig,
          messages: errorMessages
        }
      });

      expect(screen.getByText('Error al procesar el mensaje')).toBeInTheDocument();
      const errorMessage = container.querySelector('.message-error');
      expect(errorMessage).toBeInTheDocument();
    });
  });
});
