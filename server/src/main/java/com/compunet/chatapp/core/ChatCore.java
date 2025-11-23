package com.compunet.chatapp.core;

import compunet.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.stream.Collectors;

/**
 * Clase central que gestiona la lógica de negocio del chat.
 * Mantiene todos los datos en memoria (usuarios, grupos, mensajes).
 */
public class ChatCore {
    
    // Usuarios registrados: userId -> User
    private final Map<String, User> users = new ConcurrentHashMap<>();
    
    // Grupos: groupId -> Group
    private final Map<String, Group> groups = new ConcurrentHashMap<>();
    
    // Mensajes directos: clave compuesta (userA, userB) -> cola de mensajes thread-safe
    // La clave se normaliza alfabéticamente para que (A,B) y (B,A) sean la misma conversación
    private final Map<String, Queue<Message>> directMessages = new ConcurrentHashMap<>();
    
    // Mensajes de grupo: groupId -> cola de mensajes thread-safe
    private final Map<String, Queue<Message>> groupMessages = new ConcurrentHashMap<>();
    
    // Llamadas de voz: callId -> VoiceCall
    private final Map<String, VoiceCall> voiceCalls = new ConcurrentHashMap<>();
    
    // Señales WebRTC pendientes: userId -> Queue<WebRTCSignal>
    private final Map<String, Queue<WebRTCSignal>> webrtcSignals = new ConcurrentHashMap<>();
    
    // Generadores de IDs
    private final AtomicLong messageIdCounter = new AtomicLong(1);
    private final AtomicLong groupIdCounter = new AtomicLong(1);
    private final AtomicLong callIdCounter = new AtomicLong(1);
    
    // Clase interna para representar un grupo
    private static class Group {
        String id;
        String name;
        String ownerId;
        Set<String> memberIds;
        
        Group(String id, String name, String ownerId, Set<String> memberIds) {
            this.id = id;
            this.name = name;
            this.ownerId = ownerId;
            this.memberIds = new HashSet<>(memberIds);
        }
    }
    
    // ========== Métodos para usuarios ==========
    
    public synchronized boolean registerUser(String userId, String userName) {
        if (users.containsKey(userId)) {
            System.out.println("Usuario ya existe: " + userId);
            return false;
        }
        
        User user = new User();
        user.id = userId;
        user.name = userName;
        users.put(userId, user);
        System.out.println("Usuario registrado: " + userId + " (" + userName + ")");
        return true;
    }
    
    public boolean userExists(String userId) {
        return users.containsKey(userId);
    }
    
    public User findUserByName(String userName) {
        for (User user : users.values()) {
            if (user.name.equalsIgnoreCase(userName)) {
                return user;
            }
        }
        return null;
    }
    
    public User findUserById(String userId) {
        return users.get(userId);
    }
    
    public List<User> getAllUsers() {
        return new ArrayList<>(users.values());
    }
    
    public User getUser(String userId) {
        return users.get(userId);
    }
    
    // ========== Métodos para mensajes directos ==========
    
    public void sendDirectMessage(String fromUserId, String toUserId, String content) {
        System.out.println("=== sendDirectMessage llamado ===");
        System.out.println("From: " + fromUserId);
        System.out.println("To: " + toUserId);
        System.out.println("Content: " + content);
        System.out.println("Usuarios registrados: " + users.keySet());
        
        User sender = users.get(fromUserId);
        User recipient = users.get(toUserId);
        
        if (sender == null || recipient == null) {
            String error = "Usuario no encontrado - Sender: " + (sender != null) + ", Recipient: " + (recipient != null);
            System.err.println(error);
            throw new IllegalArgumentException(error);
        }
        
        Message message = new Message();
        message.id = String.valueOf(messageIdCounter.getAndIncrement());
        message.senderId = fromUserId;
        message.senderName = sender.name;
        message.recipientId = toUserId;
        message.content = content;
        message.timestamp = System.currentTimeMillis();
        message.chatType = ChatType.DIRECT;
        message.messageType = MessageType.TEXT;
        message.audioDuration = 0;
        
        String conversationKey = getConversationKey(fromUserId, toUserId);
        directMessages.computeIfAbsent(conversationKey, k -> new ConcurrentLinkedQueue<>()).add(message);
        
        System.out.println("✓ Mensaje directo enviado exitosamente: " + fromUserId + " -> " + toUserId + ": " + content);
    }
    
