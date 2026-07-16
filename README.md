# Task Manager Mobile

App mobile que permite crear tareas academicas hablando en lenguaje natural. Usa reconocimiento de voz nativo, se conecta a un backend con IA para extraer la informacion estructurada, y programa recordatorios locales.

## Como funciona

1. El usuario toca el boton de microfono y dice algo como *"Tengo examen de calculo el 20, es dificil"*
2. El reconocimiento de voz nativo del dispositivo transcribe el audio a texto
3. El texto se envia al backend (Spring Boot + Groq), que extrae los datos estructurados
4. La tarea se muestra en la lista y se programa una notificacion local 1 hora antes de la fecha limite

## Stack

- **Framework**: React Native con Expo (development build, no Expo Go)
- **Reconocimiento de voz**: @react-native-voice/voice (nativo del dispositivo)
- **Notificaciones**: expo-notifications (notificaciones locales, no push remotas)
- **Backend**: ver [task-manager-ia](https://github.com/TU_USUARIO/task-manager-ia)

## Decisiones de diseño

- **Notificaciones locales en vez de push remotas**: las push notifications remotas en iOS requieren una cuenta de Apple Developer paga ($99/año). Se opto por notificaciones locales, programadas por el propio dispositivo al crear la tarea, evitando ese costo sin sacrificar la funcionalidad principal (recordar al usuario antes de la fecha limite).
- **Development build en vez de Expo Go**: el reconocimiento de voz nativo requiere codigo nativo que Expo Go no soporta, por lo que el proyecto usa un development build compilado con `expo run:ios`.

## Como correrlo localmente

1. Clona el repo e instala dependencias: `npm install`
2. Asegurate de tener el backend corriendo (ver repo del backend)
3. Ajusta la constante `API_URL` en `src/app/index.tsx` con la IP de tu maquina
4. Genera el development build: `npx expo prebuild --clean && npx expo run:ios`

## Screenshots

_(agregar capturas o GIF de la app en uso)_
