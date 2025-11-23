/**
 * MessageReceiver.js
 * Gestiona la recepción/consulta de mensajes desde el servidor
 */

import { iceClient } from './IceConnectionManager';
import { chatState } from './ChatStateManager';

export class MessageReceiver {
    
    /**
     * Carga todos los chats del usuario actual
     */
    async loadAllChats() {
        const userId = chatState.getCurrentUserId();
        if (!userId) {
            throw new Error('Usuario no definido');
        }

        try {
            // Obtener chats directos y de grupo en paralelo
            const [directChats, groupChats] = await Promise.all([
                iceClient.getUserDirectChats(userId),
                iceClient.getUserGroupChats(userId)
            ]);

            chatState.setChatList(directChats, groupChats);
            console.log(`Chats cargados: ${directChats.length} directos, ${groupChats.length} grupos`);
            
        } catch (error) {
            console.error('Error al cargar chats:', error);
            throw error;
        }
    }

    /**
     * Carga los mensajes de un chat específico
     */
    async loadChatMessages(chatSummary) {
        const userId = chatState.getCurrentUserId();
        if (!userId) {
            throw new Error('Usuario no definido');
        }

        try {
            let messages;
            
            if (chatState.isChatDirect(chatSummary)) {
                // Chat directo
                messages = await iceClient.getDirectChatMessages(
                    userId,
                    chatSummary.chatId
                );
            } else {
                // Chat de grupo
                messages = await iceClient.getGroupChatMessages(
                    userId,
                    chatSummary.chatId
                );
            }

            chatState.setActiveChatMessages(messages);
            console.log(`Mensajes cargados: ${messages.length}`);
            
        } catch (error) {
            console.error('Error al cargar mensajes:', error);
            throw error;
        }
    }

    /**
     * Recarga los mensajes del chat activo
     */
    async reloadActiveChat() {
        const activeChat = chatState.getActiveChat();
        if (!activeChat) {
            return;
        }

        try {
            await this.loadChatMessages(activeChat);
        } catch (error) {
            console.error('Error al recargar chat activo:', error);
        }
    }

    /**
     * Carga la lista de todos los usuarios
     */
    async loadAllUsers() {
        try {
            const users = await iceClient.getAllUsers();
            chatState.setAllUsers(users);
            console.log(`Usuarios cargados: ${users.length}`);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            throw error;
        }
    }

    /**
     * Actualiza tanto chats como mensajes del chat activo
     */
    async refreshAll() {
        try {
            await this.loadAllChats();
            await this.reloadActiveChat();
        } catch (error) {
            console.error('Error al refrescar:', error);
        }
    }
}

// Exportar instancia singleton
export const messageReceiver = new MessageReceiver();
