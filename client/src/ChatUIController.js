/**
 * ChatUIController.js
 * Controla la renderización de la UI y maneja los eventos de usuario
 */

import { chatState } from './ChatStateManager';
import { messageSender } from './MessageSender';
import { messageReceiver } from './MessageReceiver';
import { iceClient } from './IceConnectionManager';
import { compunet } from './iceModules';
import { audioRecorder } from './AudioRecorder';
import { audioSender } from './AudioSender';
import { audioReceiver } from './AudioReceiver';

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
            recordButton: document.getElementById('record-button'),
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

        // Grabar audio
        this.elements.recordButton.addEventListener('click', () => this.handleRecordAudio());

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
            
            // Verificar si es mensaje de audio o texto
            const isAudio = msg.messageType === compunet.MessageType.AUDIO;
            
            if (isAudio) {
                // Renderizar mensaje de audio
                const audioId = `audio-${msg.id}`;
                messageDiv.innerHTML = `
                    <div class="message-content">
                        ${!isOwn ? `<div class="message-sender">${this.escapeHtml(msg.senderName)}</div>` : ''}
                        <div class="audio-message">
                            <button class="audio-play-button" data-audio-id="${audioId}" data-audio-base64="${msg.content}">
                                ▶️
                            </button>
                            <div class="audio-info">
                                <div class="audio-waveform"></div>
                                <div class="audio-duration">${audioReceiver.formatDuration(msg.audioDuration)}</div>
                            </div>
                        </div>
                        <div class="message-time">${time}</div>
                    </div>
                `;
                
                // Agregar evento de reproducción después de agregar al DOM
                setTimeout(() => {
                    const playButton = messageDiv.querySelector('.audio-play-button');
                    if (playButton) {
                        playButton.addEventListener('click', async () => {
                            const audioBase64 = playButton.getAttribute('data-audio-base64');
                            try {
                                playButton.textContent = '⏸️';
                                await audioReceiver.playAudio(audioBase64);
                                playButton.textContent = '▶️';
                            } catch (error) {
                                console.error('Error al reproducir audio:', error);
                                playButton.textContent = '▶️';
                                alert('Error al reproducir audio');
                            }
                        });
                    }
                }, 0);
                
            } else {
                // Renderizar mensaje de texto normal
                messageDiv.innerHTML = `
                    <div class="message-content">
                        ${!isOwn ? `<div class="message-sender">${this.escapeHtml(msg.senderName)}</div>` : ''}
                        <div class="message-text">${this.escapeHtml(msg.content)}</div>
                        <div class="message-time">${time}</div>
                    </div>
                `;
            }

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
            
            // Botón de llamada
            const callButton = isGroup 
                ? `<button id="group-call-button" class="call-button" title="Llamada grupal">📞</button>`
                : `<button id="voice-call-button" class="call-button" title="Llamar">📞</button>`;
            
            this.elements.chatHeader.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <span>${icon} ${this.escapeHtml(activeChat.chatName)}</span>
                    ${callButton}
                </div>
            `;
            
            // Agregar event listener al botón de llamada
            if (isGroup) {
                document.getElementById('group-call-button')?.addEventListener('click', () => this.handleGroupCall());
            } else {
                document.getElementById('voice-call-button')?.addEventListener('click', () => this.handleVoiceCall());
            }
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
     * Maneja la grabación de audio
     */
    async handleRecordAudio() {
        const activeChat = chatState.getActiveChat();
        if (!activeChat) {
            alert('Selecciona un chat para enviar audio');
            return;
        }

        try {
            if (!audioRecorder.isRecording()) {
                // Iniciar grabación
                await audioRecorder.startRecording();
                this.elements.recordButton.classList.add('recording');
                this.elements.recordButton.textContent = '⏹️';
                this.elements.recordButton.title = 'Detener grabación';
                
            } else {
                // Detener grabación y enviar
                this.elements.recordButton.classList.remove('recording');
                this.elements.recordButton.textContent = '🎤';
                this.elements.recordButton.title = 'Grabar audio';
                this.elements.recordButton.disabled = true;
                
                const { audioBase64, duration } = await audioRecorder.stopRecording();
                
                // Enviar audio
                await audioSender.sendAudio(audioBase64, duration);
                
                // Recargar mensajes
                await messageReceiver.refreshAll();
                
                this.elements.recordButton.disabled = false;
            }
            
        } catch (error) {
            console.error('Error con la grabación de audio:', error);
            this.elements.recordButton.classList.remove('recording');
            this.elements.recordButton.textContent = '🎤';
            this.elements.recordButton.title = 'Grabar audio';
            this.elements.recordButton.disabled = false;
            alert('Error con el audio: ' + error.message);
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
    
    // ========== Métodos de llamadas de voz ==========
    
    /**
     * Maneja iniciar llamada de voz directa
     */
    async handleVoiceCall() {
        const activeChat = chatState.getActiveChat();
        if (!activeChat || activeChat.chatType === compunet.ChatType.GROUP) return;
        
        try {
            // Mostrar modal de llamada
            this.showCallModal(activeChat.chatName, 'Llamando...');
            
            // Iniciar llamada
            const callId = await window.callManager.startDirectCall(activeChat.chatId);
            
            console.log('Llamada iniciada:', callId);
            
        } catch (error) {
            console.error('Error iniciando llamada:', error);
            this.hideCallModal();
            alert('Error al iniciar llamada: ' + error.message);
        }
    }
    
    /**
     * Maneja iniciar llamada grupal
     */
    async handleGroupCall() {
        const activeChat = chatState.getActiveChat();
        if (!activeChat || activeChat.chatType !== compunet.ChatType.GROUP) return;
        
        try {
            // Iniciar llamada grupal
            const callId = await window.groupCallManager.startGroupCall(activeChat.chatId);
            
            console.log('Llamada grupal iniciada:', callId);
            
        } catch (error) {
            console.error('Error iniciando llamada grupal:', error);
            alert('Error al iniciar llamada grupal: ' + error.message);
        }
    }
    
    /**
     * Muestra modal de llamada directa
     */
    showCallModal(contactName, status) {
        let modal = document.getElementById('call-modal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'call-modal';
            modal.className = 'call-modal';
            modal.innerHTML = `
                <div class="call-modal-content">
                    <div class="call-icon">📞</div>
                    <h2 id="call-contact-name">${this.escapeHtml(contactName)}</h2>
                    <p id="call-status">${status}</p>
                    <audio id="remoteAudio" autoplay></audio>
                    <button id="end-call-button" class="end-call-button">Colgar</button>
                </div>
            `;
            document.body.appendChild(modal);
            
            document.getElementById('end-call-button').addEventListener('click', () => {
                window.callManager.endCall();
            });
        } else {
            document.getElementById('call-contact-name').textContent = contactName;
            document.getElementById('call-status').textContent = status;
            modal.style.display = 'flex';
        }
    }
    
    /**
     * Oculta modal de llamada
     */
    hideCallModal() {
        const modal = document.getElementById('call-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    /**
     * Actualiza estado de llamada
     */
    updateCallStatus(status) {
        const statusElement = document.getElementById('call-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }
    
    /**
     * Muestra notificación de llamada entrante
     */
    showIncomingCallNotification(call, callManager) {
        let notification = document.getElementById('incoming-call-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'incoming-call-notification';
            notification.className = 'incoming-call-notification';
            notification.innerHTML = `
                <div class="incoming-call-content">
                    <div class="call-icon">📞</div>
                    <h3 id="incoming-caller-name">Llamada entrante</h3>
                    <p id="incoming-caller-subtitle">de ${this.escapeHtml(call.callerName)}</p>
                    <div class="incoming-call-buttons">
                        <button id="answer-call-button" class="answer-button">Contestar</button>
                        <button id="reject-call-button" class="reject-button">Rechazar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(notification);
        } else {
            document.getElementById('incoming-caller-subtitle').textContent = `de ${call.callerName}`;
            notification.style.display = 'flex';
        }
        
        // Event listeners
        document.getElementById('answer-call-button').onclick = async () => {
            notification.style.display = 'none';
            this.showCallModal(call.callerName, 'Conectando...');
            await callManager.answerDirectCall(call.callId);
        };
        
        document.getElementById('reject-call-button').onclick = async () => {
            notification.style.display = 'none';
            await callManager.rejectCall(call.callId);
        };
    }
    
    /**
     * Muestra modal de llamada grupal
     */
    showGroupCallModal(callId, groupCallManager) {
        let modal = document.getElementById('group-call-modal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'group-call-modal';
            modal.className = 'call-modal';
            modal.innerHTML = `
                <div class="call-modal-content">
                    <div class="call-icon">📞</div>
                    <h2>Llamada Grupal</h2>
                    <p id="group-call-participants">Participantes: 1</p>
                    <div id="group-call-audios"></div>
                    <button id="leave-group-call-button" class="end-call-button">Salir</button>
                </div>
            `;
            document.body.appendChild(modal);
            
            document.getElementById('leave-group-call-button').addEventListener('click', () => {
                groupCallManager.leaveGroupCall();
            });
        } else {
            modal.style.display = 'flex';
        }
    }
    
    /**
     * Oculta modal de llamada grupal
     */
    hideGroupCallModal() {
        const modal = document.getElementById('group-call-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    /**
     * Muestra notificación simple
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'simple-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #00a884;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Exportar instancia singleton
export const uiController = new ChatUIController();
