import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message, UserMessageEvent, ModalConfig } from '../models/chat.models';
import { MarkdownPipe } from '../pipes/markdown.pipe';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe],
  template: `
    <div class="chat-container" [class.chat-purple]="theme === 'purple'" [class.chat-blue]="theme === 'blue'" [class.chat-green]="theme === 'green'">
      <!-- Header -->
      <div class="chat-header">
        <div class="chat-header-content">
          <img *ngIf="showAvatar && avatarUrl" [src]="avatarUrl" alt="Avatar" class="chat-avatar" />
          <div class="chat-title-section">
            <h3 class="chat-title">{{ title }}</h3>
            <span class="chat-subtitle" *ngIf="isTyping">Escribiendo...</span>
          </div>
        </div>
        <div class="chat-actions">
          <button class="chat-action-button" (click)="onMinimize()" title="Minimizar" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button class="chat-action-button" (click)="onCloseRequest()" title="Cerrar" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="chat-messages" #messagesContainer>
        <div *ngFor="let message of messages" class="message-wrapper" [class.message-user]="message.fromUser" [class.message-bot]="!message.fromUser" [class.message-error]="message.errorState">
          <div class="message-bubble">
            <div class="message-text" [innerHTML]="message.message | markdown"></div>
            <span class="message-timestamp" *ngIf="enableTimeStamp && message.timestamp">
              {{ message.timestamp | date: 'short' }}
            </span>
          </div>
        </div>

        <!-- Typing Indicator -->
        <div class="typing-indicator" *ngIf="isTyping">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="chat-input-area" [class.error-state]="errorState">
        <button *ngIf="enableMicrophone" class="microphone-button" (click)="onMicrophoneClick()" type="button" title="Usar micrófono">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </button>
        <input
          type="text"
          class="chat-input"
          [(ngModel)]="currentMessage"
          (keydown.enter)="onSendMessage()"
          placeholder="Escribe tu mensaje..."
          [disabled]="isTyping"
        />
        <button class="send-button" (click)="onSendMessage()" [disabled]="!currentMessage.trim() || isTyping" type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>

      <!-- Close Modal -->
      <div class="chat-modal-overlay" *ngIf="showCloseModal" (click)="onCancelClose()">
        <div class="chat-modal" (click)="$event.stopPropagation()">
          <h4>{{ modalConfig.title }}</h4>
          <p>{{ modalConfig.description }}</p>
          <div class="modal-actions">
            <button class="modal-button modal-button-secondary" (click)="onCancelClose()" type="button">
              {{ modalConfig.secondaryButtonLabel }}
            </button>
            <button class="modal-button modal-button-primary" (click)="onConfirmClose()" type="button">
              {{ modalConfig.primaryButtonLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(100px) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes slideInUpMobile {
      from {
        opacity: 0;
        transform: translateY(-50%) translateX(50px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(-50%) translateX(0) scale(1);
      }
    }

    @keyframes headerSlideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes messagesFadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes inputSlideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes messageSlideIn {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes messageSlideInRight {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes modalFadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes modalScaleIn {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .chat-container {
      position: fixed;
      bottom: 100px;
      right: 24px;
      width: 800px;
      height: 600px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 1000;
      animation: slideInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
    }

    .chat-header {
      padding: 16px;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 16px 16px 0 0;
      flex-shrink: 0;
      position: relative;
      z-index: 10;
      animation: headerSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) backwards 0.1s;
    }

    .chat-purple .chat-header,
    .chat-blue .chat-header,
    .chat-green .chat-header {
      background: linear-gradient(135deg, var(--chubb-primary) 0%, #001F6B 100%);
    }

    .chat-header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .chat-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .chat-title-section {
      display: flex;
      flex-direction: column;
    }

    .chat-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .chat-subtitle {
      font-size: 12px;
      opacity: 0.9;
    }

    .chat-actions {
      display: flex;
      gap: 8px;
    }

    .chat-action-button {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .chat-action-button:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1) rotate(5deg);
    }

    .chat-action-button:active {
      transform: scale(0.95);
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f5f5f5;
      animation: messagesFadeIn 0.6s ease-out backwards 0.2s;
    }

    .message-wrapper {
      display: flex;
      width: 100%;
      animation-duration: 0.4s;
      animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
      animation-fill-mode: backwards;
    }

    .message-user {
      justify-content: flex-end;
      animation-name: messageSlideInRight;
    }

    .message-bot {
      justify-content: flex-start;
      animation-name: messageSlideIn;
    }

    .message-bubble {
      max-width: 75%;
      padding: 12px 16px;
      border-radius: 16px;
      word-wrap: break-word;
    }

    .message-user .message-bubble {
      background: var(--chubb-primary);
      color: var(--chubb-text-inverse);
      border-bottom-right-radius: var(--chubb-radius-base);
    }

    .message-bot .message-bubble {
      background: var(--chubb-bg-surface);
      color: var(--chubb-text-primary);
      border-bottom-left-radius: var(--chubb-radius-base);
      box-shadow: var(--chubb-shadow-sm);
    }

    .message-error .message-bubble {
      background: #ff4444;
      color: white;
    }

    .message-text {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
    }

    /* Markdown styling for bot messages */
    .message-bot .message-text {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }

    .message-text :deep(strong) {
      font-weight: 600;
      color: #1a1a1a;
    }

    .message-text :deep(p) {
      margin: 0 0 8px 0;
      line-height: 1.6;
    }

    .message-text :deep(p:last-child) {
      margin-bottom: 0;
    }

    .message-text :deep(ul) {
      margin: 8px 0;
      padding-left: 0;
      list-style: none;
    }

    .message-text :deep(ul li) {
      position: relative;
      padding-left: 20px;
      margin-bottom: 6px;
      line-height: 1.5;
    }

    .message-text :deep(ul li::before) {
      content: '•';
      position: absolute;
      left: 0;
      color: var(--chubb-primary);
      font-weight: bold;
      font-size: 16px;
    }

    .message-text :deep(ol) {
      margin: 8px 0;
      padding-left: 20px;
      counter-reset: item;
    }

    .message-text :deep(ol li) {
      position: relative;
      padding-left: 8px;
      margin-bottom: 6px;
      line-height: 1.5;
      counter-increment: item;
    }

    .message-text :deep(ol li::marker) {
      color: var(--chubb-primary);
      font-weight: 600;
    }

    .message-text :deep(h1),
    .message-text :deep(h2),
    .message-text :deep(h3),
    .message-text :deep(h4) {
      margin: 12px 0 8px 0;
      font-weight: 600;
      line-height: 1.3;
      color: #1a1a1a;
    }

    .message-text :deep(h1) { font-size: 18px; }
    .message-text :deep(h2) { font-size: 16px; }
    .message-text :deep(h3) { font-size: 15px; }
    .message-text :deep(h4) { font-size: 14px; }

    .message-text :deep(code) {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
    }

    .message-text :deep(pre) {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 8px 0;
    }

    .message-text :deep(pre code) {
      background: none;
      padding: 0;
    }

    .message-text :deep(blockquote) {
      border-left: 3px solid var(--chubb-primary);
      padding-left: 12px;
      margin: 8px 0;
      color: var(--chubb-text-secondary);
      font-style: italic;
    }

    .message-timestamp {
      display: block;
      font-size: 11px;
      margin-top: 4px;
      opacity: 0.7;
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      background: white;
      border-radius: 16px;
      width: fit-content;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      animation: messageSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .typing-dot {
      width: 8px;
      height: 8px;
      background: var(--chubb-primary);
      border-radius: var(--chubb-radius-full);
      animation: typing 1.4s infinite;
    }

    .typing-dot:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-dot:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typing {
      0%, 60%, 100% {
        opacity: 0.3;
        transform: scale(0.8);
      }
      30% {
        opacity: 1;
        transform: scale(1);
      }
    }

    .chat-input-area {
      display: flex;
      gap: 8px;
      padding: 16px;
      background: white;
      border-top: 1px solid #e0e0e0;
      flex-shrink: 0;
      position: relative;
      z-index: 10;
      animation: inputSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) backwards 0.3s;
    }

    .chat-input-area.error-state {
      border-top-color: #ff4444;
    }

    .microphone-button,
    .send-button {
      background: var(--chubb-primary);
      border: none;
      color: var(--chubb-text-inverse);
      width: 60px;
      height: 60px;
      border-radius: var(--chubb-radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
    }

    .microphone-button::before,
    .send-button::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.4s, height 0.4s;
    }

    .microphone-button:hover::before,
    .send-button:hover:not(:disabled)::before {
      width: 100%;
      height: 100%;
    }

    .microphone-button:hover,
    .send-button:hover:not(:disabled) {
      background: var(--chubb-primary-hover);
      transform: scale(1.1) rotate(-5deg);
      box-shadow: 0 8px 20px rgba(26, 13, 171, 0.3);
    }

    .microphone-button:active,
    .send-button:active:not(:disabled) {
      transform: scale(0.95);
    }

    .send-button:disabled {
      background: var(--chubb-bg-disabled);
      cursor: not-allowed;
      transform: none;
      opacity: 0.6;
    }

    .chat-input {
      flex: 1;
      border: 1px solid #e0e0e0;
      border-radius: 20px;
      padding: 20px 16px;
      font-size: 14px;
      min-height: 60px;
      outline: none;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .chat-input:focus {
      border-color: var(--chubb-border-focus);
      box-shadow: 0 0 0 3px rgba(26, 13, 171, 0.1);
      transform: scale(1.01);
    }

    .chat-input:disabled {
      background: #f5f5f5;
      cursor: not-allowed;
    }

    .chat-modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1001;
      border-radius: 16px;
      animation: modalFadeIn 0.2s ease-out;
      backdrop-filter: blur(4px);
    }

    .chat-modal {
      background: white;
      padding: 24px;
      border-radius: 12px;
      max-width: 90%;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      animation: modalScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .chat-modal h4 {
      margin: 0 0 8px 0;
      font-size: 18px;
      color: #333;
    }

    .chat-modal p {
      margin: 0 0 20px 0;
      font-size: 14px;
      color: #666;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .modal-button {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      overflow: hidden;
    }

    .modal-button::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.1);
      transform: translate(-50%, -50%);
      transition: width 0.4s, height 0.4s;
    }

    .modal-button:hover::before {
      width: 200%;
      height: 200%;
    }

    .modal-button-secondary {
      background: #f0f0f0;
      color: #333;
    }

    .modal-button-secondary:hover {
      background: #e0e0e0;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .modal-button-secondary:active {
      transform: translateY(0);
    }

    .modal-button-primary {
      background: #ff4444;
      color: white;
    }

    .modal-button-primary:hover {
      background: #cc0000;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 68, 68, 0.3);
    }

    .modal-button-primary:active {
      transform: translateY(0);
    }

    /* Laptops grandes (1920px+) */
    @media (min-width: 1920px) {
      .chat-container {
        width: 900px;
        height: 650px;
      }
    }

    /* Laptops medianas Full HD (1440px - 1920px) */
    @media (min-width: 1440px) and (max-width: 1919px) {
      .chat-container {
        width: 850px;
        height: 600px;
      }
    }

    /* Laptops pequeñas/medianas (1280px - 1440px) */
    @media (min-width: 1280px) and (max-width: 1439px) {
      .chat-container {
        width: 750px;
        height: 500px;
      }
    }

    /* Laptops muy pequeñas (1024px - 1280px) */
    @media (min-width: 1024px) and (max-width: 1279px) {
      .chat-container {
        width: 700px;
        height: 480px;
      }
    }

    /* Tablets grandes (max-width: 1024px) */
    @media (max-width: 1023px) {
      .chat-container {
        width: calc(100vw - 48px);
        height: calc(100vh - 140px);
        max-width: 700px;
        bottom: 24px;
        right: 24px;
      }
    }

    /* Tablets */
    @media (max-width: 768px) {
      .chat-container {
        width: calc(100vw - 32px);
        height: 85vh;
        max-height: 650px;
        right: 16px;
        top: 50%;
        bottom: auto;
        transform: translateY(-50%);
        animation: slideInUpMobile 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
      }

      .chat-header {
        padding: 12px;
      }

      .chat-avatar {
        width: 32px;
        height: 32px;
      }

      .chat-title {
        font-size: 14px;
      }

      .chat-subtitle {
        font-size: 11px;
      }

      .chat-action-button {
        width: 36px;
        height: 36px;
        min-width: 36px;
        min-height: 36px;
      }

      .chat-action-button svg {
        width: 18px;
        height: 18px;
      }

      .chat-messages {
        padding: 12px;
      }

      .message-bubble {
        max-width: 80%;
        padding: 10px 14px;
      }

      .message-text {
        font-size: 13px;
      }

      .chat-input-area {
        padding: 12px;
        gap: 6px;
      }

      .microphone-button,
      .send-button {
        width: 50px;
        height: 50px;
      }

      .chat-input {
        min-height: 50px;
        padding: 15px 14px;
        font-size: 13px;
      }
    }

    /* Móviles grandes */
    @media (max-width: 640px) {
      .chat-container {
        width: calc(100vw - 24px);
        height: 85vh;
        max-height: 600px;
        right: 12px;
        top: 50%;
        bottom: auto;
        transform: translateY(-50%);
      }

      .message-bubble {
        max-width: 85%;
      }
    }

    /* Móviles pequeños */
    @media (max-width: 480px) {
      .chat-container {
        width: calc(100vw - 20px);
        height: 88vh;
        max-height: 650px;
        right: 10px;
        top: 50%;
        bottom: auto;
        transform: translateY(-50%);
        border-radius: 12px;
      }

      .chat-header {
        padding: 12px;
        border-radius: 12px 12px 0 0;
      }

      .chat-avatar {
        width: 30px;
        height: 30px;
      }

      .chat-title {
        font-size: 14px;
        font-weight: 600;
      }

      .chat-subtitle {
        font-size: 11px;
      }

      .chat-actions {
        gap: 8px;
      }

      .chat-action-button {
        width: 40px;
        height: 40px;
        min-width: 40px;
        min-height: 40px;
        background: rgba(255, 255, 255, 0.25);
        backdrop-filter: blur(4px);
      }

      .chat-action-button:active {
        transform: scale(0.95);
        background: rgba(255, 255, 255, 0.35);
      }

      .chat-action-button svg {
        width: 18px;
        height: 18px;
      }

      .chat-messages {
        padding: 10px;
        gap: 10px;
      }

      .message-bubble {
        max-width: 90%;
        padding: 8px 12px;
        font-size: 12px;
      }

      .message-text {
        font-size: 12px;
      }

      .message-text :deep(h1) { font-size: 16px; }
      .message-text :deep(h2) { font-size: 14px; }
      .message-text :deep(h3) { font-size: 13px; }
      .message-text :deep(h4) { font-size: 12px; }

      .message-timestamp {
        font-size: 10px;
      }

      .typing-indicator {
        padding: 10px 14px;
      }

      .typing-dot {
        width: 6px;
        height: 6px;
      }

      .chat-input-area {
        padding: 10px;
        gap: 6px;
      }

      .microphone-button,
      .send-button {
        width: 44px;
        height: 44px;
      }

      .microphone-button svg,
      .send-button svg {
        width: 18px;
        height: 18px;
      }

      .chat-input {
        min-height: 44px;
        padding: 12px;
        font-size: 12px;
        border-radius: 16px;
      }

      .chat-modal {
        max-width: 85%;
        padding: 20px;
      }

      .chat-modal h4 {
        font-size: 16px;
      }

      .chat-modal p {
        font-size: 13px;
      }

      .modal-button {
        padding: 8px 16px;
        font-size: 13px;
      }
    }

    /* Móviles en orientación horizontal (landscape) */
    @media (max-width: 768px) and (max-height: 500px) and (orientation: landscape) {
      .chat-container {
        width: calc(100vw - 24px);
        height: 92vh;
        max-height: 480px;
        right: 12px;
        top: 50%;
        bottom: auto;
        transform: translateY(-50%);
        border-radius: 12px;
      }

      .chat-header {
        padding: 10px 12px;
      }

      .chat-avatar {
        width: 28px;
        height: 28px;
      }

      .chat-title {
        font-size: 13px;
      }

      .chat-action-button {
        width: 36px;
        height: 36px;
        min-width: 36px;
        min-height: 36px;
      }

      .chat-messages {
        padding: 10px;
        gap: 8px;
      }

      .message-bubble {
        padding: 8px 12px;
      }

      .chat-input-area {
        padding: 10px;
      }

      .microphone-button,
      .send-button {
        width: 44px;
        height: 44px;
      }

      .chat-input {
        min-height: 44px;
        padding: 12px;
        font-size: 13px;
      }
    }
  `]
})
export class ChatWindowComponent implements OnChanges {
  @Input() theme: string = 'purple';
  @Input() showAvatar: boolean = true;
  @Input() avatarUrl: string = '';
  @Input() title: string = 'Chat';
  @Input() modalConfig!: ModalConfig;
  @Input() enableTimeStamp: boolean = false;
  @Input() enableMicrophone: boolean = true;
  @Input() isTyping: boolean = false;
  @Input() messages: Message[] = [];
  @Input() errorState: boolean = false;
  @Input() timeStampHelperMessage: string = '';
  @Input() transferNotifyMessage: string = '';

