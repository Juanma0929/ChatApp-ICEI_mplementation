/**
 * registrationManager.js
 * Maneja el registro de usuarios y búsqueda de contactos
 */

import { compunet } from './iceModules';
import { startApp } from './index';

export class RegistrationManager {
    constructor(iceConnection, stateManager) {
        this.iceConnection = iceConnection;
        this.stateManager = stateManager;
        this.registerModal = document.getElementById('register-modal');
        this.registerForm = document.getElementById('register-form');
        this.usernameInput = document.getElementById('username-input');
        this.registerError = document.getElementById('register-error');
        
        this.searchModal = document.getElementById('search-modal');
        this.searchInput = document.getElementById('search-input');
        this.searchButton = document.getElementById('search-button');
        this.searchResult = document.getElementById('search-result');
        this.closeSearchButton = document.getElementById('close-search-button');
        this.newChatButton = document.getElementById('new-chat-button');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Evento de registro
        this.registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegistration();
        });

        // Eventos de búsqueda de contactos
        this.newChatButton.addEventListener('click', () => {
            this.openSearchModal();
        });

        this.closeSearchButton.addEventListener('click', () => {
            this.closeSearchModal();
        });

        this.searchButton.addEventListener('click', async () => {
            await this.handleSearch();
        });

        this.searchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                await this.handleSearch();
            }
        });

        // Cerrar modal al hacer clic fuera
        this.searchModal.addEventListener('click', (e) => {
            if (e.target === this.searchModal) {
                this.closeSearchModal();
            }
        });
    }

    showRegisterModal() {
        this.registerModal.classList.add('active');
        this.usernameInput.focus();
    }

    hideRegisterModal() {
        this.registerModal.classList.remove('active');
    }

    async handleRegistration() {
        const username = this.usernameInput.value.trim();
        
        if (!username) {
            this.showError('Por favor ingresa un nombre');
            return;
        }

        if (username.length < 3) {
            this.showError('El nombre debe tener al menos 3 caracteres');
            return;
        }

        try {
            // Generar un ID único para el usuario (basado en timestamp y random)
            const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            console.log('Registrando usuario:', userId, username);
            
            // Llamar al método registerUser del servidor
            const registered = await this.iceConnection.registerUser(userId, username);
            
            if (registered) {
                console.log('Usuario registrado exitosamente');
                
                // Guardar el usuario actual en el estado
                this.stateManager.setCurrentUser({ id: userId, name: username });
                
                // Actualizar la UI con el nombre del usuario
                document.getElementById('current-user-name').textContent = username;
                
                // Ocultar el modal de registro
                this.hideRegisterModal();
                
                // Limpiar el formulario
                this.usernameInput.value = '';
                this.registerError.textContent = '';
                
                // Iniciar la aplicación (cargar datos y polling)
                await startApp();
                
            } else {
                this.showError('No se pudo registrar el usuario. Intenta con otro nombre.');
            }
            
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            this.showError('Error de conexión. Verifica que el servidor esté activo.');
        }
    }

    showError(message) {
        this.registerError.textContent = message;
        setTimeout(() => {
            this.registerError.textContent = '';
        }, 5000);
    }

    openSearchModal() {
        this.searchModal.classList.add('active');
        this.searchInput.focus();
        this.searchResult.className = 'search-result empty';
        this.searchResult.textContent = 'Ingresa un nombre para buscar';
    }

    closeSearchModal() {
        this.searchModal.classList.remove('active');
        this.searchInput.value = '';
        this.searchResult.className = 'search-result empty';
        this.searchResult.textContent = 'Ingresa un nombre para buscar';
    }

    async handleSearch() {
        const searchName = this.searchInput.value.trim();
        
        if (!searchName) {
            this.searchResult.className = 'search-result empty';
            this.searchResult.textContent = 'Por favor ingresa un nombre';
            return;
        }

        try {
            const user = await this.iceConnection.findUserByName(searchName);
            
            if (user && user.id) {
                // Verificar que no sea el usuario actual
                const currentUser = this.stateManager.getCurrentUser();
                if (user.id === currentUser.id) {
                    this.searchResult.className = 'search-result empty';
                    this.searchResult.textContent = 'No puedes agregarte a ti mismo';
                    return;
                }

                // Mostrar resultado con botón para agregar
                this.displayUserResult(user);
            } else {
                this.searchResult.className = 'search-result empty';
                this.searchResult.textContent = `Usuario "${searchName}" no encontrado`;
            }
            
        } catch (error) {
            console.error('Error al buscar usuario:', error);
            this.searchResult.className = 'search-result empty';
            this.searchResult.textContent = 'Error al buscar. Intenta de nuevo.';
        }
    }

    displayUserResult(user) {
        this.searchResult.className = 'search-result';
        this.searchResult.innerHTML = `
            <div class="user-result">
                <div class="user-info">
                    <h4>${user.name}</h4>
                    <p>ID: ${user.id}</p>
                </div>
                <button id="add-contact-btn" class="add-contact-button">
                    Agregar Contacto
                </button>
            </div>
        `;

        // Agregar evento al botón
        const addButton = document.getElementById('add-contact-btn');
        addButton.addEventListener('click', () => {
            this.addContact(user);
        });
    }

    async addContact(user) {
        try {
            console.log('Contacto agregado:', user);
            
            const currentUser = this.stateManager.getCurrentUser();
            
            // Enviar un mensaje inicial para crear el chat en el servidor
            // Esto asegura que el chat aparezca al recargar
            try {
                await this.iceConnection.sendDirectMessage(
                    currentUser.id, 
                    user.id, 
                    '👋 ¡Hola! Te agregué a mis contactos'
                );
                console.log('Mensaje inicial enviado al contacto');
            } catch (error) {
                console.error('Error al enviar mensaje inicial:', error);
                // Continuar incluso si falla el mensaje
            }
            
            // Recargar chats desde el servidor para mostrar el nuevo chat
            const { messageReceiver } = await import('./MessageReceiver');
            await messageReceiver.loadAllChats();
            
            // Cerrar el modal
            this.closeSearchModal();
            
            // Mostrar mensaje de éxito
            alert(`${user.name} agregado a tus contactos`);
            
        } catch (error) {
            console.error('Error al agregar contacto:', error);
            alert('Error al agregar contacto');
        }
    }
}
