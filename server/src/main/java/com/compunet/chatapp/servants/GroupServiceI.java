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
    public void sendGroupAudio(String fromUserId, String groupId, String audioBase64, int duration, Current current) {
        try {
            chatCore.sendGroupAudio(fromUserId, groupId, audioBase64, duration);
        } catch (Exception e) {
            System.err.println("Error enviando audio a grupo: " + e.getMessage());
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
    
    // ========== Métodos de llamadas de voz grupales ==========
    
    @Override
    public String startGroupCall(String callerId, String groupId, Current current) {
        try {
            return chatCore.startGroupCall(callerId, groupId);
        } catch (Exception e) {
            System.err.println("Error iniciando llamada grupal: " + e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }
    
    @Override
    public void joinGroupCall(String callId, String userId, Current current) {
        try {
            chatCore.joinGroupCall(callId, userId);
        } catch (Exception e) {
            System.err.println("Error uniéndose a llamada grupal: " + e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }
    
    @Override
    public void leaveGroupCall(String callId, String userId, Current current) {
        try {
            chatCore.leaveGroupCall(callId, userId);
        } catch (Exception e) {
            System.err.println("Error saliendo de llamada grupal: " + e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }
    
    @Override
    public void endGroupCall(String callId, String userId, Current current) {
        try {
            chatCore.endGroupCall(callId, userId);
        } catch (Exception e) {
            System.err.println("Error terminando llamada grupal: " + e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }
    
    @Override
    public VoiceCall[] getActiveGroupCalls(String groupId, Current current) {
        try {
            List<VoiceCall> calls = chatCore.getActiveGroupCalls(groupId);
            return calls.toArray(new VoiceCall[0]);
        } catch (Exception e) {
            System.err.println("Error obteniendo llamadas grupales activas: " + e.getMessage());
            return new VoiceCall[0];
        }
    }
}