  @Output() handleBotMessage = new EventEmitter<UserMessageEvent>();
  @Output() microphoneClick = new EventEmitter<void>();
  @Output() minimizeChat = new EventEmitter<Message[]>();
  @Output() closeChat = new EventEmitter<Message[]>();
  @Output() handleTranscript = new EventEmitter<Message[]>();
  @Output() secondaryModalbutton = new EventEmitter<any>();

  currentMessage: string = '';
  showCloseModal: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages'] && changes['messages'].currentValue) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  onSendMessage(): void {
    const trimmedMessage = this.currentMessage.trim();
    if (!trimmedMessage || this.isTyping) {
      return;
    }

    // Add user message to messages array
    const userMessage: Message = {
      message: trimmedMessage,
      messageType: 'text',
      fromUser: true,
      timestamp: new Date()
    };

    this.messages.push(userMessage);

    // Emit event to parent component
    const event: UserMessageEvent = {
      userMessage: trimmedMessage,
      messages: this.messages
    };

    this.handleBotMessage.emit(event);

    // Clear input
    this.currentMessage = '';

    // Scroll to bottom
    setTimeout(() => this.scrollToBottom(), 100);
  }

  onMicrophoneClick(): void {
    this.microphoneClick.emit();
  }

  onMinimize(): void {
    this.minimizeChat.emit(this.messages);
  }

  onCloseRequest(): void {
    this.showCloseModal = true;
  }

  onConfirmClose(): void {
    this.showCloseModal = false;
    this.closeChat.emit(this.messages);
  }

  onCancelClose(): void {
    this.showCloseModal = false;
  }

  private scrollToBottom(): void {
    try {
      const messagesContainer = document.querySelector('.chat-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }
}
