*Proyecto Final – Computación en Internet (2025-2)*  
*Departamento de Computación y Sistemas Inteligentes – Universidad Icesi*  
*Profesor: Nicolás Salazar*
## Integrantes
- Juan Manuel Ramirez
- Juan Sebastían Poveda
- Santiago Estrada
- Miguel Perez Ojeda 

Aplicación de chat en tiempo real tipo WhatsApp usando ZeroC Ice middleware.

## Requisitos Previos

### Software Necesario
- **Java 11+** (JDK 11, 17 o 21)
- **ZeroC Ice 3.7.10** con herramientas de línea de comandos:
  - `slice2java` (para generar código Java)
  - `slice2js` (para generar código JavaScript)

### Instalación de ZeroC Ice

#### Windows
```bash
# Descargar desde: https://zeroc.com/downloads/ice/3.7
# Instalar y agregar al PATH:
# C:\Ice-3.7.10\bin
```

#### Linux/macOS
```bash
# Debian/Ubuntu
sudo apt-get install zeroc-ice-all-dev

# macOS (Homebrew)
brew install ice
```

Verificar instalación:
```bash
slice2java --version
slice2js --version
```

## Compilación del Proyecto

### 1. Generar Interfaces Ice (Obligatorio)

**Servidor (Java):**
```bash
cd server
slice2java --output-dir build/generated/source/ice/main/java src/main/slice/chat.ice
```

O usar Gradle (genera automáticamente):
```bash
.\gradlew :server:compileSlice
```

**Cliente (JavaScript):**
```bash
cd client
slice2js --output-dir src/generated ../server/src/main/slice/chat.ice
```

### 2. Compilar Servidor

```bash
.\gradlew :server:build
```

### 3. Compilar Cliente

```bash
cd client
npm install
npm run build
```

##  Ejecución

### Iniciar Servidor
```bash
.\gradlew :server:run
```

El servidor escuchará en:
- **TCP**: `localhost:10000`
- **WebSocket**: `localhost:10001`

**Terminal 2 - Cliente:**
```bash
cd client
npm run dev
```

**Navegador:**
```
http://localhost:8080
```


## Estructura del Proyecto

```
ChatApp_ICE_Compunet1/
├── server/                          # Backend Java
│   ├── src/main/
│   │   ├── slice/
│   │   │   └── chat.ice            # Definiciones Ice
│   │   └── java/com/compunet/chatapp/
│   │       ├── core/               # Lógica de negocio
│   │       ├── servants/           # Servants Ice
│   │       └── ServerMain.java
│   └── build.gradle
│
├── client/                          # Frontend Web
│   ├── src/
│   │   ├── generated/              # Interfaces generadas (slice2js)
│   │   ├── IceConnectionManager.js
│   │   ├── CallManager.js
│   │   ├── ChatUI.js
│   │   └── index.js
│   ├── public/
│   │   └── config/
│   │       └── client.config       # Configuración endpoints
│   └── package.json
│
└── config/
    └── application.config           # Configuración servidor
```

##  Funcionalidades

### Implementadas
- Registro y autenticación de usuarios
- Mensajes directos en tiempo real
- Mensajes de audio (grabación y reproducción)
- Grupos de chat
- Gestión de contactos
- Llamadas de voz 1-a-1 con WebRTC
- Señalización WebRTC vía Ice
- Archivos de configuración

### Tecnologías
- **Backend**: Java 11, ZeroC Ice 3.7.10, Gradle
- **Frontend**: JavaScript ES6+, Webpack 5, Ice.js 3.7.10
- **Comunicación**: Ice sobre WebSocket + TCP
- **Audio**: MediaRecorder API + WebRTC
- **Concurrencia**: ConcurrentHashMap, ConcurrentLinkedQueue

## Configuración

### Servidor (`config/application.config`)
```
ChatAdapter.Endpoints=tcp -h 0.0.0.0 -p 10000
ChatWebSocketAdapter.Endpoints=ws -h 0.0.0.0 -p 10001
```

### Cliente (`client/public/config/client.config`)
```
Ice.Default.Router=
ChatService=chatService:ws -h localhost -p 10001
GroupService=groupService:ws -h localhost -p 10001
```

---
## Deploy en Otro Computador

### Requisitos en la Máquina Destino

#### Para el Servidor
- **Java JRE 11+** (solo runtime, no necesita JDK)
- **No requiere** Ice instalado (dependencias incluidas en JAR)

Verificar Java:
```bash
java -version
# Debe mostrar: java version "11" o superior
```