    public void sendDirectAudio(String fromUserId, String toUserId, String audioBase64, int duration) {
        System.out.println("=== sendDirectAudio llamado ===");
        System.out.println("From: " + fromUserId);
        System.out.println("To: " + toUserId);
        System.out.println("Duration: " + duration + " segundos");
        
        User sender = users.get(fromUserId);
        User recipient = users.get(toUserId);
        
        if (sender == null || recipient == null) {
            String error = "Usuario no encontrado - Sender: " + (sender != null) + ", Recipient: " + (recipient != null);
            System.err.println(error);
            throw new IllegalArgumentException(error);
        }
        
        Message message = new Message();
        message.id = String.valueOf(messageIdCounter.getAndIncrement());
        message.senderId = fromUserId;
        message.senderName = sender.name;
        message.recipientId = toUserId;
        message.content = audioBase64;
        message.timestamp = System.currentTimeMillis();
        message.chatType = ChatType.DIRECT;
        message.messageType = MessageType.AUDIO;
        message.audioDuration = duration;
        
        String conversationKey = getConversationKey(fromUserId, toUserId);
        directMessages.computeIfAbsent(conversationKey, k -> new ConcurrentLinkedQueue<>()).add(message);
        
        System.out.println("✓ Audio directo enviado exitosamente: " + fromUserId + " -> " + toUserId);
    }
    
    public List<Message> getDirectChatMessages(String userId, String otherUserId) {
        String conversationKey = getConversationKey(userId, otherUserId);
        Queue<Message> messages = directMessages.get(conversationKey);
        return messages != null ? new ArrayList<>(messages) : new ArrayList<>();
    }
    
    public List<ChatSummary> getUserDirectChats(String userId) {
        List<ChatSummary> chats = new ArrayList<>();
        
        for (Map.Entry<String, Queue<Message>> entry : directMessages.entrySet()) {
            String[] participants = entry.getKey().split(":");
            String otherUserId = null;
            
            if (participants[0].equals(userId)) {
                otherUserId = participants[1];
            } else if (participants[1].equals(userId)) {
                otherUserId = participants[0];
            }
            
            if (otherUserId != null) {
                Queue<Message> messages = entry.getValue();
                if (!messages.isEmpty()) {
                    // Obtener último mensaje de la cola
                    Message lastMsg = null;
                    for (Message msg : messages) {
                        lastMsg = msg;
                    }
                    
                    if (lastMsg != null) {
                        User otherUser = users.get(otherUserId);
                        
                        ChatSummary summary = new ChatSummary();
                        summary.chatId = otherUserId;
                        summary.chatName = otherUser != null ? otherUser.name : otherUserId;
                        summary.lastMessage = lastMsg.messageType == MessageType.AUDIO ? "🎤 Audio" : lastMsg.content;
                        summary.lastMessageTime = lastMsg.timestamp;
                        summary.chatType = ChatType.DIRECT;
                        
                        chats.add(summary);
                    }
                }
            }
        }
        
        // Ordenar por último mensaje (más reciente primero)
        chats.sort((a, b) -> Long.compare(b.lastMessageTime, a.lastMessageTime));
        
        return chats;
    }
    
    private String getConversationKey(String userA, String userB) {
        // Normalizar alfabéticamente para que (A,B) y (B,A) sean la misma clave
        return userA.compareTo(userB) < 0 ? userA + ":" + userB : userB + ":" + userA;
    }
    
    // ========== Métodos para grupos ==========
    
    public String createGroup(String ownerId, String groupName, String[] memberIds) {
        if (!users.containsKey(ownerId)) {
            throw new IllegalArgumentException("Owner no encontrado");
        }
        
        String groupId = "group_" + groupIdCounter.getAndIncrement();
        Set<String> members = new HashSet<>(Arrays.asList(memberIds));
        members.add(ownerId); // El owner siempre es miembro
        
        Group group = new Group(groupId, groupName, ownerId, members);
        groups.put(groupId, group);
        
        System.out.println("Grupo creado: " + groupId + " (" + groupName + ") por " + ownerId);
        
        return groupId;
    }
    
    public void addUserToGroup(String groupId, String userId) {
        Group group = groups.get(groupId);
        if (group == null) {
            throw new IllegalArgumentException("Grupo no encontrado");
        }
        
        if (!users.containsKey(userId)) {
            throw new IllegalArgumentException("Usuario no encontrado");
        }
        
        group.memberIds.add(userId);
        System.out.println("Usuario " + userId + " agregado al grupo " + groupId);
    }
    
