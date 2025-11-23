/**
 * ChatStateManager.js
 * Gestiona el estado de la aplicación (chats, chat activo, mensajes)
 */

import { compunet } from './iceModules';

class ChatStateManager {
    constructor() {
        this.currentUser = null; // Objeto {id, name}
        this.chatList = []; // Lista de ChatSummary (directos + grupos)
        this.activeChat = null; // ChatSummary del chat activo
        this.activeChatMessages = []; // Mensajes del chat activo
        this.allUsers = []; // Lista de todos los usuarios
        this.listeners = []; // Listeners para cambios de estado
    }

    /**
     * Establece el usuario actual
     */
    setCurrentUser(user) {
        // Acepta tanto un objeto {id, name} como solo un id (por compatibilidad)
        if (typeof user === 'string') {
            this.currentUser = { id: user, name: user };
        } else {
            this.currentUser = user;
        }
        this.notifyListeners();
    }

    /**
     * Obtiene el objeto usuario actual
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Obtiene el ID del usuario actual
     */
    getCurrentUserId() {
        return this.currentUser ? this.currentUser.id : null;
    }

    /**
     * Actualiza la lista completa de chats (directos + grupos)
     */
    setChatList(directChats, groupChats) {
        // Combinar y ordenar por último mensaje
        this.chatList = [...directChats, ...groupChats].sort(
            (a, b) => b.lastMessageTime - a.lastMessageTime
        );
        this.notifyListeners();
    }

    /**
     * Obtiene la lista de chats
     */
    getChatList() {
        return this.chatList;
    }

    /**
     * Agrega un nuevo chat a la lista
     */
    addChat(chatSummary) {
        // Verificar si ya existe
        const exists = this.chatList.some(chat => chat.chatId === chatSummary.chatId);
        if (!exists) {
            this.chatList.push(chatSummary);
            // Reordenar por último mensaje
            this.chatList.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
            this.notifyListeners();
        }
    }

    /**
     * Establece el chat activo
     */
    setActiveChat(chatSummary) {
        this.activeChat = chatSummary;
        this.activeChatMessages = [];
        this.notifyListeners();
    }

    /**
     * Obtiene el chat activo
     */
    getActiveChat() {
        return this.activeChat;
    }

    /**
     * Actualiza los mensajes del chat activo
     */
    setActiveChatMessages(messages) {
        this.activeChatMessages = messages;
        this.notifyListeners();
    }

    /**
     * Obtiene los mensajes del chat activo
     */
    getActiveChatMessages() {
        return this.activeChatMessages;
    }

    /**
     * Agrega un nuevo mensaje al chat activo
     */
    addMessageToActiveChat(message) {
        this.activeChatMessages.push(message);
        this.notifyListeners();
    }

    /**
     * Establece la lista de todos los usuarios
     */
    setAllUsers(users) {
        this.allUsers = users;
        this.notifyListeners();
    }

    /**
     * Obtiene todos los usuarios
     */
    getAllUsers() {
        return this.allUsers;
    }

    /**
     * Registra un listener para cambios de estado
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Notifica a todos los listeners
     */
    notifyListeners() {
        this.listeners.forEach(callback => callback());
    }

    /**
     * Verifica si un chat es directo o de grupo
     */
    isChatDirect(chatSummary) {
        return chatSummary.chatType === compunet.ChatType.DIRECT;
    }

    /**
     * Limpia el estado
     */
    clear() {
        this.currentUser = null;
        this.chatList = [];
        this.activeChat = null;
        this.activeChatMessages = [];
        this.allUsers = [];
        this.notifyListeners();
    }
}

// Exportar instancia singleton
export const chatState = new ChatStateManager();
