module compunet {
    // Estructuras de datos básicas
    
    struct User {
        string id;
        string name;
    }
    
    enum ChatType {
        DIRECT,
        GROUP
    }
    
    enum MessageType {
        TEXT,
        AUDIO
    }
    
    struct Message {
        string id;
        string senderId;
        string senderName;
        string recipientId; // userId para directo, groupId para grupo
        string content; // texto o base64 del audio
        long timestamp;
        ChatType chatType;
        MessageType messageType;
        int audioDuration; // duración en segundos (solo para audio)
    }
    
    struct ChatSummary {
        string chatId; // userId del otro usuario o groupId
        string chatName; // nombre del contacto o grupo
        string lastMessage;
        long lastMessageTime;
        ChatType chatType;
    }
    
    sequence<string> StringSeq;
    sequence<Message> MessageSeq;
    sequence<ChatSummary> ChatSummarySeq;
    sequence<User> UserSeq;
    
    // Interfaz para gestión de chats directos
    interface ChatService {
        // Registrar un usuario (retorna true si se registró, false si ya existía)
        bool registerUser(string userId, string userName);
        
        // Verificar si un usuario existe
        bool userExists(string userId);
        
        // Buscar usuario por nombre (retorna el User si existe, null si no)
        User findUserByName(string userName);
        
        // Buscar usuario por ID
        User findUserById(string userId);
        
        // Enviar mensaje directo entre dos usuarios
        void sendDirectMessage(string fromUserId, string toUserId, string content);
        
        // Enviar audio directo entre dos usuarios
        void sendDirectAudio(string fromUserId, string toUserId, string audioBase64, int duration);
        
        // Obtener lista de chats directos de un usuario
        ChatSummarySeq getUserDirectChats(string userId);
        
        // Obtener mensajes de un chat directo específico
        MessageSeq getDirectChatMessages(string userId, string otherUserId);
        
        // Obtener todos los usuarios registrados (para UI)
        UserSeq getAllUsers();
    }
    
    // Interfaz para gestión de grupos
    interface GroupService {
        // Crear un nuevo grupo
        string createGroup(string ownerId, string groupName, StringSeq memberIds);
        
        // Agregar usuario a un grupo existente
        void addUserToGroup(string groupId, string userId);
        
        // Enviar mensaje a un grupo
        void sendGroupMessage(string fromUserId, string groupId, string content);
        
        // Enviar audio a un grupo
        void sendGroupAudio(string fromUserId, string groupId, string audioBase64, int duration);
        
        // Obtener lista de grupos de un usuario
        ChatSummarySeq getUserGroupChats(string userId);
        
        // Obtener mensajes de un grupo específico
        MessageSeq getGroupChatMessages(string userId, string groupId);
    }
}
