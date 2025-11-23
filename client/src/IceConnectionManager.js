/**
 * IceConnectionManager.js
 * Gestiona la conexión Ice con el servidor y expone los proxies de servicios
 */

import { Ice, compunet } from './iceModules';
import ClientConfig from './ClientConfig';

class IceConnectionManager {
    constructor() {
        this.communicator = null;
        this.chatServicePrx = null;
        this.groupServicePrx = null;
        this.connected = false;
    }

    /**
     * Inicializa la conexión Ice
     */
    async initialize() {
        try {
            console.log('Inicializando conexión Ice...');
            
            // Cargar configuración
            await ClientConfig.loadFromFile('config/client.config');
            const config = ClientConfig.getConfig();
            console.log('Configuración:', config);
            
            // Crear communicator
            this.communicator = Ice.initialize();
            
            // Crear proxies para los servicios usando configuración
            const chatProxyString = ClientConfig.getChatServiceProxy();
            console.log('ChatService proxy:', chatProxyString);
            const chatProxy = this.communicator.stringToProxy(chatProxyString);
            this.chatServicePrx = await compunet.ChatServicePrx.checkedCast(chatProxy);
            
            const groupProxyString = ClientConfig.getGroupServiceProxy();
            console.log('GroupService proxy:', groupProxyString);
            const groupProxy = this.communicator.stringToProxy(groupProxyString);
            this.groupServicePrx = await compunet.GroupServicePrx.checkedCast(groupProxy);
            
            if (!this.chatServicePrx || !this.groupServicePrx) {
                throw new Error("No se pudo crear los proxies de servicios");
            }
            
            this.connected = true;
            console.log('Conexión Ice establecida correctamente');
            
        } catch (error) {
            console.error('Error al inicializar Ice:', error);
            throw error;
        }
    }

    /**
     * Verifica si está conectado
     */
    isConnected() {
        return this.connected;
    }

    // ========== Métodos de ChatService ==========

    async registerUser(userId, userName) {
        if (!this.chatServicePrx) throw new Error('No conectado');
        return await this.chatServicePrx.registerUser(userId, userName);
    }

    async userExists(userId) {
        if (!this.chatServicePrx) throw new Error('No conectado');
        return await this.chatServicePrx.userExists(userId);
    }

    async findUserByName(userName) {
        if (!this.chatServicePrx) throw new Error('No conectado');
        return await this.chatServicePrx.findUserByName(userName);
    }

    async findUserById(userId) {
        if (!this.chatServicePrx) throw new Error('No conectado');
        return await this.chatServicePrx.findUserById(userId);
    }

    async sendDirectMessage(fromUserId, toUserId, content) {
        if (!this.chatServicePrx) throw new Error('No conectado');
        await this.chatServicePrx.sendDirectMessage(fromUserId, toUserId, content);
    }

    async sendDirectAudio(fromUserId, toUserId, audioBase64, duration) {
        if (!this.chatServicePrx) throw new Error('No conectado');
        await this.chatServicePrx.sendDirectAudio(fromUserId, toUserId, audioBase64, duration);
    }

    async getUserDirectChats(userId) {
        if (!this.chatServicePrx) throw new Error('No conectado');
        return await this.chatServicePrx.getUserDirectChats(userId);
    }

    async getDirectChatMessages(userId, otherUserId) {
        if (!this.chatServicePrx) throw new Error('No conectado');
        return await this.chatServicePrx.getDirectChatMessages(userId, otherUserId);
    }

    async getAllUsers() {
        if (!this.chatServicePrx) throw new Error('No conectado');
        return await this.chatServicePrx.getAllUsers();
    }

    // ========== Métodos de GroupService ==========

    async createGroup(ownerId, groupName, memberIds) {
        if (!this.groupServicePrx) throw new Error('No conectado');
        return await this.groupServicePrx.createGroup(ownerId, groupName, memberIds);
    }

    async addUserToGroup(groupId, userId) {
        if (!this.groupServicePrx) throw new Error('No conectado');
        await this.groupServicePrx.addUserToGroup(groupId, userId);
    }

