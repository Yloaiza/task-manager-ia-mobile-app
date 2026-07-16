import React, { useState, useEffect } from 'react';
import { requestNotificationPermissions, scheduleTaskReminder } from '../utils/notifications';
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
} from 'react-native';
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';

const API_URL = 'http://localhost:8080';

type Task = {
  id: number;
  title: string;
  subject: string;
  dueDate: string | null;
  difficulty: string;
  completed: boolean;
};

export default function App() {
  const [text, setText] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    Voice.onSpeechResults = (event: SpeechResultsEvent) => {
      if (event.value && event.value.length > 0) {
        setText(event.value[0]);
      }
    };

    Voice.onSpeechError = (event: SpeechErrorEvent) => {
      console.error('Error de voz:', event.error);
      setIsListening(false);
    };

    Voice.onSpeechEnd = () => {
      setIsListening(false);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

const startListening = async () => {
  try {
    await Voice.stop();
    await Voice.destroy();
  } catch (e) {

  }

  try {
    setText('');
    setIsListening(true);
    await Voice.start('es-CO');
  } catch (error) {
    console.error('Error al iniciar reconocimiento:', error);
    setIsListening(false);
  }
};

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Error al detener reconocimiento:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tasks`);
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error al traer tareas:', error);
      Alert.alert('Error', 'No se pudo conectar con el backend.');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);
  
useEffect(() => {
  requestNotificationPermissions();
}, []);
const handleSubmit = async () => {
  if (!text.trim()) return;

  setLoading(true);
  try {
    const response = await fetch(`${API_URL}/api/tasks/from-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('Error en la respuesta del servidor');
    }

    const createdTask = await response.json();

    if (createdTask.dueDate) {
      await scheduleTaskReminder(
        createdTask.title,
        createdTask.subject,
        new Date(createdTask.dueDate)
      );
    }

    setText('');
    await fetchTasks();
  } catch (error) {
    console.error('Error al crear tarea:', error);
    Alert.alert('Error', 'No se pudo crear la tarea.');
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Task Manager IA</Text>

      <TextInput
        style={styles.input}
        placeholder="Ej: Tengo examen de calculo el 20, es dificil"
        value={text}
        onChangeText={setText}
        multiline
      />

      <TouchableOpacity
        style={[styles.micButton, isListening && styles.micButtonActive]}
        onPress={isListening ? stopListening : startListening}
      >
        <Text style={styles.micButtonText}>
          {isListening ? '🔴 Escuchando... (toca para detener)' : '🎤 Hablar'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Crear tarea</Text>
        )}
      </TouchableOpacity>

      <FlatList
        style={styles.list}
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskDetail}>Materia: {item.subject || 'N/A'}</Text>
            <Text style={styles.taskDetail}>Dificultad: {item.difficulty}</Text>
            {item.dueDate && (
              <Text style={styles.taskDetail}>
                Fecha: {new Date(item.dueDate).toLocaleDateString('es-CO')}
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No hay tareas todavia</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, marginTop: 20 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  micButton: {
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  micButtonActive: {
    backgroundColor: '#fee2e2',
  },
  micButtonText: { fontSize: 16, fontWeight: '600', color: '#333' },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  list: { flex: 1 },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  taskTitle: { fontSize: 16, fontWeight: 'bold' },
  taskDetail: { fontSize: 14, color: '#555', marginTop: 2 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});