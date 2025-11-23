package com.compunet.chatapp;

import com.compunet.chatapp.core.ChatCore;
import com.compunet.chatapp.servants.ChatServiceI;
import com.compunet.chatapp.servants.GroupServiceI;
import com.zeroc.Ice.Communicator;
import com.zeroc.Ice.ObjectAdapter;
import com.zeroc.Ice.Util;
import com.zeroc.Ice.Identity;

/**
 * Clase principal del servidor que inicializa Ice y registra los servants.
 */
public class ServerMain {
    
    public static void main(String[] args) {
        int status = 0;
        Communicator communicator = null;
        
        try {
            // Cargar configuración desde archivo
            com.zeroc.Ice.InitializationData initData = new com.zeroc.Ice.InitializationData();
            initData.properties = Util.createProperties();
            
            // Intentar cargar el archivo de configuración
            String configPath = "config/application.config";
            try {
                initData.properties.load(configPath);
                System.out.println("✓ Configuración cargada desde: " + configPath);
            } catch (Exception e) {
                System.out.println("⚠ No se pudo cargar " + configPath + ", usando valores por defecto");
            }
            
            // Sobrescribir con argumentos de línea de comandos si existen
            initData.properties.parseCommandLineOptions("", args);
            
            // Inicializar Ice con configuración
            communicator = Util.initialize(initData);
            
            // Crear el ChatCore compartido
            ChatCore chatCore = new ChatCore();
            
            // NO inicializar datos de prueba - los usuarios se registrarán desde el cliente
            System.out.println("\nServidor iniciado sin datos de prueba.");
            System.out.println("Los usuarios se registrarán desde el cliente.\n");
            
            // Crear los ObjectAdapters desde configuración
            ObjectAdapter adapter = communicator.createObjectAdapter("ChatAdapter");
            ObjectAdapter wsAdapter = communicator.createObjectAdapter("ChatWebSocketAdapter");
            
            // Crear e instalar los servants
            ChatServiceI chatServant = new ChatServiceI(chatCore);
            GroupServiceI groupServant = new GroupServiceI(chatCore);
            
            // Registrar servants en ambos adapters (TCP y WebSocket)
            adapter.add(chatServant, Util.stringToIdentity("chatService"));
            adapter.add(groupServant, Util.stringToIdentity("groupService"));
            wsAdapter.add(chatServant, Util.stringToIdentity("chatService"));
            wsAdapter.add(groupServant, Util.stringToIdentity("groupService"));
            
            // Activar ambos adapters
            adapter.activate();
            wsAdapter.activate();
            
            // Obtener endpoints desde configuración
            String tcpEndpoints = initData.properties.getProperty("ChatAdapter.Endpoints");
            String wsEndpoints = initData.properties.getProperty("ChatWebSocketAdapter.Endpoints");
            
            System.out.println("===========================================");
            System.out.println("Servidor de Chat iniciado correctamente");
            System.out.println("===========================================");
            System.out.println("Escuchando en:");
            System.out.println("  - TCP: " + (tcpEndpoints != null ? tcpEndpoints : "localhost:10000"));
            System.out.println("  - WebSocket: " + (wsEndpoints != null ? wsEndpoints : "localhost:10001"));
            System.out.println("Servicios disponibles:");
            System.out.println("  - ChatService (identity: 'chatService')");
            System.out.println("  - GroupService (identity: 'groupService')");
            System.out.println("===========================================");
            System.out.println("Presiona Ctrl+C para detener el servidor");
            System.out.println("===========================================");
            
            // Esperar a que se detenga
            communicator.waitForShutdown();
            
        } catch (Exception e) {
            System.err.println("Error en el servidor: " + e.getMessage());
            e.printStackTrace();
            status = 1;
        } finally {
            if (communicator != null) {
                try {
                    communicator.destroy();
                } catch (Exception e) {
                    System.err.println("Error al destruir communicator: " + e.getMessage());
                    status = 1;
                }
            }
        }
        
        System.exit(status);
    }
    
    /**
     * Inicializa datos de prueba para facilitar el testing
     */
    private static void initializeTestData(ChatCore chatCore) {
        System.out.println("\nInicializando datos de prueba...");
        
        // Registrar usuarios de prueba
        chatCore.registerUser("user1", "Alice");
        chatCore.registerUser("user2", "Bob");
        chatCore.registerUser("user3", "Charlie");
        chatCore.registerUser("user4", "Diana");
        
        // Crear un par de mensajes de prueba
        chatCore.sendDirectMessage("user1", "user2", "Hola Bob!");
        chatCore.sendDirectMessage("user2", "user1", "Hola Alice! ¿Cómo estás?");
        
        // Crear un grupo de prueba
        String groupId = chatCore.createGroup("user1", "Grupo de Proyecto", 
            new String[]{"user2", "user3"});
        chatCore.sendGroupMessage("user1", groupId, "Bienvenidos al grupo!");
        
        System.out.println("Datos de prueba inicializados.\n");
    }
}
