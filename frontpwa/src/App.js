import React, { useState, useEffect } from 'react';
import { openDB } from 'idb';

function SplashScreen() {
  return (
    <div style={{
      background: "#000",
      color: "#fff",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <img src="/logo192.png" alt="logo" style={{ width: 100, height: 100 }} />
      <h1>PWA Act</h1>
    </div>
  );
}

function App() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [reminder, setReminder] = useState('');
  const isBrowser = typeof window !== 'undefined';

  let dbPromise = null;
  if (isBrowser) {
    dbPromise = openDB('todo-db', 1, {
      upgrade(db) {
        db.createObjectStore('tasks', { keyPath: 'id' });
      },
    });
  }

  // Definir funciones fuera de useEffect para que sean accesibles
  const syncLocalTasks = async () => {
    if (!isBrowser) return new Set();
    const db = await dbPromise;
    const localTasks = await db.transaction('tasks').objectStore('tasks').getAll();
    const syncedIds = new Set();
    for (const task of localTasks) {
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          body: JSON.stringify(task),
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          await db.transaction('tasks', 'readwrite').objectStore('tasks').delete(task.id);
          syncedIds.add(task.id);
          console.log('Tarea sincronizada y eliminada localmente:', task);
        }
      } catch (err) {
        console.error('Error sincronizando tarea local:', err);
      }
    }
    return syncedIds;
  };

  const loadTasks = async () => {
    if (!isBrowser) return;
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      console.log('Datos remotos cargados:', data);
      const db = await dbPromise;
      const tx = db.transaction('tasks', 'readwrite');
      data.forEach(task => tx.store.put(task));
      await tx.done;
      setTasks(data);
    } catch {
      console.log('Modo offline: Cargando datos locales');
      const db = await dbPromise;
      const localTasks = await db.transaction('tasks').objectStore('tasks').getAll();
      console.log('Datos locales cargados:', localTasks);
      setTasks(localTasks);
    }
  };

  useEffect(() => {
    if (!isBrowser) return;

    const loadApp = async () => {
      await syncLocalTasks().then(loadTasks);
      setLoading(false); // Oculta la splash solo cuando los datos estén listos
    };

    loadApp();

    // Escucha evento 'online'
    const handleOnline = () => {
      console.log('Conexión restablecida, sincronizando...');
      syncLocalTasks().then(loadTasks);
    };
    window.addEventListener('online', handleOnline);

    // Polling cada 5s
    const interval = setInterval(() => {
      if (navigator.onLine) {
        loadTasks();
      }
    }, 5000);

    // Limpieza al desmontar
    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, []);

  const addTask = async () => {
    const task = { id: Date.now(), text: newTask, done: false, reminder: new Date(reminder) };

    if (isBrowser) {
      dbPromise.then(db => {
        const tx = db.transaction('tasks', 'readwrite');
        tx.store.add(task);
        return tx.done;
      }).then(() => {
        console.log('Tarea guardada localmente');
      });

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification('Tarea Agregada', {
            body: newTask,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            actions: [
              { action: 'done', title: 'Marcar como hecha' },
              { action: 'close', title: 'Cerrar' }
            ],
            vibrate: [200, 100, 200],
            tag: 'tarea-' + task.id
          }).catch(err => console.error('Error mostrando notificación:', err));
        }).catch(err => console.error('Error accediendo a Service Worker:', err));
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          task.location = `${pos.coords.latitude}, ${pos.coords.longitude}`;
          navigator.vibrate([200, 100, 200]);
        }, err => console.error(err), { enableHighAccuracy: true });
      }
    }

    fetch('/api/tasks', { method: 'POST', body: JSON.stringify(task), headers: { 'Content-Type': 'application/json' } })
      .then(() => console.log('Tarea guardada remotamente'))
      .catch(() => {
        console.log('Modo offline: Tarea no enviada a remoto, quedará en local');
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          navigator.serviceWorker.ready.then(reg => {
            reg.sync.register('sync-tasks').catch(err => console.error('Error registrando sync:', err));
          });
        }
      });

    setTasks([...tasks, task]);
    setNewTask('');
    setReminder('');
  };

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333' }}>Home: Lista de Tareas</h1>
      <div style={{ marginBottom: '20px' }}>
        <input
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          placeholder="Nueva tarea"
          style={{ padding: '10px', marginRight: '10px', width: '200px' }}
        />
        <input
          type="datetime-local"
          value={reminder}
          onChange={e => setReminder(e.target.value)}
          style={{ padding: '10px', marginRight: '10px' }}
        />
        <button
          onClick={addTask}
          style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          Agregar
        </button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {tasks.map(t => (
          <li key={t.id} style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
            {t.text} - Recordatorio: {t.reminder?.toString()} {t.location}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;