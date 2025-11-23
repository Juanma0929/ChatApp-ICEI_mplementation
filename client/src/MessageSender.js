/**
 * MessageSender.js
 * Gestiona el envío de mensajes (directos y de grupo)
 */

import { iceClient } from './IceConnectionManager';
import { chatState } from './ChatStateManager';

export class MessageSender {
    
    /**
     * Envía un mensaje según el tipo de chat activo
     */
    async sendMessage(content) {
        const activeChat = chatState.getActiveChat();
        const currentUserId = chatState.getCurrentUserId();
        
        if (!activeChat || !currentUserId) {
            throw new Error('No hay chat activo o usuario no definido');
        }

        if (!content || content.trim() === '') {
            throw new Error('El mensaje no puede estar vacío');
        }

        try {
            if (chatState.isChatDirect(activeChat)) {
                // Mensaje directo
                await iceClient.sendDirectMessage(
                    currentUserId,
                    activeChat.chatId,
                    content
                );
            } else {
                // Mensaje de grupo
                await iceClient.sendGroupMessage(
                    currentUserId,
                    activeChat.chatId,
                    content
                );
            }
            
            console.log('Mensaje enviado correctamente');
            return true;
            
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            throw error;
        }
    }

    /**
     * Envía un mensaje directo específico
     */
    async sendDirectMessage(fromUserId, toUserId, content) {
        try {
            await iceClient.sendDirectMessage(fromUserId, toUserId, content);
            console.log(`Mensaje directo enviado: ${fromUserId} -> ${toUserId}`);
            return true;
        } catch (error) {
            console.error('Error al enviar mensaje directo:', error);
            throw error;
        }
    }

    /**
     * Envía un mensaje de grupo específico
     */
    async sendGroupMessage(fromUserId, groupId, content) {
        try {
            await iceClient.sendGroupMessage(fromUserId, groupId, content);
            console.log(`Mensaje de grupo enviado: ${fromUserId} -> ${groupId}`);
            return true;
        } catch (error) {
            console.error('Error al enviar mensaje de grupo:', error);
            throw error;
        }
    }
}

// Exportar instancia singleton
export const messageSender = new MessageSender();
