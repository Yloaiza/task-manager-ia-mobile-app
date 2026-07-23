# Task Manager Mobile

App mobile que permite crear y completar tareas academicas hablando en lenguaje natural. Cada usuario tiene su propia cuenta, sus propias tareas, y puede conectar su propio Google Calendar. Usa reconocimiento de voz nativo con deteccion automatica de silencio, notificaciones locales, y un diseño minimalista pensado para que la voz sea la forma principal de interactuar con la app.

**Backend**: https://github.com/Yloaiza/task-manager-ia-backend

## Como funciona

1. El usuario se registra o inicia sesion con email y contraseña
2. Opcionalmente, conecta su Google Calendar desde un boton en la pantalla principal (abre el navegador, autoriza con Google, y vuelve a la app)
3. Toca el boton de microfono y dice algo como *"Tengo examen de calculo el 20, es dificil"* o *"Ya complete el examen de historia"*
4. La app detecta automaticamente cuando el usuario deja de hablar (silencio de ~1.5 segundos) y envia el comando sin necesidad de tocar ningun boton adicional
5. El texto se envia al backend (Spring Boot + Groq), que decide si es una tarea nueva o una que hay que marcar como completada
6. Si es una tarea nueva con fecha, se programa una notificacion local para 1 hora antes del vencimiento y se sincroniza con el Google Calendar del usuario
7. Las tareas tambien se pueden marcar como completadas tocandolas directamente en la lista

## Stack

- **Framework**: React Native con Expo (development build, no Expo Go — requiere modulos nativos)
- **Ruteo**: Expo Router
- **Autenticacion**: JWT guardado en `expo-secure-store` (almacenamiento cifrado del dispositivo)
- **Reconocimiento de voz**: `expo-speech-recognition` (nativo del dispositivo, iOS y Android)
- **Notificaciones**: `expo-notifications` (notificaciones locales, no push remotas)
- **Navegador in-app**: `expo-web-browser` (para el flujo de conexion con Google Calendar)
- **Backend**: ver [task-manager-ia](https://github.com/Yloaiza/task-manager-ia-backend)

## Decisiones de diseño

- **Diseño minimalista en tonos oscuros**: fondo casi negro con un unico acento calido (ambar), pensado para que el boton de microfono —el elemento central de la interaccion— sea el protagonista visual, con anillos animados que pulsan mientras la app escucha.
- **Auto-envio por deteccion de silencio**: en vez de requerir que el usuario toque un boton para finalizar la grabacion, la app detecta la pausa en el habla y envia el comando automaticamente, imitando una conversacion natural.
- **Notificaciones locales en vez de push remotas**: las push notifications remotas en iOS requieren una cuenta de Apple Developer paga (99 USD/año). Se opto por notificaciones locales, programadas por el propio dispositivo al crear la tarea, evitando ese costo sin sacrificar la funcionalidad de recordatorio.
- **Sesion persistente con Secure Store**: el token JWT se guarda cifrado en el dispositivo (no en AsyncStorage plano), y se verifica en cada vez que la pantalla principal toma foco, redirigiendo al login si la sesion no es valida.
- **Migracion de libreria de voz**: el proyecto originalmente usaba `@react-native-voice/voice`, descontinuada por sus mantenedores; su configuracion de Android (basada en un repositorio de Maven dado de baja) dejaba de compilar con versiones actuales de Gradle. Se migro a `expo-speech-recognition`, activamente mantenida y compatible con EAS Build para ambas plataformas.
- **Development build en vez de Expo Go**: el reconocimiento de voz, las notificaciones y el almacenamiento seguro requieren codigo nativo que Expo Go no soporta, por lo que el proyecto se compila como development build (`expo run:ios` / EAS Build para Android).

## Pantallas

- **Login / Registro**: formulario simple con toggle entre ambos modos
- **Principal**: boton de microfono central, input de texto manual opcional, lista de tareas con indicador de dificultad por color, boton para conectar Google Calendar, boton de cerrar sesion

## Como correrlo localmente

1. Clona el repo: `npm install`
2. Asegurate de tener el backend corriendo (local o apuntando a produccion)
3. Ajusta la constante `API_URL` en `src/app/index.tsx` y `src/app/login.tsx`
4. Genera el development build:
   - iOS: `npx expo prebuild --clean && npx expo run:ios`
   - Android: `npx eas-cli build --platform android --profile preview` (compila en la nube, requiere cuenta de Expo)

## Limitaciones conocidas

- Las notificaciones push remotas no estan implementadas (ver decisiones de diseño); solo notificaciones locales.
- El reconocimiento de voz en el Simulador de iOS puede presentar inestabilidad ocasional (error `service-not-allowed`), un problema conocido del simulador; en dispositivos fisicos funciona de forma consistente.
