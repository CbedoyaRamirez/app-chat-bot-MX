import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-trigger',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="chat-trigger-button"
      [class.chat-trigger-purple]="theme === 'purple'"
      [class.chat-trigger-blue]="theme === 'blue'"
      [class.chat-trigger-green]="theme === 'green'"
      [disabled]="disabled"
      (click)="onClick()"
      (keydown.enter)="onClick()"
      type="button"
      aria-label="Abrir chat">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span class="notification-badge" *ngIf="showNotificationBadge"></span>
      <span class="notification-counter" *ngIf="showNotificationCounter">{{ notificationCount }}</span>
    </button>
  `,
  styles: [`
    .chat-trigger-button {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      z-index: 1100;
      color: white;
    }

    .chat-trigger-button:hover:not(:disabled) {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    .chat-trigger-button:active:not(:disabled) {
      transform: scale(0.95);
    }

    .chat-trigger-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .chat-trigger-purple {
      background: linear-gradient(135deg, #150F96 0%, #0A0646 100%);
    }

    .chat-trigger-blue {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    .chat-trigger-green {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    }

    .notification-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 12px;
      height: 12px;
      background-color: #ff4444;
      border-radius: 50%;
      border: 2px solid white;
    }

    .notification-counter {
      position: absolute;
      top: 4px;
      right: 4px;
      background-color: #ff4444;
      color: white;
      font-size: 10px;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 18px;
      text-align: center;
      border: 2px solid white;
    }

    svg {
      width: 28px;
      height: 28px;
    }

    /* Tablets */
    @media (max-width: 768px) {
      .chat-trigger-button {
        width: 56px;
        height: 56px;
        bottom: 20px;
        right: 20px;
      }

      svg {
        width: 26px;
        height: 26px;
      }

      .notification-badge {
        width: 10px;
        height: 10px;
        top: 6px;
        right: 6px;
      }

      .notification-counter {
        font-size: 9px;
        padding: 1px 5px;
        min-width: 16px;
      }
    }

    /* Móviles */
    @media (max-width: 480px) {
      .chat-trigger-button {
        width: 52px;
        height: 52px;
        bottom: 16px;
        right: 16px;
      }

      svg {
        width: 24px;
        height: 24px;
      }

      .notification-badge {
        width: 9px;
        height: 9px;
        top: 5px;
        right: 5px;
        border-width: 1.5px;
      }

      .notification-counter {
        font-size: 8px;
        padding: 1px 4px;
        min-width: 14px;
        border-width: 1.5px;
      }
    }
  `]
})
export class ChatTriggerComponent {
  @Input() theme: string = 'purple';
  @Input() chatTriggerStyle: string = 'stroke';
  @Input() showNotificationBadge: boolean = false;
  @Input() showNotificationCounter: boolean = false;
  @Input() notificationCount: number = 0;
  @Input() disabled: boolean = false;

  @Output() chatTriggerClick = new EventEmitter<void>();
  @Output() chatTriggerKeydown = new EventEmitter<KeyboardEvent>();

  onClick(): void {
    if (!this.disabled) {
      this.chatTriggerClick.emit();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.disabled) {
      this.chatTriggerKeydown.emit(event);
    }
  }
}
