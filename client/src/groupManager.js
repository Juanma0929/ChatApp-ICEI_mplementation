/**
 * groupManager.js
 * Maneja la creación de grupos
 */

export class GroupManager {
    constructor(iceConnection, stateManager) {
        this.iceConnection = iceConnection;
        this.stateManager = stateManager;
        
        this.groupModal = document.getElementById('group-modal');
        this.groupForm = document.getElementById('group-form');
        this.groupNameInput = document.getElementById('group-name-input');
        this.groupSearchInput = document.getElementById('group-search-input');
        this.groupSearchButton = document.getElementById('group-search-button');
        this.groupSearchResult = document.getElementById('group-search-result');
        this.membersList = document.getElementById('members-list');
        this.closeGroupButton = document.getElementById('close-group-button');
        
        this.selectedMembers = [];
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Cerrar modal
        this.closeGroupButton.addEventListener('click', () => {
            this.closeModal();
        });

        // Buscar usuario para agregar
        this.groupSearchButton.addEventListener('click', async () => {
            await this.searchUser();
        });

        this.groupSearchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                await this.searchUser();
            }
        });

        // Crear grupo
        this.groupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createGroup();
        });

        // Cerrar modal al hacer clic fuera
        this.groupModal.addEventListener('click', (e) => {
            if (e.target === this.groupModal) {
                this.closeModal();
            }
        });
    }

    openModal() {
        this.groupModal.classList.add('active');
        this.groupNameInput.focus();
        this.selectedMembers = [];
        this.updateMembersList();
        this.groupSearchResult.className = 'search-result empty';
        this.groupSearchResult.textContent = 'Busca usuarios para agregar al grupo';
    }

    closeModal() {
        this.groupModal.classList.remove('active');
        this.groupForm.reset();
        this.selectedMembers = [];
        this.updateMembersList();
        this.groupSearchResult.className = 'search-result empty';
        this.groupSearchResult.textContent = 'Busca usuarios para agregar al grupo';
    }

    async searchUser() {
        const searchName = this.groupSearchInput.value.trim();
        
        if (!searchName) {
            this.groupSearchResult.className = 'search-result empty';
            this.groupSearchResult.textContent = 'Por favor ingresa un nombre';
            return;
        }

        try {
            const user = await this.iceConnection.findUserByName(searchName);
            
            if (user && user.id) {
                const currentUser = this.stateManager.getCurrentUser();
                
                // No puede agregarse a sí mismo
                if (user.id === currentUser.id) {
                    this.groupSearchResult.className = 'search-result empty';
                    this.groupSearchResult.textContent = 'No puedes agregarte a ti mismo';
                    return;
                }

                // Verificar si ya está en la lista
                if (this.selectedMembers.some(m => m.id === user.id)) {
                    this.groupSearchResult.className = 'search-result empty';
                    this.groupSearchResult.textContent = 'Este usuario ya está en la lista';
                    return;
                }

                this.displayUserResult(user);
            } else {
                this.groupSearchResult.className = 'search-result empty';
                this.groupSearchResult.textContent = `Usuario "${searchName}" no encontrado`;
            }
            
        } catch (error) {
            console.error('Error al buscar usuario:', error);
            this.groupSearchResult.className = 'search-result empty';
            this.groupSearchResult.textContent = 'Error al buscar. Intenta de nuevo.';
        }
    }

    displayUserResult(user) {
        this.groupSearchResult.className = 'search-result';
        this.groupSearchResult.innerHTML = `
            <div class="user-result">
                <div class="user-info">
                    <h4>${user.name}</h4>
                    <p>ID: ${user.id}</p>
                </div>
                <button id="add-member-btn" class="add-contact-button" type="button">
                    Agregar
                </button>
            </div>
        `;

        const addButton = document.getElementById('add-member-btn');
        addButton.addEventListener('click', () => {
            this.addMember(user);
        });
    }

    addMember(user) {
        this.selectedMembers.push(user);
        this.updateMembersList();
        this.groupSearchInput.value = '';
        this.groupSearchResult.className = 'search-result empty';
        this.groupSearchResult.textContent = `${user.name} agregado. Busca más usuarios o crea el grupo.`;
    }

    updateMembersList() {
        if (this.selectedMembers.length === 0) {
            this.membersList.textContent = 'Ninguno';
            return;
        }

        this.membersList.innerHTML = this.selectedMembers.map((member, index) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #111b21;">
                <span>${member.name}</span>
                <button 
                    class="close-button" 
                    onclick="window.removeMember(${index})" 
                    type="button"
                    style="color: #ff6b6b; font-size: 18px;"
                >×</button>
            </div>
        `).join('');

        // Exponer función global para remover miembros
        window.removeMember = (index) => {
            this.selectedMembers.splice(index, 1);
            this.updateMembersList();
        };
    }

    async createGroup() {
        const groupName = this.groupNameInput.value.trim();
        
        if (!groupName) {
            alert('Por favor ingresa un nombre para el grupo');
            return;
        }

        if (this.selectedMembers.length === 0) {
            alert('Debes agregar al menos un miembro al grupo');
            return;
        }

        try {
            const currentUser = this.stateManager.getCurrentUser();
            const memberIds = this.selectedMembers.map(m => m.id);
            
            console.log('Creando grupo:', groupName, 'con miembros:', memberIds);
            
            const groupId = await this.iceConnection.createGroup(
                currentUser.id,
                groupName,
                memberIds
            );
            
            console.log('Grupo creado con ID:', groupId);
            
            // Recargar chats para mostrar el nuevo grupo
            const { messageReceiver } = await import('./MessageReceiver');
            await messageReceiver.loadAllChats();
            
            this.closeModal();
            alert(`Grupo "${groupName}" creado exitosamente`);
            
        } catch (error) {
            console.error('Error al crear grupo:', error);
            alert('Error al crear grupo: ' + error.message);
        }
    }
}
