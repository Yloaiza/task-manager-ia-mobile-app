import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { requestNotificationPermissions, scheduleTaskReminder } from '../utils/notifications';

const API_URL = 'http://localhost:8080';
const SILENCE_TIMEOUT_MS = 1500;

const colors = {
  bg: '#0B0B0C',
  surface: '#17171A',
  border: '#242427',
  text: '#EDEDED',
  textMuted: '#8A8A8D',
  accent: '#E4B463',
  dificil: '#C2645C',
  media: '#E4B463',
  facil: '#7FA88A',
};

type Task = {
  id: number;
  title: string;
  subject: string;
  dueDate: string | null;
  difficulty: string;
  completed: boolean;
};

type Status = 'idle' | 'listening' | 'submitting';

const difficultyColor = (d: string) => {
  if (d === 'dificil') return colors.dificil;
  if (d === 'facil') return colors.facil;
  return colors.media;
};

const todayLabel = () => {
  const d = new Date();
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState('');

  const transcriptRef = useRef('');
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    requestNotificationPermissions();
    fetchTasks();
  }, []);

  useSpeechRecognitionEvent('result', (event) => {
    if (event.results && event.results.length > 0) {
      const text = event.results[0].transcript;
      transcriptRef.current = text;
      setTranscript(text);
      resetSilenceTimer();
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.log('Error de voz:', event.error, event.message);
    setStatus('idle');
  });

  useSpeechRecognitionEvent('end', () => {
    submitFromVoice();
  });

  useEffect(() => {
    if (status === 'listening') {
      const pulse = (val: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(val, {
              toValue: 1,
              duration: 1400,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true }),
          ])
        );
      const a1 = pulse(ring1, 0);
      const a2 = pulse(ring2, 700);
      a1.start();
      a2.start();
      return () => {
        a1.stop();
        a2.stop();
        ring1.setValue(0);
        ring2.setValue(0);
      };
    }
  }, [status]);

  const resetSilenceTimer = () => {
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
    }
    silenceTimer.current = setTimeout(() => {
      stopListening();
    }, SILENCE_TIMEOUT_MS);
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tasks`);
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error al traer tareas:', error);
    }
  };

  const processVoiceCommand = async (text: string) => {
    if (!text.trim()) {
      setStatus('idle');
      return;
    }
    setStatus('submitting');
    try {
      const response = await fetch(`${API_URL}/api/tasks/voice-command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error('Error en la respuesta del servidor');

      const result = await response.json();

      if (result.action === 'create' && result.task?.dueDate) {
        await scheduleTaskReminder(
          result.task.title,
          result.task.subject,
          new Date(result.task.dueDate)
        );
      }

      await fetchTasks();
    } catch (error) {
      console.error('Error al procesar comando:', error);
      Alert.alert('No se pudo procesar', 'Revisa la conexion con el backend.');
    } finally {
      setStatus('idle');
      setTranscript('');
      transcriptRef.current = '';
      setManualText('');
    }
  };

  const submitFromVoice = () => {
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
    const finalText = transcriptRef.current;
    if (finalText.trim()) {
      processVoiceCommand(finalText);
    } else {
      setStatus('idle');
    }
  };

  const startListening = async () => {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      Alert.alert('Permiso necesario', 'Activa el permiso de microfono en Ajustes.');
      return;
    }
    transcriptRef.current = '';
    setTranscript('');
    setStatus('listening');
    ExpoSpeechRecognitionModule.start({
      lang: 'es-CO',
      interimResults: true,
      continuous: false,
    });
    resetSilenceTimer();
  };

  const stopListening = () => {
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
    ExpoSpeechRecognitionModule.stop();
  };

  const statusLabel = () => {
    if (status === 'listening') return transcript || 'Escuchando…';
    if (status === 'submitting') return 'Creando tarea…';
    return 'Toca para hablar';
  };

  const ringStyle = (val: Animated.Value) => ({
    opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
    transform: [
      { scale: val.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) },
    ],
  });

  const toggleComplete = async (id: number) => {
    try {
      await fetch(`${API_URL}/api/tasks/${id}/toggle-complete`, {
        method: 'PATCH',
      });
      await fetchTasks();
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.eyebrow}>TASK MANAGER</Text>
        <Text style={styles.dateLabel}>{todayLabel()}</Text>
      </View>

      <View style={styles.micSection}>
        <View style={styles.micWrapper}>
          <Animated.View style={[styles.ring, ringStyle(ring1)]} />
          <Animated.View style={[styles.ring, ringStyle(ring2)]} />
          <TouchableOpacity
            style={[styles.micButton, status === 'listening' && styles.micButtonActive]}
            onPress={status === 'listening' ? stopListening : startListening}
            disabled={status === 'submitting'}
            activeOpacity={0.85}
          >
            {status === 'submitting' ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <View style={[styles.micDot, status === 'listening' && styles.micDotActive]} />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.statusText} numberOfLines={2}>
          {statusLabel()}
        </Text>

        <TouchableOpacity onPress={() => setShowManualInput((v) => !v)}>
          <Text style={styles.manualToggle}>
            {showManualInput ? 'Ocultar' : 'Escribir en su lugar'}
          </Text>
        </TouchableOpacity>

        {showManualInput && (
          <View style={styles.manualRow}>
            <TextInput
              style={styles.manualInput}
              placeholder="Ej: examen de calculo el 20, dificil"
              placeholderTextColor={colors.textMuted}
              value={manualText}
              onChangeText={setManualText}
              multiline
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => processVoiceCommand(manualText)}
              disabled={status === 'submitting'}
            >
              <Text style={styles.sendButtonText}>→</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.eyebrow}>TAREAS · {tasks.length}</Text>
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.taskRow}
            onPress={() => toggleComplete(item.id)}
            activeOpacity={0.6}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: item.completed ? colors.textMuted : difficultyColor(item.difficulty) },
              ]}
            />
            <View style={styles.taskTextBlock}>
              <Text style={[styles.taskTitle, item.completed && styles.taskTitleDone]}>
                {item.title}
              </Text>
              <Text style={styles.taskMeta}>
                {item.subject || 'Sin materia'}
                {item.dueDate
                  ? ` · ${new Date(item.dueDate).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'short',
                    })}`
                  : ''}
              </Text>
            </View>
            {item.completed && <Text style={styles.checkMark}>✓</Text>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Todavia no hay tareas. Toca el microfono para crear una.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  dateLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  micSection: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  micWrapper: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  micButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  micDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.textMuted,
  },
  micDotActive: {
    backgroundColor: colors.bg,
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  statusText: {
    marginTop: 16,
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  manualToggle: {
    marginTop: 14,
    fontSize: 13,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 16,
    paddingHorizontal: 24,
    width: '100%',
    gap: 8,
  },
  manualInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: { fontSize: 20, fontWeight: '700', color: colors.bg },
  listHeader: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
  },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 24, paddingBottom: 24 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  taskTextBlock: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  taskMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 40,
    fontSize: 14,
    paddingHorizontal: 32,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  checkMark: {
    fontSize: 16,
    color: colors.facil,
    marginLeft: 8,
  },
});