    public void sendGroupMessage(String fromUserId, String groupId, String content) {
        Group group = groups.get(groupId);
        if (group == null) {
            throw new IllegalArgumentException("Grupo no encontrado");
        }
        
        if (!group.memberIds.contains(fromUserId)) {
            throw new IllegalArgumentException("Usuario no es miembro del grupo");
        }
        
        User sender = users.get(fromUserId);
        
        Message message = new Message();
        message.id = String.valueOf(messageIdCounter.getAndIncrement());
        message.senderId = fromUserId;
        message.senderName = sender != null ? sender.name : fromUserId;
        message.recipientId = groupId;
        message.content = content;
        message.timestamp = System.currentTimeMillis();
        message.chatType = ChatType.GROUP;
        message.messageType = MessageType.TEXT;
        message.audioDuration = 0;
        
        groupMessages.computeIfAbsent(groupId, k -> new ConcurrentLinkedQueue<>()).add(message);
        
        System.out.println("Mensaje de grupo enviado: " + fromUserId + " -> " + groupId + ": " + content);
    }
    
    public void sendGroupAudio(String fromUserId, String groupId, String audioBase64, int duration) {
        System.out.println("=== sendGroupAudio llamado ===");
        Group group = groups.get(groupId);
        if (group == null) {
            throw new IllegalArgumentException("Grupo no encontrado");
        }
        
        if (!group.memberIds.contains(fromUserId)) {
            throw new IllegalArgumentException("Usuario no es miembro del grupo");
        }
        
        User sender = users.get(fromUserId);
        
        Message message = new Message();
        message.id = String.valueOf(messageIdCounter.getAndIncrement());
        message.senderId = fromUserId;
        message.senderName = sender != null ? sender.name : fromUserId;
        message.recipientId = groupId;
        message.content = audioBase64;
        message.timestamp = System.currentTimeMillis();
        message.chatType = ChatType.GROUP;
        message.messageType = MessageType.AUDIO;
        message.audioDuration = duration;
        
        groupMessages.computeIfAbsent(groupId, k -> new ConcurrentLinkedQueue<>()).add(message);
        
        System.out.println("✓ Audio de grupo enviado: " + fromUserId + " -> " + groupId + " (" + duration + "s)");
    }
    
    public List<Message> getGroupChatMessages(String userId, String groupId) {
        Group group = groups.get(groupId);
        if (group == null) {
            throw new IllegalArgumentException("Grupo no encontrado");
        }
        
        if (!group.memberIds.contains(userId)) {
            throw new IllegalArgumentException("Usuario no es miembro del grupo");
        }
        
        Queue<Message> messages = groupMessages.get(groupId);
        return messages != null ? new ArrayList<>(messages) : new ArrayList<>();
    }
    
    public List<ChatSummary> getUserGroupChats(String userId) {
        List<ChatSummary> chats = new ArrayList<>();
        
        for (Group group : groups.values()) {
            if (group.memberIds.contains(userId)) {
                Queue<Message> messages = groupMessages.get(group.id);
                
                ChatSummary summary = new ChatSummary();
                summary.chatId = group.id;
                summary.chatName = group.name;
                summary.chatType = ChatType.GROUP;
                
                if (messages != null && !messages.isEmpty()) {
                    // Obtener último mensaje de la cola
                    Message lastMsg = null;
                    for (Message msg : messages) {
                        lastMsg = msg;
                    }
                    
                    if (lastMsg != null) {
                        String content = lastMsg.messageType == MessageType.AUDIO ? "🎤 Audio" : lastMsg.content;
                        summary.lastMessage = lastMsg.senderName + ": " + content;
                        summary.lastMessageTime = lastMsg.timestamp;
                    }
                } else {
                    summary.lastMessage = "";
                    summary.lastMessageTime = 0;
                }
                
                chats.add(summary);
            }
        }
        
        // Ordenar por último mensaje (más reciente primero)
        chats.sort((a, b) -> Long.compare(b.lastMessageTime, a.lastMessageTime));
        
        return chats;
    }
    
    // ========== Métodos para llamadas de voz directas ==========
    
