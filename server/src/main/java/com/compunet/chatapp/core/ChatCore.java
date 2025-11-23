package com.compunet.chatapp.core;

import compunet.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Clase central que gestiona la lógica de negocio del chat.
 * Mantiene todos los datos en memoria (usuarios, grupos, mensajes).
 */
public class ChatCore {
    
    // Usuarios registrados: userId -> User
    private final Map<String, User> users = new ConcurrentHashMap<>();
    
    // Grupos: groupId -> Group
    private final Map<String, Group> groups = new ConcurrentHashMap<>();
    
    // Mensajes directos: clave compuesta (userA, userB) -> lista de mensajes
    // La clave se normaliza alfabéticamente para que (A,B) y (B,A) sean la misma conversación
    private final Map<String, List<Message>> directMessages = new ConcurrentHashMap<>();
    
    // Mensajes de grupo: groupId -> lista de mensajes
    private final Map<String, List<Message>> groupMessages = new ConcurrentHashMap<>();
    
    // Generadores de IDs
    private final AtomicLong messageIdCounter = new AtomicLong(1);
    private final AtomicLong groupIdCounter = new AtomicLong(1);
    
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
        
        String conversationKey = getConversationKey(fromUserId, toUserId);
        directMessages.computeIfAbsent(conversationKey, k -> new ArrayList<>()).add(message);
        
        System.out.println("✓ Mensaje directo enviado exitosamente: " + fromUserId + " -> " + toUserId + ": " + content);
    }
    
    public List<Message> getDirectChatMessages(String userId, String otherUserId) {
        String conversationKey = getConversationKey(userId, otherUserId);
        List<Message> messages = directMessages.get(conversationKey);
        return messages != null ? new ArrayList<>(messages) : new ArrayList<>();
    }
    
    public List<ChatSummary> getUserDirectChats(String userId) {
        List<ChatSummary> chats = new ArrayList<>();
        
        for (Map.Entry<String, List<Message>> entry : directMessages.entrySet()) {
            String[] participants = entry.getKey().split(":");
            String otherUserId = null;
            
            if (participants[0].equals(userId)) {
                otherUserId = participants[1];
            } else if (participants[1].equals(userId)) {
                otherUserId = participants[0];
            }
            
            if (otherUserId != null) {
                List<Message> messages = entry.getValue();
                if (!messages.isEmpty()) {
                    Message lastMsg = messages.get(messages.size() - 1);
                    User otherUser = users.get(otherUserId);
                    
                    ChatSummary summary = new ChatSummary();
                    summary.chatId = otherUserId;
                    summary.chatName = otherUser != null ? otherUser.name : otherUserId;
                    summary.lastMessage = lastMsg.content;
                    summary.lastMessageTime = lastMsg.timestamp;
                    summary.chatType = ChatType.DIRECT;
                    
                    chats.add(summary);
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
        
        groupMessages.computeIfAbsent(groupId, k -> new ArrayList<>()).add(message);
        
        System.out.println("Mensaje de grupo enviado: " + fromUserId + " -> " + groupId + ": " + content);
    }
    
    public List<Message> getGroupChatMessages(String userId, String groupId) {
        Group group = groups.get(groupId);
        if (group == null) {
            throw new IllegalArgumentException("Grupo no encontrado");
        }
        
        if (!group.memberIds.contains(userId)) {
            throw new IllegalArgumentException("Usuario no es miembro del grupo");
        }
        
        List<Message> messages = groupMessages.get(groupId);
        return messages != null ? new ArrayList<>(messages) : new ArrayList<>();
    }
    
    public List<ChatSummary> getUserGroupChats(String userId) {
        List<ChatSummary> chats = new ArrayList<>();
        
        for (Group group : groups.values()) {
            if (group.memberIds.contains(userId)) {
                List<Message> messages = groupMessages.get(group.id);
                
                ChatSummary summary = new ChatSummary();
                summary.chatId = group.id;
                summary.chatName = group.name;
                summary.chatType = ChatType.GROUP;
                
                if (messages != null && !messages.isEmpty()) {
                    Message lastMsg = messages.get(messages.size() - 1);
                    summary.lastMessage = lastMsg.senderName + ": " + lastMsg.content;
                    summary.lastMessageTime = lastMsg.timestamp;
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
}
