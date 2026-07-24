# Task Manager Mobile

App mobile que permite crear y completar tareas académicas hablando en lenguaje natural. Cada usuario tiene su propia cuenta, sus propias tareas, y puede conectar su propio Google Calendar. Usa reconocimiento de voz nativo con detección automática de silencio, notificaciones locales, y un diseño minimalista pensado para que la voz sea la forma principal de interactuar con la app.

**Backend**: https://github.com/Yloaiza/task-manager-ia-backend
**Link de descarga**: https://expo.dev/accounts/yojxnz/projects/task-manager-mobile/builds/980cbdf9-be33-4b15-aace-398722318319

---

## 📱 Capturas de Pantalla

| Login &  registro | Pantalla Principal & tareas por texto | Pantalla Principal & Dictado|
| :---: | :---: | :---: |

| <img width="220" height="460" alt="image" src="https://github.com/user-attachments/assets/45410870-d3fe-44b0-b9ff-7f037ae3e223" />| <img width="220" height="460" alt="image" src="https://github.com/user-attachments/assets/97de9b43-c577-4f8b-a2e4-df4c33d4daf5" /> | <img width="220" height="460" alt="image" src="https://github.com/user-attachments/assets/21b53ea6-bb45-4448-b3bd-09ae19e54d99" />
 |

---

## Cómo funciona

1. El usuario se registra o inicia sesión con email y contraseña.
2. Opcionalmente, conecta su Google Calendar desde un botón en la pantalla principal (abre el navegador, autoriza con Google y vuelve a la app).
3. Toca el botón de micrófono y dice algo como *"Tengo examen de cálculo el 20, es difícil"* o *"Ya completé el examen de historia"*.
4. La app detecta automáticamente cuando el usuario deja de hablar (silencio de 4 segundos) y envía el comando sin necesidad de tocar ningún botón adicional.
5. El texto se envía al backend (Spring Boot + Groq), que decide si es una tarea nueva o una que hay que marcar como completada.
6. Si es una tarea nueva con fecha, se programa una notificación local para 1 hora antes del vencimiento y se sincroniza con el Google Calendar del usuario.
7. Las tareas también se pueden marcar como completadas tocándolas directamente en la lista.

## Cuenta de demostración

Para probar la app sin necesidad de registrarse, hay una cuenta de demo con datos de ejemplo precargados:

- **Email**: `taskmanagertest6@gmail.com`
- **Contraseña**: `test61234`

Esta cuenta ya tiene varias tareas de ejemplo (algunas completadas, otras pendientes) para mostrar el funcionamiento de la app sin pasos previos.

## Stack

- **Framework**: React Native con Expo (development build, no Expo Go — requiere módulos nativos)
- **Ruteo**: Expo Router
- **Layout & Safe Area**: `react-native-safe-area-context` (para evitar solapamientos con la status bar)
- **Autenticación**: JWT guardado en `expo-secure-store` (almacenamiento cifrado del dispositivo)
- **Reconocimiento de voz**: `expo-speech-recognition` (nativo del dispositivo, iOS y Android)
- **Notificaciones**: `expo-notifications` (notificaciones locales, no push remotas)
- **Navegador in-app**: `expo-web-browser` (para el flujo de conexión con Google Calendar)
- **Backend**: ver [task-manager-ia-backend](https://github.com/Yloaiza/task-manager-ia-backend)

## Decisiones de diseño

- **Diseño minimalista en tonos oscuros**: fondo casi negro con un único acento cálido (ámbar), pensado para que el botón de micrófono —el elemento central de la interacción— sea el protagonista visual, con anillos animados que pulsan mientras la app escucha.
- **Auto-envío por detección de silencio**: en vez de requerir que el usuario toque un botón para finalizar la grabación, la app detecta una pausa sostenida en el habla (~4s) y envía el comando automáticamente, imitando una conversación natural.
- **Optimización para Android**: se configuró la flag `continuous: false` y ajustes de silencio nativos en Android (`androidIntentOptions`) para prevenir bloqueos de los servicios de reconocimiento de Google (`service-not-allowed`).
- **Notificaciones locales en vez de push remotas**: las push notifications remotas en iOS requieren una cuenta de Apple Developer paga (99 USD/año). Se optó por notificaciones locales, programadas por el propio dispositivo al crear la tarea, evitando ese costo sin sacrificar la funcionalidad de recordatorio.
- **Sesión persistente con Secure Store**: el token JWT se guarda cifrado en el dispositivo (no en AsyncStorage plano), y se verifica cada vez que la pantalla principal toma foco, redirigiendo al login si la sesión no es válida.
- **Migración de librería de voz**: el proyecto originalmente usaba `@react-native-voice/voice`, descontinuada por sus mantenedores; su configuración de Android dejaba de compilar con versiones actuales de Gradle. Se migró a `expo-speech-recognition`, activamente mantenida y compatible con EAS Build para ambas plataformas.

## Pantallas

- **Login / Registro**: formulario simple con toggle entre ambos modos.
- **Principal**: botón de micrófono central, input de texto manual opcional, lista de tareas con indicador de dificultad por color, botón para conectar Google Calendar, botón de cerrar sesión.

## Cómo correrlo localmente

1. Clona el repo e instala dependencias: `npm install`
2. Asegúrate de tener el backend corriendo (local o apuntando a producción).
3. Ajusta la constante `API_URL` en `src/app/index.tsx` y `src/app/login.tsx`.
4. Genera el desarrollo build:
   - **iOS**: `npx expo prebuild --clean && npx expo run:ios`
   - **Android**: `npx eas-cli build --platform android --profile preview`

## Limitaciones conocidas

- Las notificaciones push remotas no están implementadas (ver decisiones de diseño); solo notificaciones locales.
- El reconocimiento de voz en el Simulador de iOS puede presentar inestabilidad ocasional (`service-not-allowed`), un problema conocido del simulador; en dispositivos físicos funciona de forma consistente.