    public String startDirectCall(String callerId, String recipientId) {
        if (!users.containsKey(callerId) || !users.containsKey(recipientId)) {
            throw new IllegalArgumentException("Usuario no encontrado");
        }
        
        String callId = "call_" + callIdCounter.getAndIncrement();
        User caller = users.get(callerId);
        
        VoiceCall call = new VoiceCall();
        call.callId = callId;
        call.callerId = callerId;
        call.callerName = caller.name;
        call.recipientId = recipientId;
        call.startTime = System.currentTimeMillis();
        call.endTime = 0;
        call.status = CallStatus.CALLING;
        call.callType = ChatType.DIRECT;
        call.participants = new String[]{callerId, recipientId};
        
        voiceCalls.put(callId, call);
        
        System.out.println("📞 Llamada directa iniciada: " + callId + " (" + caller.name + " -> " + recipientId + ")");
        return callId;
    }
    
    public void answerDirectCall(String callId, String userId) {
        VoiceCall call = voiceCalls.get(callId);
        if (call == null) {
            throw new IllegalArgumentException("Llamada no encontrada");
        }
        
        if (!call.recipientId.equals(userId)) {
            throw new IllegalArgumentException("Solo el receptor puede contestar");
        }
        
        call.status = CallStatus.ACTIVE;
        System.out.println("✓ Llamada contestada: " + callId);
    }
    
    public void rejectDirectCall(String callId, String userId) {
        VoiceCall call = voiceCalls.get(callId);
        if (call == null) {
            throw new IllegalArgumentException("Llamada no encontrada");
        }
        
        if (!call.recipientId.equals(userId)) {
            throw new IllegalArgumentException("Solo el receptor puede rechazar");
        }
        
        call.status = CallStatus.REJECTED;
        call.endTime = System.currentTimeMillis();
        System.out.println("✗ Llamada rechazada: " + callId);
    }
    
    public void endDirectCall(String callId, String userId) {
        VoiceCall call = voiceCalls.get(callId);
        if (call == null) {
            throw new IllegalArgumentException("Llamada no encontrada");
        }
        
        if (!call.callerId.equals(userId) && !call.recipientId.equals(userId)) {
            throw new IllegalArgumentException("Solo los participantes pueden terminar la llamada");
        }
        
        call.status = CallStatus.ENDED;
        call.endTime = System.currentTimeMillis();
        
        long duration = (call.endTime - call.startTime) / 1000;
        System.out.println("📞 Llamada terminada: " + callId + " (duración: " + duration + "s)");
    }
    
    public VoiceCall getCallStatus(String callId) {
        return voiceCalls.get(callId);
    }
    
    public List<VoiceCall> getActiveCallsForUser(String userId) {
        return voiceCalls.values().stream()
            .filter(call -> call.callType == ChatType.DIRECT)
            .filter(call -> call.callerId.equals(userId) || call.recipientId.equals(userId))
            .filter(call -> call.status == CallStatus.CALLING || 
                           call.status == CallStatus.RINGING || 
                           call.status == CallStatus.ACTIVE)
            .collect(Collectors.toList());
    }
    
    // ========== Métodos para llamadas de voz grupales ==========
    
    public String startGroupCall(String callerId, String groupId) {
        if (!users.containsKey(callerId)) {
            throw new IllegalArgumentException("Usuario no encontrado");
        }
        
        Group group = groups.get(groupId);
        if (group == null) {
            throw new IllegalArgumentException("Grupo no encontrado");
        }
        
        if (!group.memberIds.contains(callerId)) {
            throw new IllegalArgumentException("Usuario no es miembro del grupo");
        }
        
        String callId = "groupcall_" + callIdCounter.getAndIncrement();
        User caller = users.get(callerId);
        
        VoiceCall call = new VoiceCall();
        call.callId = callId;
        call.callerId = callerId;
        call.callerName = caller.name;
        call.recipientId = groupId;
        call.startTime = System.currentTimeMillis();
        call.endTime = 0;
        call.status = CallStatus.ACTIVE;
        call.callType = ChatType.GROUP;
        call.participants = new String[]{callerId}; // Solo el creador al inicio
        
        voiceCalls.put(callId, call);
        
        System.out.println("📞 Llamada grupal iniciada: " + callId + " en grupo " + group.name);
        return callId;
    }
    