    async sendGroupMessage(fromUserId, groupId, content) {
        if (!this.groupServicePrx) throw new Error('No conectado');
        await this.groupServicePrx.sendGroupMessage(fromUserId, groupId, content);
    }

    async sendGroupAudio(fromUserId, groupId, audioBase64, duration) {
        if (!this.groupServicePrx) throw new Error('No conectado');
        await this.groupServicePrx.sendGroupAudio(fromUserId, groupId, audioBase64, duration);
    }

    async getUserGroupChats(userId) {
        if (!this.groupServicePrx) throw new Error('No conectado');
        return await this.groupServicePrx.getUserGroupChats(userId);
    }

    async getGroupChatMessages(userId, groupId) {
        if (!this.groupServicePrx) throw new Error('No conectado');
        return await this.groupServicePrx.getGroupChatMessages(userId, groupId);
    }

    // ========== Métodos de llamadas de voz directas ==========

    async startDirectCall(callerId, recipientId) {
        if (!this.chatServicePrx) throw new Error('No conectado');
        return await this.chatServicePrx.startDirectCall(callerId, recipientId);
    }

    async answerDirectCall(callId, userId) {
        if (!this.chatServicePrx) throw new Error('No conectado');
        return await this.chatServicePrx.answerDirectCall(callId, userId);
    }

    async rejectDirectCall(callId, userId) {
        if (!this.chatServicePrx) throw new Error('No conectado');
        return await this.chatServicePrx.rejectDirectCall(callId, userId);
    }

    async endDirectCall(callId, userId) {
        if (!this.chatServicePrx) throw new Error('No conectado');
        return await this.chatServicePrx.endDirectCall(callId, userId);
    }

    async getCallStatus(callId) {
        if (!this.chatServicePrx) throw new Error('No conectado');
        return await this.chatServicePrx.getCallStatus(callId);
    }

    async getActiveCallsForUser(userId) {
        if (!this.chatServicePrx) throw new Error('No conectado');
        return await this.chatServicePrx.getActiveCallsForUser(userId);
    }

    // ========== Métodos de llamadas de voz grupales ==========

    async startGroupCall(callerId, groupId) {
        if (!this.groupServicePrx) throw new Error('No conectado');
        return await this.groupServicePrx.startGroupCall(callerId, groupId);
    }

    async joinGroupCall(callId, userId) {
        if (!this.groupServicePrx) throw new Error('No conectado');
        return await this.groupServicePrx.joinGroupCall(callId, userId);
    }

    async leaveGroupCall(callId, userId) {
        if (!this.groupServicePrx) throw new Error('No conectado');
        return await this.groupServicePrx.leaveGroupCall(callId, userId);
    }

    async endGroupCall(callId, userId) {
        if (!this.groupServicePrx) throw new Error('No conectado');
        return await this.groupServicePrx.endGroupCall(callId, userId);
    }

    async getActiveGroupCalls(groupId) {
        if (!this.groupServicePrx) throw new Error('No conectado');
        return await this.groupServicePrx.getActiveGroupCalls(groupId);
    }

    // ========== Métodos de señalización WebRTC ==========

    async sendWebRTCSignal(callId, fromUserId, toUserId, type, data) {
        if (!this.chatServicePrx) throw new Error('No conectado');
        return await this.chatServicePrx.sendWebRTCSignal(callId, fromUserId, toUserId, type, data);
    }

    async getWebRTCSignals(userId) {
        if (!this.chatServicePrx) throw new Error('No conectado');
        return await this.chatServicePrx.getWebRTCSignals(userId);
    }

    async acknowledgeWebRTCSignal(callId, userId, signalIndex) {
        if (!this.chatServicePrx) throw new Error('No conectado');
        return await this.chatServicePrx.acknowledgeWebRTCSignal(callId, userId, signalIndex);
    }

    /**
     * Destruye la conexión
     */
    async destroy() {
        if (this.communicator) {
            await this.communicator.destroy();
            this.connected = false;
            console.log('Conexión Ice cerrada');
        }
    }
}

// Exportar instancia singleton
export const iceClient = new IceConnectionManager();
