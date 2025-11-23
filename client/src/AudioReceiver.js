/**
 * AudioReceiver.js
 * Gestiona la reproducción de mensajes de audio recibidos
 */

export class AudioReceiver {
    
    constructor() {
        this.currentAudio = null;
    }

    /**
     * Convierte base64 a Blob
     */
    base64ToBlob(base64, mimeType = 'audio/webm') {
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        return new Blob([bytes], { type: mimeType });
    }

    /**
     * Crea un elemento de audio para reproducir
     */
    createAudioElement(audioBase64) {
        const blob = this.base64ToBlob(audioBase64);
        const url = URL.createObjectURL(blob);
        
        const audio = new Audio(url);
        
        // Liberar el URL cuando termine
        audio.onended = () => {
            URL.revokeObjectURL(url);
        };
        
        return audio;
    }

    /**
     * Reproduce un audio desde base64
     */
    async playAudio(audioBase64) {
        try {
            // Detener audio actual si existe
            this.stopCurrentAudio();
            
            this.currentAudio = this.createAudioElement(audioBase64);
            await this.currentAudio.play();
            
            console.log('Reproduciendo audio');
            
        } catch (error) {
            console.error('Error al reproducir audio:', error);
            throw new Error('No se pudo reproducir el audio');
        }
    }

    /**
     * Detiene el audio actual
     */
    stopCurrentAudio() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
    }

    /**
     * Verifica si hay un audio reproduciéndose
     */
    isPlaying() {
        return this.currentAudio && !this.currentAudio.paused;
    }

    /**
     * Formatea la duración en formato MM:SS
     */
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Exportar instancia singleton
export const audioReceiver = new AudioReceiver();
