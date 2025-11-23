package com.compunet.chatapp.servants;

import com.compunet.chatapp.core.ChatCore;
import compunet.*;
import com.zeroc.Ice.Current;
import java.util.List;

/**
 * Implementación del servant GroupService.
 * Delega toda la lógica en ChatCore.
 */
public class GroupServiceI implements GroupService {
    
    private final ChatCore chatCore;
    
    public GroupServiceI(ChatCore chatCore) {
        this.chatCore = chatCore;
    }
    
    @Override
    public String createGroup(String ownerId, String groupName, String[] memberIds, Current current) {
        try {
            return chatCore.createGroup(ownerId, groupName, memberIds);
        } catch (Exception e) {
            System.err.println("Error creando grupo: " + e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }
    
    @Override
    public void addUserToGroup(String groupId, String userId, Current current) {
        try {
            chatCore.addUserToGroup(groupId, userId);
        } catch (Exception e) {
            System.err.println("Error agregando usuario a grupo: " + e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }
    
    @Override
    public void sendGroupMessage(String fromUserId, String groupId, String content, Current current) {
        try {
            chatCore.sendGroupMessage(fromUserId, groupId, content);
        } catch (Exception e) {
            System.err.println("Error enviando mensaje a grupo: " + e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }
    
    @Override
    public ChatSummary[] getUserGroupChats(String userId, Current current) {
        try {
            List<ChatSummary> chats = chatCore.getUserGroupChats(userId);
            return chats.toArray(new ChatSummary[0]);
        } catch (Exception e) {
            System.err.println("Error obteniendo grupos: " + e.getMessage());
            return new ChatSummary[0];
        }
    }
    
    @Override
    public Message[] getGroupChatMessages(String userId, String groupId, Current current) {
        try {
            List<Message> messages = chatCore.getGroupChatMessages(userId, groupId);
            return messages.toArray(new Message[0]);
        } catch (Exception e) {
            System.err.println("Error obteniendo mensajes de grupo: " + e.getMessage());
            return new Message[0];
        }
    }
}
