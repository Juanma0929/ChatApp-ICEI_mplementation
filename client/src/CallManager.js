/**
 * CallManager.js
 * Gestiona las llamadas de voz usando WebRTC
 */

class CallManager {
    constructor(iceConnectionManager, chatStateManager) {
        this.iceConnectionManager = iceConnectionManager;
        this.chatStateManager = chatStateManager;
        
        // WebRTC
        this.localStream = null;
        this.peerConnection = null;
        this.configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
        
        // Estado de llamadas
        this.currentCall = null;
        this.isInCall = false;
        this.notifiedCalls = new Set();
        
        // Callbacks para eventos
        this.onIncomingCall = null;
        this.onCallAnswered = null;
        this.onCallEnded = null;
        this.onCallRejected = null;
    }

    /**
     * Configurar peer connection de WebRTC
     */
    async setupPeerConnection(peerId) {
        this.peerConnection = new RTCPeerConnection(this.configuration);
        
        // Agregar stream local al peer connection
        this.localStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.localStream);
        });
        
        // Manejar tracks remotos
        this.peerConnection.ontrack = (event) => {
            console.log('🎵 Audio remoto recibido');
            const remoteAudio = document.getElementById('remoteAudio');
            if (remoteAudio) {
                remoteAudio.srcObject = event.streams[0];
                remoteAudio.play().catch(e => console.error('Error reproduciendo audio:', e));
            }
        };
        
        // Manejar candidatos ICE
        this.peerConnection.onicecandidate = async (event) => {
            if (event.candidate && this.currentCall) {
                const currentUser = this.chatStateManager.getCurrentUser();
                try {
                    await this.iceConnectionManager.sendWebRTCSignal(
                        this.currentCall.callId,
                        currentUser.id,
                        peerId,
                        'ice-candidate',
                        JSON.stringify(event.candidate)
                    );
                } catch (error) {
                    console.error('Error enviando candidato ICE:', error);
                }
            }
        };
        
        // Manejar estado de conexión
        this.peerConnection.onconnectionstatechange = () => {
            console.log('Estado de conexión WebRTC:', this.peerConnection.connectionState);
            if (this.peerConnection.connectionState === 'failed' || 
                this.peerConnection.connectionState === 'disconnected') {
                this.endCall();
            }
        };
    }

    /**
     * Rechazar llamada directa
     */
    async startDirectCall(recipientId) {
        try {
            const currentUser = this.chatStateManager.getCurrentUser();
            if (!currentUser) {
                throw new Error('Usuario no autenticado');
            }

            // Solicitar permisos de micrófono
            this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            
            // Iniciar llamada en el servidor
            const callId = await this.iceConnectionManager.startDirectCall(currentUser.id, recipientId);
            
            this.currentCall = {
                callId,
                type: 'direct',
                recipientId,
                isInitiator: true
            };
            
            this.isInCall = true;
            
            // Crear peer connection
            await this.setupPeerConnection(recipientId);
            
            // Crear offer
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            
            // Enviar offer al otro peer vía servidor
            await this.iceConnectionManager.sendWebRTCSignal(
                callId,
                currentUser.id,
                recipientId,
                'offer',
                JSON.stringify(offer)
            );
            
            console.log('📞 Llamada directa iniciada:', callId);
            
            // Polling para verificar señales y estado
            this.startCallPolling();
            this.startSignalPolling();
            
            return callId;
            
        } catch (error) {
            console.error('Error iniciando llamada:', error);
            this.cleanup();
            throw error;
        }
    }

    /**
     * Contestar llamada directa
     */
    async answerDirectCall(callId) {
        try {
            const currentUser = this.chatStateManager.getCurrentUser();
            if (!currentUser) {
                throw new Error('Usuario no autenticado');
            }

            // Solicitar permisos de micrófono
            this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            
            // Contestar en el servidor
            await this.iceConnectionManager.answerDirectCall(callId, currentUser.id);
            
            // Obtener información de la llamada
            const callStatus = await this.iceConnectionManager.getCallStatus(callId);
            
            this.currentCall = {
                callId,
                type: 'direct',
                isInitiator: false,
                callerId: callStatus.callerId
            };
            
            this.isInCall = true;
            
            // Crear peer connection
            await this.setupPeerConnection(callStatus.callerId);
            
            if (this.onCallAnswered) {
                this.onCallAnswered(callId);
            }
            
            console.log('✓ Llamada contestada:', callId);
            
            // Polling para verificar señales y estado
            this.startCallPolling();
            this.startSignalPolling();
            
        } catch (error) {
            console.error('Error contestando llamada:', error);
            this.cleanup();
            throw error;
        }
    }

    /**
     * Rechazar llamada
     */
    async rejectCall(callId) {
        try {
            const currentUser = this.chatStateManager.getCurrentUser();
            await this.iceConnectionManager.rejectDirectCall(callId, currentUser.id);
            
            if (this.onCallRejected) {
                this.onCallRejected(callId);
            }
            
            this.cleanup();
            
        } catch (error) {
            console.error('Error rechazando llamada:', error);
        }
    }

    /**
     * Terminar llamada
     */
    async endCall() {
        try {
            if (!this.currentCall) return;
            
            const currentUser = this.chatStateManager.getCurrentUser();
            await this.iceConnectionManager.endDirectCall(this.currentCall.callId, currentUser.id);
            
            if (this.onCallEnded) {
                this.onCallEnded(this.currentCall.callId);
            }
            
            this.cleanup();
            
        } catch (error) {
            console.error('Error terminando llamada:', error);
            this.cleanup();
        }
    }

    /**
     * Limpiar recursos
     */
    cleanup() {
        // Detener tracks locales
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        
        // Cerrar peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        // Limpiar audio remoto
        const remoteAudio = document.getElementById('remoteAudio');
        if (remoteAudio) {
            remoteAudio.srcObject = null;
        }
        
        this.currentCall = null;
        this.isInCall = false;
        
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        
        if (this.signalPollingInterval) {
            clearInterval(this.signalPollingInterval);
            this.signalPollingInterval = null;
        }
    }

    /**
     * Polling para señales WebRTC
     */
    startSignalPolling() {
        if (this.signalPollingInterval) {
            clearInterval(this.signalPollingInterval);
        }
        
        this.signalPollingInterval = setInterval(async () => {
            try {
                const currentUser = this.chatStateManager.getCurrentUser();
                const signals = await this.iceConnectionManager.getWebRTCSignals(currentUser.id);
                
                for (let i = 0; i < signals.length; i++) {
                    const signal = signals[i];
                    
                    // Solo procesar señales de la llamada actual
                    if (!this.currentCall || signal.callId !== this.currentCall.callId) {
                        continue;
                    }
                    
                    await this.handleWebRTCSignal(signal);
                    
                    // Confirmar procesamiento de la señal
                    await this.iceConnectionManager.acknowledgeWebRTCSignal(
                        signal.callId,
                        currentUser.id,
                        i
                    );
                }
            } catch (error) {
                console.error('Error obteniendo señales WebRTC:', error);
            }
        }, 1000); // Cada segundo
    }

    /**
     * Manejar señal WebRTC recibida
     */
    async handleWebRTCSignal(signal) {
        try {
            if (signal.type === 'offer') {
                // Recibimos una oferta, crear answer
                const offer = JSON.parse(signal.sdp);
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                
                const answer = await this.peerConnection.createAnswer();
                await this.peerConnection.setLocalDescription(answer);
                
                const currentUser = this.chatStateManager.getCurrentUser();
                await this.iceConnectionManager.sendWebRTCSignal(
                    signal.callId,
                    currentUser.id,
                    signal.fromUserId,
                    'answer',
                    JSON.stringify(answer)
                );
                
                console.log('📤 Answer enviado');
                
            } else if (signal.type === 'answer') {
                // Recibimos una respuesta
                const answer = JSON.parse(signal.sdp);
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                
                console.log('📥 Answer recibido y aplicado');
                
            } else if (signal.type === 'ice-candidate') {
                // Recibimos un candidato ICE
                const candidate = JSON.parse(signal.candidate);
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                
                console.log('🧊 Candidato ICE agregado');
            }
        } catch (error) {
            console.error('Error manejando señal WebRTC:', error);
        }
    }

    /**
     * Reproducir tono de llamada
     */
    playRingTone() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            this.oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            this.oscillator.frequency.value = 440; // Tono A4
            gainNode.gain.value = 0.1; // Volumen bajo
            
            this.oscillator.start();
            
            // Detener después de 2 segundos
            setTimeout(() => {
                if (this.oscillator) {
                    this.oscillator.stop();
                }
            }, 2000);
        } catch (error) {
            console.log('No se pudo reproducir tono:', error);
        }
    }

    /**
     * Polling para verificar estado de la llamada
     */
    startCallPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        this.pollingInterval = setInterval(async () => {
            try {
                if (!this.currentCall) {
                    clearInterval(this.pollingInterval);
                    return;
                }
                
                const status = await this.iceConnectionManager.getCallStatus(this.currentCall.callId);
                
                if (status) {
                    // Verificar si la llamada terminó
                    if (status.status.value === 3 || status.status.value === 4) { // ENDED o REJECTED
                        clearInterval(this.pollingInterval);
                        this.cleanup();
                        if (status.status.value === 4 && this.onCallRejected) {
                            this.onCallRejected(status.callId);
                        } else if (this.onCallEnded) {
                            this.onCallEnded(status.callId);
                        }
                    }
                }
                
            } catch (error) {
                console.error('Error en polling de llamada:', error);
            }
        }, 1000); // Verificar cada segundo
    }

    /**
     * Verificar si hay llamadas activas
     */
    async checkActiveCalls() {
        try {
            const currentUser = this.chatStateManager.getCurrentUser();
            if (!currentUser) return [];
            
            const activeCalls = await this.iceConnectionManager.getActiveCallsForUser(currentUser.id);
            
            // Si hay una llamada entrante, notificar
            for (const call of activeCalls) {
                if (call.recipientId === currentUser.id && 
                    (call.status.value === 0 || call.status.value === 1) && // CALLING o RINGING
                    !this.notifiedCalls.has(call.callId) &&
                    !this.isInCall) {
                    
                    this.notifiedCalls.add(call.callId);
                    
                    if (this.onIncomingCall) {
                        this.onIncomingCall(call);
                    }
                }
            }
            
            return activeCalls;
            
        } catch (error) {
            console.error('Error verificando llamadas activas:', error);
            return [];
        }
    }
}

export default CallManager;