    public void joinGroupCall(String callId, String userId) {
        VoiceCall call = voiceCalls.get(callId);
        if (call == null) {
            throw new IllegalArgumentException("Llamada no encontrada");
        }
        
        if (call.callType != ChatType.GROUP) {
            throw new IllegalArgumentException("No es una llamada grupal");
        }
        
        Group group = groups.get(call.recipientId);
        if (group == null || !group.memberIds.contains(userId)) {
            throw new IllegalArgumentException("Usuario no es miembro del grupo");
        }
        
        // Agregar participante si no está ya
        List<String> participants = new ArrayList<>(Arrays.asList(call.participants));
        if (!participants.contains(userId)) {
            participants.add(userId);
            call.participants = participants.toArray(new String[0]);
            System.out.println("✓ Usuario " + userId + " se unió a llamada grupal: " + callId);
        }
    }
    
    public void leaveGroupCall(String callId, String userId) {
        VoiceCall call = voiceCalls.get(callId);
        if (call == null) {
            throw new IllegalArgumentException("Llamada no encontrada");
        }
        
        List<String> participants = new ArrayList<>(Arrays.asList(call.participants));
        participants.remove(userId);
        call.participants = participants.toArray(new String[0]);
        
        System.out.println("✓ Usuario " + userId + " salió de llamada grupal: " + callId);
        
        // Si no quedan participantes, terminar la llamada
        if (participants.isEmpty()) {
            call.status = CallStatus.ENDED;
            call.endTime = System.currentTimeMillis();
            System.out.println("📞 Llamada grupal terminada (sin participantes): " + callId);
        }
    }
    
    public void endGroupCall(String callId, String userId) {
        VoiceCall call = voiceCalls.get(callId);
        if (call == null) {
            throw new IllegalArgumentException("Llamada no encontrada");
        }
        
        if (!call.callerId.equals(userId)) {
            throw new IllegalArgumentException("Solo el creador puede terminar la llamada grupal");
        }
        
        call.status = CallStatus.ENDED;
        call.endTime = System.currentTimeMillis();
        
        long duration = (call.endTime - call.startTime) / 1000;
        System.out.println("📞 Llamada grupal terminada: " + callId + " (duración: " + duration + "s)");
    }
    
    public List<VoiceCall> getActiveGroupCalls(String groupId) {
        return voiceCalls.values().stream()
            .filter(call -> call.callType == ChatType.GROUP)
            .filter(call -> call.recipientId.equals(groupId))
            .filter(call -> call.status == CallStatus.ACTIVE)
            .collect(Collectors.toList());
    }
    
    // ========== Métodos para señalización WebRTC ==========
    
    public void sendWebRTCSignal(String callId, String fromUserId, String toUserId, String type, String data) {
        WebRTCSignal signal = new WebRTCSignal();
        signal.callId = callId;
        signal.fromUserId = fromUserId;
        signal.toUserId = toUserId;
        signal.type = type;
        
        // Dependiendo del tipo, guardar en sdp o candidate
        if ("offer".equals(type) || "answer".equals(type)) {
            signal.sdp = data;
            signal.candidate = "";
        } else if ("ice-candidate".equals(type)) {
            signal.sdp = "";
            signal.candidate = data;
        }
        
        // Agregar señal a la cola del destinatario
        webrtcSignals.computeIfAbsent(toUserId, k -> new ConcurrentLinkedQueue<>()).add(signal);
        
        System.out.println("🔄 Señal WebRTC enviada: " + type + " de " + fromUserId + " a " + toUserId);
    }
    
    public List<WebRTCSignal> getWebRTCSignals(String userId) {
        Queue<WebRTCSignal> signals = webrtcSignals.get(userId);
        if (signals == null || signals.isEmpty()) {
            return new ArrayList<>();
        }
        
        // Retornar copia de las señales pendientes
        return new ArrayList<>(signals);
    }
    
    public void acknowledgeWebRTCSignal(String callId, String userId, int signalIndex) {
        Queue<WebRTCSignal> signals = webrtcSignals.get(userId);
        if (signals == null) return;
        
        // Convertir a lista para acceso por índice
        List<WebRTCSignal> signalList = new ArrayList<>(signals);
        if (signalIndex >= 0 && signalIndex < signalList.size()) {
            WebRTCSignal signalToRemove = signalList.get(signalIndex);
            signals.remove(signalToRemove);
            System.out.println("✓ Señal WebRTC confirmada por " + userId);
        }
    }
}
