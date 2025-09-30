const express = require('express');
const path = require('path');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient, ServerApiVersion } = require('mongodb');
const webpush = require('web-push');
const dotenv = require('dotenv');
const babel = require('@babel/core');

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configura VAPID desde .env
webpush.setVapidDetails(
  process.env.VAPID_MAILTO,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Conexión a MongoDB Atlas
const uri = process.env.ATLAS_URI;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('todoDB');
    console.log('Conectado a MongoDB Atlas');
  } catch (err) {
    console.error('Error conectando a MongoDB Atlas:', err);
  }
}
connectDB();

// Colecciones
const getTasksCollection = () => db.collection('tasks');
const getSubscriptionsCollection = () => db.collection('subscriptions');

// API Endpoints
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await getTasksCollection().find({}).toArray();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const newTask = req.body;
    const existingTask = await getTasksCollection().findOne({ id: newTask.id });
    if (existingTask) {
      return res.json(existingTask); // Ya existe, no insertar
    }
    const result = await getTasksCollection().insertOne(newTask);
    res.json({ ...newTask, _id: result.insertedId });
    const subs = await getSubscriptionsCollection().find({}).toArray();
    for (const sub of subs) {
      try {
        await webpush.sendNotification(sub, JSON.stringify({ title: 'Nueva Tarea', body: newTask.text }));
      } catch (err) {
        console.error('Error enviando push:', err);
        if (err.statusCode === 410) {
          await getSubscriptionsCollection().deleteOne({ endpoint: sub.endpoint });
          console.log('Suscripción expirada eliminada:', sub.endpoint);
        }
      }
    }
  } catch (err) {
    res.status(500).json({ error: 'Error al crear tarea' });
  }
});

app.post('/api/subscribe', async (req, res) => {
  try {
    const subscription = req.body;
    await getSubscriptionsCollection().updateOne(
      { endpoint: subscription.endpoint },
      { $set: subscription },
      { upsert: true }
    );
    res.status(201).json({});
  } catch (err) {
    res.status(500).json({ error: 'Error al suscribir' });
  }
});



app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(__dirname, '../frontpwa/build/manifest.json'));
});


// SSR: Transpila App.js manualmente
const AppPath = path.resolve(__dirname, '../frontpwa/src/App.js');
let App;
try {
  const { code } = babel.transformFileSync(AppPath, {
    presets: ['@babel/preset-env', '@babel/preset-react'],
    sourceType: 'module'
  });
  const moduleExports = { exports: {} };
  const moduleFunc = new Function('module', 'exports', 'require', code);
  moduleFunc(moduleExports, moduleExports.exports, require);
  App = moduleExports.exports.default;
} catch (err) {
  console.error('Error transpilando App.js:', err);
}

// SSR Route
app.get('/', (req, res) => {
  try {
    const html = App ? ReactDOMServer.renderToString(React.createElement(App)) : '<div>Error cargando App</div>';
    res.sendFile(path.join(__dirname, '../frontpwa/build/index.html'));
  } catch (err) {
    console.error('Error en SSR:', err);
    res.status(500).send('Error en el servidor');
  }
});

app.get('/serviceWorker.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../frontpwa/build/serviceWorker.js'));
});

// Sirve archivos estáticos desde la carpeta build
app.use(express.static(path.join(__dirname, '../frontpwa/build')));

// Maneja rutas SPA (redirige todo a index.html, excluyendo rutas API)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontpwa/build/index.html'));
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));

// Cierra conexión
process.on('SIGINT', async () => {
  await client.close();
  process.exit(0);
});