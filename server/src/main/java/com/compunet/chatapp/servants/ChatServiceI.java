package com.compunet.chatapp.servants;

import com.compunet.chatapp.core.ChatCore;
import compunet.*;
import com.zeroc.Ice.Current;
import java.util.List;

/**
 * Implementación del servant ChatService.
 * Delega toda la lógica en ChatCore.
 */
public class ChatServiceI implements ChatService {
    
    private final ChatCore chatCore;
    
    public ChatServiceI(ChatCore chatCore) {
        this.chatCore = chatCore;
    }
    
    @Override
    public boolean registerUser(String userId, String userName, Current current) {
        try {
            return chatCore.registerUser(userId, userName);
        } catch (Exception e) {
            System.err.println("Error registrando usuario: " + e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }
    
    @Override
    public boolean userExists(String userId, Current current) {
        try {
            return chatCore.userExists(userId);
        } catch (Exception e) {
            System.err.println("Error verificando usuario: " + e.getMessage());
            return false;
        }
    }
    
    @Override
    public User findUserByName(String userName, Current current) {
        try {
            return chatCore.findUserByName(userName);
        } catch (Exception e) {
            System.err.println("Error buscando usuario por nombre: " + e.getMessage());
            return null;
        }
    }
    
    @Override
    public User findUserById(String userId, Current current) {
        try {
            return chatCore.findUserById(userId);
        } catch (Exception e) {
            System.err.println("Error buscando usuario por ID: " + e.getMessage());
            return null;
        }
    }
    
    @Override
    public void sendDirectMessage(String fromUserId, String toUserId, String content, Current current) {
        try {
            chatCore.sendDirectMessage(fromUserId, toUserId, content);
        } catch (Exception e) {
            System.err.println("Error enviando mensaje directo: " + e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }
    
    @Override
    public ChatSummary[] getUserDirectChats(String userId, Current current) {
        try {
            List<ChatSummary> chats = chatCore.getUserDirectChats(userId);
            return chats.toArray(new ChatSummary[0]);
        } catch (Exception e) {
            System.err.println("Error obteniendo chats directos: " + e.getMessage());
            return new ChatSummary[0];
        }
    }
    
    @Override
    public Message[] getDirectChatMessages(String userId, String otherUserId, Current current) {
        try {
            List<Message> messages = chatCore.getDirectChatMessages(userId, otherUserId);
            return messages.toArray(new Message[0]);
        } catch (Exception e) {
            System.err.println("Error obteniendo mensajes directos: " + e.getMessage());
            return new Message[0];
        }
    }
    
    @Override
    public User[] getAllUsers(Current current) {
        try {
            List<User> users = chatCore.getAllUsers();
            return users.toArray(new User[0]);
        } catch (Exception e) {
            System.err.println("Error obteniendo usuarios: " + e.getMessage());
            return new User[0];
        }
    }
}
