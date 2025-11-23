/**
 * AudioRecorder.js
 * Maneja la grabación de audio usando la API MediaRecorder
 */

export class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.startTime = null;
    }

    /**
     * Verifica si el navegador soporta grabación de audio
     */
    isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    /**
     * Solicita permisos y prepara el micrófono
     */
    async initialize() {
        if (!this.isSupported()) {
            throw new Error('Tu navegador no soporta grabación de audio');
        }

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Micrófono inicializado correctamente');
            return true;
        } catch (error) {
            console.error('Error al acceder al micrófono:', error);
            throw new Error('No se pudo acceder al micrófono. Verifica los permisos.');
        }
    }

    /**
     * Inicia la grabación de audio
     */
    async startRecording() {
        if (!this.stream) {
            await this.initialize();
        }

        this.audioChunks = [];
        this.startTime = Date.now();

        this.mediaRecorder = new MediaRecorder(this.stream);

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        };

        this.mediaRecorder.start();
        console.log('Grabación iniciada');
    }

    /**
     * Detiene la grabación y retorna el audio en base64
     */
    async stopRecording() {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
                reject(new Error('No hay grabación activa'));
                return;
            }

            this.mediaRecorder.onstop = async () => {
                const duration = Math.floor((Date.now() - this.startTime) / 1000);
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                
                // Convertir a base64
                const base64Audio = await this.blobToBase64(audioBlob);
                
                console.log(`Grabación detenida. Duración: ${duration}s`);
                
                resolve({
                    audioBase64: base64Audio,
                    duration: duration,
                    blob: audioBlob
                });
            };

            this.mediaRecorder.stop();
        });
    }

    /**
     * Cancela la grabación sin retornar nada
     */
    cancelRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.audioChunks = [];
            console.log('Grabación cancelada');
        }
    }

    /**
     * Convierte un Blob a base64
     */
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Remover el prefijo "data:audio/webm;base64,"
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Verifica si está grabando actualmente
     */
    isRecording() {
        return this.mediaRecorder && this.mediaRecorder.state === 'recording';
    }

    /**
     * Libera los recursos del micrófono
     */
    release() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            console.log('Micrófono liberado');
        }
    }
}

// Exportar instancia singleton
export const audioRecorder = new AudioRecorder();
