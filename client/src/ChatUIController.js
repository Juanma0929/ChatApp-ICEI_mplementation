/**
 * ChatUIController.js
 * Controla la renderización de la UI y maneja los eventos de usuario
 */

import { chatState } from './ChatStateManager';
import { messageSender } from './MessageSender';
import { messageReceiver } from './MessageReceiver';
import { iceClient } from './IceConnectionManager';
import { compunet } from './iceModules';

export class ChatUIController {
    constructor() {
        this.elements = {};
        this.initialized = false;
    }

    /**
     * Inicializa el controlador de UI
     */
    init() {
        if (this.initialized) return;

        // Obtener referencias a elementos del DOM
        this.elements = {
            chatList: document.getElementById('chat-list'),
            messageList: document.getElementById('message-list'),
            messageInput: document.getElementById('message-input'),
            sendButton: document.getElementById('send-button'),
            chatHeader: document.getElementById('chat-header'),
            newChatButton: document.getElementById('new-chat-button'),
            newGroupButton: document.getElementById('new-group-button'),
            currentUserName: document.getElementById('current-user-name')
        };

        // Registrar listeners de estado
        chatState.addListener(() => this.render());

        // Registrar eventos de UI
        this.setupEventListeners();

        this.initialized = true;
        console.log('UI Controller inicializado');
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Enviar mensaje
        this.elements.sendButton.addEventListener('click', () => this.handleSendMessage());
        
        this.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSendMessage();
            }
        });

        // Botón nuevo grupo
        this.elements.newGroupButton.addEventListener('click', () => this.handleNewGroup());
        
        // Nota: El botón newChat ya tiene su listener en registrationManager
    }

    /**
     * Renderiza toda la UI
     */
    render() {
        this.renderChatList();
        this.renderMessages();
        this.renderChatHeader();
        this.renderCurrentUser();
    }

    /**
     * Renderiza la lista de chats
     */
    renderChatList() {
        const chatList = chatState.getChatList();
        const activeChat = chatState.getActiveChat();
        
        this.elements.chatList.innerHTML = '';

        if (chatList.length === 0) {
            this.elements.chatList.innerHTML = '<div class="no-chats">No hay chats</div>';
            return;
        }

        chatList.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            
            if (activeChat && activeChat.chatId === chat.chatId) {
                chatItem.classList.add('active');
            }

            const isGroup = chat.chatType === compunet.ChatType.GROUP;
            const icon = isGroup ? '👥' : '👤';
            
            const time = this.formatTime(chat.lastMessageTime);
            
            chatItem.innerHTML = `
                <div class="chat-icon">${icon}</div>
                <div class="chat-info">
                    <div class="chat-name">${this.escapeHtml(chat.chatName)}</div>
                    <div class="chat-last-message">${this.escapeHtml(chat.lastMessage || 'Sin mensajes')}</div>
                </div>
                <div class="chat-time">${time}</div>
            `;

            chatItem.addEventListener('click', () => this.handleChatSelect(chat));
            
            this.elements.chatList.appendChild(chatItem);
        });
    }

    /**
     * Renderiza los mensajes del chat activo
     */
    renderMessages() {
        const messages = chatState.getActiveChatMessages();
        const currentUserId = chatState.getCurrentUserId();
        
        this.elements.messageList.innerHTML = '';

        if (messages.length === 0) {
            this.elements.messageList.innerHTML = '<div class="no-messages">No hay mensajes</div>';
            return;
        }

        messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            const isOwn = msg.senderId === currentUserId;
            
            messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;
            
            const time = this.formatTime(msg.timestamp);
            
            messageDiv.innerHTML = `
                <div class="message-content">
                    ${!isOwn ? `<div class="message-sender">${this.escapeHtml(msg.senderName)}</div>` : ''}
                    <div class="message-text">${this.escapeHtml(msg.content)}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;

            this.elements.messageList.appendChild(messageDiv);
        });

        // Scroll al final
        this.elements.messageList.scrollTop = this.elements.messageList.scrollHeight;
    }

    /**
     * Renderiza el header del chat activo
     */
    renderChatHeader() {
        const activeChat = chatState.getActiveChat();
        
        if (activeChat) {
            const isGroup = activeChat.chatType === compunet.ChatType.GROUP;
            const icon = isGroup ? '👥' : '👤';
            this.elements.chatHeader.innerHTML = `${icon} ${this.escapeHtml(activeChat.chatName)}`;
        } else {
            this.elements.chatHeader.innerHTML = 'Selecciona un chat';
        }
    }

    /**
     * Renderiza el nombre del usuario actual
     */
    renderCurrentUser() {
        const userId = chatState.getCurrentUserId();
        if (userId) {
            const allUsers = chatState.getAllUsers();
            const user = allUsers.find(u => u.id === userId);
            const userName = user ? user.name : userId;
            this.elements.currentUserName.textContent = userName;
        }
    }

    /**
     * Maneja la selección de un chat
     */
    async handleChatSelect(chatSummary) {
        chatState.setActiveChat(chatSummary);
        
        try {
            await messageReceiver.loadChatMessages(chatSummary);
        } catch (error) {
            console.error('Error al cargar mensajes:', error);
            alert('Error al cargar mensajes');
        }
    }

    /**
     * Maneja el envío de un mensaje
     */
    async handleSendMessage() {
        const content = this.elements.messageInput.value.trim();
        
        if (!content) return;

        try {
            await messageSender.sendMessage(content);
            
            // Limpiar input
            this.elements.messageInput.value = '';
            
            // Recargar mensajes y chats
            await messageReceiver.refreshAll();
            
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            alert('Error al enviar mensaje: ' + error.message);
        }
    }

    /**
     * Maneja la creación de un nuevo chat directo
     */
    async handleNewChat() {
        const allUsers = chatState.getAllUsers();
        const currentUserId = chatState.getCurrentUserId();
        
        const otherUsers = allUsers.filter(u => u.id !== currentUserId);
        
        if (otherUsers.length === 0) {
            alert('No hay otros usuarios disponibles');
            return;
        }

        // Mostrar lista de usuarios
        const userList = otherUsers.map((u, i) => `${i + 1}. ${u.name} (${u.id})`).join('\n');
        const selection = prompt(`Selecciona un usuario para iniciar chat:\n${userList}\n\nEscribe el número:`);
        
        if (selection) {
            const index = parseInt(selection) - 1;
            if (index >= 0 && index < otherUsers.length) {
                const selectedUser = otherUsers[index];
                
                // Enviar un mensaje inicial para crear el chat
                try {
                    await iceClient.sendDirectMessage(currentUserId, selectedUser.id, 'Hola!');
                    await messageReceiver.loadAllChats();
                    
                    // Seleccionar el nuevo chat
                    const chatList = chatState.getChatList();
                    const newChat = chatList.find(c => c.chatId === selectedUser.id);
                    if (newChat) {
                        await this.handleChatSelect(newChat);
                    }
                } catch (error) {
                    alert('Error al crear chat: ' + error.message);
                }
            }
        }
    }

    /**
     * Maneja la creación de un nuevo grupo
     */
    async handleNewGroup() {
        // Importar dinámicamente para acceder al groupManager inicializado
        const { groupManager } = await import('./index');
        if (groupManager) {
            groupManager.openModal();
        }
    }

    /**
     * Formatea un timestamp a string legible
     */
    formatTime(timestamp) {
        if (!timestamp) return '';
        
        // Convertir Ice.Long a número si es necesario
        const timestampNum = typeof timestamp === 'object' && timestamp.toNumber ? timestamp.toNumber() : timestamp;
        
        const date = new Date(timestampNum);
        const now = new Date();
        const diff = now - date;
        
        // Si es de hoy, mostrar solo hora
        if (diff < 86400000) { // 24 horas
            return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }
        
        // Si es de esta semana, mostrar día
        if (diff < 604800000) { // 7 días
            return date.toLocaleDateString('es-ES', { weekday: 'short' });
        }
        
        // Si no, mostrar fecha
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }

    /**
     * Escapa HTML para prevenir XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Exportar instancia singleton
export const uiController = new ChatUIController();
