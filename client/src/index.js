/**
 * index.js
 * Punto de entrada de la aplicación
 */

import './styles.css';
import { iceClient } from './IceConnectionManager';
import { chatState } from './ChatStateManager';
import { messageReceiver } from './MessageReceiver';
import { uiController } from './ChatUIController';
import { RegistrationManager } from './registrationManager';
import { GroupManager } from './groupManager';

// Variable global para el registration manager y group manager
let registrationManager;
let groupManager;
let refreshInterval = null;

/**
 * Inicia la carga de datos y el polling automático
 */
export async function startApp() {
    console.log('Cargando datos iniciales...');
    
    // Cargar usuarios y chats
    await messageReceiver.loadAllUsers();
    await messageReceiver.loadAllChats();
    
    // Si hay chats, cargar mensajes del primero
    const chatList = chatState.getChatList();
    if (chatList.length > 0) {
        chatState.setActiveChat(chatList[0]);
        await messageReceiver.loadChatMessages(chatList[0]);
    }
    
    // Iniciar polling cada 3 segundos para actualizar mensajes
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(async () => {
        const activeChat = chatState.getActiveChat();
        if (activeChat) {
            await messageReceiver.loadChatMessages(activeChat);
        }
        await messageReceiver.loadAllChats();
    }, 3000);
    
    console.log('Aplicación completamente iniciada');
}

/**
 * Inicializa la aplicación
 */
async function initApp() {
    const loadingOverlay = document.getElementById('loading-overlay');
    
    try {
        console.log('Iniciando aplicación...');
        
        // 1. Inicializar UI Controller
        uiController.init();
        
        // 2. Conectar con el servidor Ice
        await iceClient.initialize();
        
        // 3. Inicializar el Registration Manager
        registrationManager = new RegistrationManager(iceClient, chatState);
        
        // 4. Inicializar el Group Manager
        groupManager = new GroupManager(iceClient, chatState);
        
        // 5. Ocultar loading overlay y mostrar modal de registro
        loadingOverlay.classList.add('hidden');
        registrationManager.showRegisterModal();
        
        console.log('Aplicación iniciada - Esperando registro de usuario');
        
        // Nota: Ya no cargamos chats ni usuarios hasta después del registro
        
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        loadingOverlay.innerHTML = `
            <div style="text-align: center;">
                <h2 style="color: #ff4444; margin-bottom: 20px;">❌ Error de conexión</h2>
                <p style="color: #8696a0; margin-bottom: 10px;">No se pudo conectar con el servidor</p>
                <p style="color: #8696a0; margin-bottom: 20px;">Asegúrate de que el servidor esté ejecutándose</p>
                <button onclick="location.reload()" style="
                    padding: 12px 24px;
                    background-color: #00a884;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 15px;
                    cursor: pointer;
                ">Reintentar</button>
            </div>
        `;
    }
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Limpiar al cerrar la ventana
window.addEventListener('beforeunload', () => {
    if (refreshInterval) clearInterval(refreshInterval);
    if (iceClient.isConnected()) {
        iceClient.destroy();
    }
});

// Exportar groupManager para uso en ChatUIController
export { groupManager };
