/**
 * ClientConfig.js
 * Gestiona la configuración del cliente Ice
 */

class ClientConfig {
    constructor() {
        // Configuración por defecto
        this.config = {
            host: 'localhost',
            port: 10001,
            protocol: 'ws',
            chatServiceIdentity: 'chatService',
            groupServiceIdentity: 'groupService',
            connectionTimeout: 120000,
            acmTimeout: 60
        };
    }

    /**
     * Carga la configuración desde un archivo .config
     * En un entorno de navegador, esto se haría mediante fetch
     */
    async loadFromFile(configPath = 'config/client.config') {
        try {
            const response = await fetch(configPath);
            if (!response.ok) {
                console.warn(`⚠ No se pudo cargar ${configPath}, usando valores por defecto`);
                return;
            }

            const text = await response.text();
            this.parseConfig(text);
            console.log('✓ Configuración del cliente cargada desde:', configPath);
        } catch (error) {
            console.warn('⚠ Error al cargar configuración, usando valores por defecto:', error.message);
        }
    }

    /**
     * Parsea el contenido del archivo .config
     */
    parseConfig(text) {
        const lines = text.split('\n');
        
        for (let line of lines) {
            line = line.trim();
            
            // Ignorar comentarios y líneas vacías
            if (line.startsWith('#') || line === '') {
                continue;
            }

            // Parsear línea key=value
            const [key, value] = line.split('=').map(s => s.trim());
            
            if (!key || !value) continue;

            switch (key) {
                case 'Ice.Default.Host':
                    this.config.host = value;
                    break;
                case 'Ice.Default.Port':
                    this.config.port = parseInt(value);
                    break;
                case 'Ice.Default.Protocol':
                    this.config.protocol = value;
                    break;
                case 'ChatService.Proxy':
                    // Extraer identity del proxy
                    const chatMatch = value.match(/^(\w+):/);
                    if (chatMatch) this.config.chatServiceIdentity = chatMatch[1];
                    break;
                case 'GroupService.Proxy':
                    // Extraer identity del proxy
                    const groupMatch = value.match(/^(\w+):/);
                    if (groupMatch) this.config.groupServiceIdentity = groupMatch[1];
                    break;
                case 'Ice.Connection.IdleTimeout':
                    this.config.connectionTimeout = parseInt(value);
                    break;
                case 'Ice.ACM.Timeout':
                    this.config.acmTimeout = parseInt(value);
                    break;
            }
        }
    }

    /**
     * Obtiene el string del proxy para un servicio
     */
    getProxyString(serviceIdentity) {
        return `${serviceIdentity}:${this.config.protocol} -h ${this.config.host} -p ${this.config.port}`;
    }

    /**
     * Obtiene el proxy del ChatService
     */
    getChatServiceProxy() {
        return this.getProxyString(this.config.chatServiceIdentity);
    }

    /**
     * Obtiene el proxy del GroupService
     */
    getGroupServiceProxy() {
        return this.getProxyString(this.config.groupServiceIdentity);
    }

    /**
     * Obtiene toda la configuración
     */
    getConfig() {
        return { ...this.config };
    }
}

// Exportar instancia singleton
export default new ClientConfig();