#### Para el Cliente
- **Navegador web moderno** (Chrome, Firefox, Edge)
- **Servidor HTTP** (elegir uno):
  - Python 3 (más simple)
  - Node.js + http-server
  - Apache/Nginx (producción)

---

### Preparación (Máquina de Desarrollo)

#### 1. Compilar con todas las dependencias

**Servidor - Crear Fat JAR:**

Edita `server/build.gradle` y agrega después de `application { ... }`:

```gradle
jar {
    manifest {
        attributes(
            'Main-Class': 'com.compunet.chatapp.ServerMain'
        )
    }
    
    // Incluir todas las dependencias
    from {
        configurations.runtimeClasspath.collect { 
            it.isDirectory() ? it : zipTree(it) 
        }
    }
    
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}
```

**Compilar:**
```bash
.\gradlew :server:clean :server:build
```

**Cliente - Empaquetar:**
```bash
cd client
npm run build
```

#### 2. Recolectar archivos para distribuir

**Estructura de empaquetado:**
```
ChatApp-Deploy/
├── server/
│   ├── server-1.0.0.jar           (desde server/build/libs/)
│   └── application.config          (desde server/config/)
│
└── client/
    ├── index.html                  (desde client/dist/)
    ├── bundle.js
    ├── Ice.js
    ├── chat.js
    ├── styles.css
    └── config/
        └── client.config
```

**Copiar archivos:**
```bash
# Crear estructura
mkdir ChatApp-Deploy
mkdir ChatApp-Deploy\server
mkdir ChatApp-Deploy\client

# Copiar servidor
copy server\build\libs\server-1.0.0.jar ChatApp-Deploy\server\
copy server\config\application.config ChatApp-Deploy\server\

# Copiar cliente
xcopy client\dist\* ChatApp-Deploy\client\ /E /I
```

#### 3. Comprimir para transferencia
```bash
# PowerShell
Compress-Archive -Path ChatApp-Deploy -DestinationPath ChatApp.zip

# O usar WinRAR, 7-Zip, etc.
```

---

### Instalación en Máquina Destino

#### Paso 1: Descomprimir
```bash
# Extraer ChatApp.zip en cualquier ubicación
# Ejemplo: C:\Apps\ChatApp-Deploy\
```

#### Paso 2: Configurar IPs (si están en máquinas diferentes)

**Si cliente y servidor están en la MISMA máquina:**
- No cambiar nada (usar `localhost`)

**Si están en DIFERENTES máquinas:**

**Servidor - `application.config`:**
```properties
# Cambiar 0.0.0.0 por IP específica del servidor (opcional)
ChatAdapter.Endpoints=tcp -h 0.0.0.0 -p 10000
ChatWebSocketAdapter.Endpoints=ws -h 0.0.0.0 -p 10001 -r /
```

**Cliente - `config/client.config`:**
```properties
# Cambiar localhost por IP del servidor
Ice.Default.Router=
ChatService=chatService:ws -h 192.168.1.100 -p 10001
GroupService=groupService:ws -h 192.168.1.100 -p 10001
```

> **Nota:** Obtener IP del servidor con `ipconfig` (Windows) o `ifconfig` (Linux/Mac)

#### Paso 3: Configurar Firewall (si es necesario)

**Windows - Permitir puertos:**
```powershell
# Ejecutar como Administrador
New-NetFirewallRule -DisplayName "ChatApp-TCP" -Direction Inbound -Protocol TCP -LocalPort 10000 -Action Allow
New-NetFirewallRule -DisplayName "ChatApp-WebSocket" -Direction Inbound -Protocol TCP -LocalPort 10001 -Action Allow
```

**Linux:**
```bash
sudo ufw allow 10000/tcp
sudo ufw allow 10001/tcp
```

#### Paso 4: Ejecutar

**Servidor:**
```bash
cd ChatApp-Deploy\server
java -jar server-1.0.0.jar
```

**Cliente (elegir una opción):**

**Opción A - Python 3:**
```bash
cd ChatApp-Deploy\client
python -m http.server 8080
```

**Opción B - Node.js (instalar primero `npm install -g http-server`):**
```bash
cd ChatApp-Deploy\client
http-server -p 8080
```

**Opción C - Node.js serve:**
```bash
cd ChatApp-Deploy\client
npx serve -s . -l 8080
```

**Opción D - PHP (si está instalado):**
```bash
cd ChatApp-Deploy\client
php -S localhost:8080
```

#### Paso 5: Acceder

**Navegador:**
```
http://localhost:8080
```

O desde otra máquina en la red:
```
http://IP_DEL_CLIENTE:8080
```

