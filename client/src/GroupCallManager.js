/**
 * GroupCallManager.js
 * Gestiona las llamadas de voz grupales
 */

class GroupCallManager {
    constructor(iceConnectionManager, chatStateManager) {
        this.iceConnectionManager = iceConnectionManager;
        this.chatStateManager = chatStateManager;
        
        this.localStream = null;
        this.peerConnections = new Map(); // participantId -> RTCPeerConnection
        this.currentGroupCall = null;
        this.isInGroupCall = false;
        
        // Callbacks
        this.onGroupCallStarted = null;
        this.onParticipantJoined = null;
        this.onParticipantLeft = null;
        this.onGroupCallEnded = null;
    }

    /**
     * Iniciar llamada grupal
     */
    async startGroupCall(groupId) {
        try {
            const currentUser = this.chatStateManager.getCurrentUser();
            if (!currentUser) {
                throw new Error('Usuario no autenticado');
            }

            // Solicitar permisos de micrófono
            this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            
            // Iniciar llamada en el servidor
            const callId = await this.iceConnectionManager.startGroupCall(currentUser.id, groupId);
            
            this.currentGroupCall = {
                callId,
                groupId,
                isCreator: true
            };
            
            this.isInGroupCall = true;
            
            console.log('📞 Llamada grupal iniciada:', callId);
            
            // Polling para verificar nuevos participantes
            this.startGroupCallPolling();
            
            if (this.onGroupCallStarted) {
                this.onGroupCallStarted(callId, groupId);
            }
            
            return callId;
            
        } catch (error) {
            console.error('Error iniciando llamada grupal:', error);
            this.cleanup();
            throw error;
        }
    }

    /**
     * Unirse a llamada grupal
     */
    async joinGroupCall(callId, groupId) {
        try {
            const currentUser = this.chatStateManager.getCurrentUser();
            if (!currentUser) {
                throw new Error('Usuario no autenticado');
            }

            // Solicitar permisos de micrófono
            this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            
            // Unirse en el servidor
            await this.iceConnectionManager.joinGroupCall(callId, currentUser.id);
            
            this.currentGroupCall = {
                callId,
                groupId,
                isCreator: false
            };
            
            this.isInGroupCall = true;
            
            console.log('✓ Unido a llamada grupal:', callId);
            
            // Polling para verificar otros participantes
            this.startGroupCallPolling();
            
        } catch (error) {
            console.error('Error uniéndose a llamada grupal:', error);
            this.cleanup();
            throw error;
        }
    }

    /**
     * Salir de llamada grupal
     */
    async leaveGroupCall() {
        try {
            if (!this.currentGroupCall) return;
            
            const currentUser = this.chatStateManager.getCurrentUser();
            await this.iceConnectionManager.leaveGroupCall(this.currentGroupCall.callId, currentUser.id);
            
            this.cleanup();
            
        } catch (error) {
            console.error('Error saliendo de llamada grupal:', error);
            this.cleanup();
        }
    }

    /**
     * Terminar llamada grupal (solo creador)
     */
    async endGroupCall() {
        try {
            if (!this.currentGroupCall) return;
            
            const currentUser = this.chatStateManager.getCurrentUser();
            await this.iceConnectionManager.endGroupCall(this.currentGroupCall.callId, currentUser.id);
            
            if (this.onGroupCallEnded) {
                this.onGroupCallEnded(this.currentGroupCall.callId);
            }
            
            this.cleanup();
            
        } catch (error) {
            console.error('Error terminando llamada grupal:', error);
            this.cleanup();
        }
    }

    /**
     * Crear peer connection para un participante
     */
    async createPeerConnection(participantId) {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        
        // Agregar tracks locales
        this.localStream.getTracks().forEach(track => {
            pc.addTrack(track, this.localStream);
        });
        
        // Manejar tracks remotos
        pc.ontrack = (event) => {
            this.playRemoteAudio(participantId, event.streams[0]);
        };
        
        this.peerConnections.set(participantId, pc);
        
        if (this.onParticipantJoined) {
            this.onParticipantJoined(participantId);
        }
    }

    /**
     * Reproducir audio remoto de un participante
     */
    playRemoteAudio(participantId, stream) {
        let audioElement = document.getElementById(`groupAudio_${participantId}`);
        
        if (!audioElement) {
            audioElement = document.createElement('audio');
            audioElement.id = `groupAudio_${participantId}`;
            audioElement.autoplay = true;
            document.body.appendChild(audioElement);
        }
        
        audioElement.srcObject = stream;
    }

    /**
     * Polling para verificar participantes
     */
    startGroupCallPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        this.pollingInterval = setInterval(async () => {
            try {
                if (!this.currentGroupCall) {
                    clearInterval(this.pollingInterval);
                    return;
                }
                
                const status = await this.iceConnectionManager.getCallStatus(this.currentGroupCall.callId);
                
                if (status) {
                    // Verificar si la llamada terminó
                    if (status.status.value === 3) { // ENDED
                        clearInterval(this.pollingInterval);
                        if (this.onGroupCallEnded) {
                            this.onGroupCallEnded(status.callId);
                        }
                        this.cleanup();
                        return;
                    }
                    
                    // Actualizar lista de participantes
                    const currentParticipants = Array.from(this.peerConnections.keys());
                    const newParticipants = status.participants || [];
                    const currentUser = this.chatStateManager.getCurrentUser();
                    
                    // Detectar nuevos participantes
                    for (const participantId of newParticipants) {
                        if (participantId !== currentUser.id && !currentParticipants.includes(participantId)) {
                            await this.createPeerConnection(participantId);
                        }
                    }
                    
                    // Detectar participantes que salieron
                    for (const participantId of currentParticipants) {
                        if (!newParticipants.includes(participantId)) {
                            this.removePeerConnection(participantId);
                            if (this.onParticipantLeft) {
                                this.onParticipantLeft(participantId);
                            }
                        }
                    }
                }
                
            } catch (error) {
                console.error('Error en polling de llamada grupal:', error);
            }
        }, 2000); // Verificar cada 2 segundos
    }

    /**
     * Remover peer connection
     */
    removePeerConnection(participantId) {
        const pc = this.peerConnections.get(participantId);
        if (pc) {
            pc.close();
            this.peerConnections.delete(participantId);
        }
        
        // Remover elemento de audio
        const audioElement = document.getElementById(`groupAudio_${participantId}`);
        if (audioElement) {
            audioElement.remove();
        }
    }

    /**
     * Limpiar recursos
     */
    cleanup() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        
        // Cerrar todas las peer connections
        for (const [participantId, pc] of this.peerConnections) {
            pc.close();
            const audioElement = document.getElementById(`groupAudio_${participantId}`);
            if (audioElement) {
                audioElement.remove();
            }
        }
        
        this.peerConnections.clear();
        this.currentGroupCall = null;
        this.isInGroupCall = false;
    }

    /**
     * Verificar llamadas grupales activas
     */
    async checkActiveGroupCalls(groupId) {
        try {
            const activeCalls = await this.iceConnectionManager.getActiveGroupCalls(groupId);
            return activeCalls;
        } catch (error) {
            console.error('Error verificando llamadas grupales:', error);
            return [];
        }
    }
}

export default GroupCallManager;
