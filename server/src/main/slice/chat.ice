module compunet {
    // Definiciones de secuencias (deben estar antes de usarse)
    sequence<string> StringSeq;
    
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
    
    enum CallStatus {
        CALLING,      // Llamada iniciada, esperando respuesta
        RINGING,      // Sonando en el receptor
        ACTIVE,       // Llamada en progreso
        ENDED,        // Llamada terminada
        REJECTED,     // Llamada rechazada
        MISSED        // Llamada perdida
    }
    
    struct VoiceCall {
        string callId;
        string callerId;
        string callerName;
        string recipientId; // userId para directo, groupId para grupo
        long startTime;
        long endTime;
        CallStatus status;
        ChatType callType; // DIRECT o GROUP
        StringSeq participants; // IDs de participantes (para grupos)
    }
    
    // Estructuras para señalización WebRTC
    struct WebRTCSignal {
        string callId;
        string fromUserId;
        string toUserId;
        string type; // "offer", "answer", "ice-candidate"
        string sdp; // Session Description Protocol (para offer/answer)
        string candidate; // ICE candidate JSON (para ice-candidate)
    }
    
    sequence<WebRTCSignal> WebRTCSignalSeq;
    
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
    
    // Otras secuencias
    sequence<Message> MessageSeq;
    sequence<ChatSummary> ChatSummarySeq;
    sequence<User> UserSeq;
    sequence<VoiceCall> VoiceCallSeq;
    
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
        
        // ===== Llamadas de voz directas =====
        
        // Iniciar llamada directa
        string startDirectCall(string callerId, string recipientId);
        
        // Responder llamada directa
        void answerDirectCall(string callId, string userId);
        
        // Rechazar llamada directa
        void rejectDirectCall(string callId, string userId);
        
        // Terminar llamada directa
        void endDirectCall(string callId, string userId);
        
        // Obtener estado de una llamada
        VoiceCall getCallStatus(string callId);
        
        // Obtener llamadas activas de un usuario
        VoiceCallSeq getActiveCallsForUser(string userId);
        
        // ===== Señalización WebRTC =====
        
        // Enviar señal WebRTC (offer, answer, ice-candidate)
        void sendWebRTCSignal(string callId, string fromUserId, string toUserId, string type, string data);
        
        // Obtener señales WebRTC pendientes para un usuario
        WebRTCSignalSeq getWebRTCSignals(string userId);
        
        // Confirmar que una señal fue recibida (para limpiarla del servidor)
        void acknowledgeWebRTCSignal(string callId, string userId, int signalIndex);
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
        
        // ===== Llamadas de voz grupales =====
        
        // Iniciar llamada grupal
        string startGroupCall(string callerId, string groupId);
        
        // Unirse a llamada grupal
        void joinGroupCall(string callId, string userId);
        
        // Salir de llamada grupal
        void leaveGroupCall(string callId, string userId);
        
        // Terminar llamada grupal (solo el creador)
        void endGroupCall(string callId, string userId);
        
        // Obtener llamadas grupales activas
        VoiceCallSeq getActiveGroupCalls(string groupId);
    }
}
