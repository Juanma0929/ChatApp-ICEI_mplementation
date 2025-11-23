/**
 * AudioSender.js
 * Gestiona el envío de mensajes de audio (directos y de grupo)
 */

import { iceClient } from './IceConnectionManager';
import { chatState } from './ChatStateManager';

export class AudioSender {
    
    /**
     * Envía un audio según el tipo de chat activo
     */
    async sendAudio(audioBase64, duration) {
        const activeChat = chatState.getActiveChat();
        const currentUserId = chatState.getCurrentUserId();
        
        if (!activeChat || !currentUserId) {
            throw new Error('No hay chat activo o usuario no definido');
        }

        if (!audioBase64 || !duration) {
            throw new Error('Datos de audio inválidos');
        }

        try {
            if (chatState.isChatDirect(activeChat)) {
                // Audio directo
                await iceClient.sendDirectAudio(
                    currentUserId,
                    activeChat.chatId,
                    audioBase64,
                    duration
                );
            } else {
                // Audio de grupo
                await iceClient.sendGroupAudio(
                    currentUserId,
                    activeChat.chatId,
                    audioBase64,
                    duration
                );
            }
            
            console.log(`Audio enviado correctamente (${duration}s)`);
            return true;
            
        } catch (error) {
            console.error('Error al enviar audio:', error);
            throw error;
        }
    }

    /**
     * Envía un audio directo específico
     */
    async sendDirectAudio(fromUserId, toUserId, audioBase64, duration) {
        try {
            await iceClient.sendDirectAudio(fromUserId, toUserId, audioBase64, duration);
            console.log(`Audio directo enviado: ${fromUserId} -> ${toUserId} (${duration}s)`);
            return true;
        } catch (error) {
            console.error('Error al enviar audio directo:', error);
            throw error;
        }
    }

    /**
     * Envía un audio de grupo específico
     */
    async sendGroupAudio(fromUserId, groupId, audioBase64, duration) {
        try {
            await iceClient.sendGroupAudio(fromUserId, groupId, audioBase64, duration);
            console.log(`Audio de grupo enviado: ${fromUserId} -> ${groupId} (${duration}s)`);
            return true;
        } catch (error) {
            console.error('Error al enviar audio de grupo:', error);
            throw error;
        }
    }
}

// Exportar instancia singleton
export const audioSender = new AudioSender();
