/**
 * IceConnectionManager.js
 * Gestiona la conexión Ice con el servidor y expone los proxies de servicios
 */

import { Ice, compunet } from './iceModules';

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
            
            // Crear communicator
            this.communicator = Ice.initialize();
            
            // Crear proxies para los servicios
            // Conectar vía WebSocket al puerto 10001
            const chatProxy = this.communicator.stringToProxy(
                "chat:ws -h localhost -p 10001"
            );
            this.chatServicePrx = await compunet.ChatServicePrx.checkedCast(chatProxy);
            
            const groupProxy = this.communicator.stringToProxy(
                "group:ws -h localhost -p 10001"
            );
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

    async getUserGroupChats(userId) {
        if (!this.groupServicePrx) throw new Error('No conectado');
        return await this.groupServicePrx.getUserGroupChats(userId);
    }

    async getGroupChatMessages(userId, groupId) {
        if (!this.groupServicePrx) throw new Error('No conectado');
        return await this.groupServicePrx.getGroupChatMessages(userId, groupId);
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
