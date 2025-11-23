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
    public void sendDirectAudio(String fromUserId, String toUserId, String audioBase64, int duration, Current current) {
        try {
            chatCore.sendDirectAudio(fromUserId, toUserId, audioBase64, duration);
        } catch (Exception e) {
            System.err.println("Error enviando audio directo: " + e.getMessage());
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
    
    // ========== Métodos de llamadas de voz directas ==========
    
    @Override
    public String startDirectCall(String callerId, String recipientId, Current current) {
        try {
            return chatCore.startDirectCall(callerId, recipientId);
        } catch (Exception e) {
            System.err.println("Error iniciando llamada: " + e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }
    
    @Override
    public void answerDirectCall(String callId, String userId, Current current) {
        try {
            chatCore.answerDirectCall(callId, userId);
        } catch (Exception e) {
            System.err.println("Error contestando llamada: " + e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }
    
    @Override
    public void rejectDirectCall(String callId, String userId, Current current) {
        try {
            chatCore.rejectDirectCall(callId, userId);
        } catch (Exception e) {
            System.err.println("Error rechazando llamada: " + e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }
    
    @Override
    public void endDirectCall(String callId, String userId, Current current) {
        try {
            chatCore.endDirectCall(callId, userId);
        } catch (Exception e) {
            System.err.println("Error terminando llamada: " + e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }
    
    @Override
    public VoiceCall getCallStatus(String callId, Current current) {
        try {
            return chatCore.getCallStatus(callId);
        } catch (Exception e) {
            System.err.println("Error obteniendo estado de llamada: " + e.getMessage());
            return null;
        }
    }
    
    @Override
    public VoiceCall[] getActiveCallsForUser(String userId, Current current) {
        try {
            List<VoiceCall> calls = chatCore.getActiveCallsForUser(userId);
            return calls.toArray(new VoiceCall[0]);
        } catch (Exception e) {
            System.err.println("Error obteniendo llamadas activas: " + e.getMessage());
            return new VoiceCall[0];
        }
    }
    
    // ========== Métodos de señalización WebRTC ==========
    
    @Override
    public void sendWebRTCSignal(String callId, String fromUserId, String toUserId, String type, String data, Current current) {
        try {
            chatCore.sendWebRTCSignal(callId, fromUserId, toUserId, type, data);
        } catch (Exception e) {
            System.err.println("Error enviando señal WebRTC: " + e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }
    
    @Override
    public WebRTCSignal[] getWebRTCSignals(String userId, Current current) {
        try {
            List<WebRTCSignal> signals = chatCore.getWebRTCSignals(userId);
            return signals.toArray(new WebRTCSignal[0]);
        } catch (Exception e) {
            System.err.println("Error obteniendo señales WebRTC: " + e.getMessage());
            return new WebRTCSignal[0];
        }
    }
    
    @Override
    public void acknowledgeWebRTCSignal(String callId, String userId, int signalIndex, Current current) {
        try {
            chatCore.acknowledgeWebRTCSignal(callId, userId, signalIndex);
        } catch (Exception e) {
            System.err.println("Error confirmando señal WebRTC: " + e.getMessage());
        }
    }
}
