const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const app = express();
const port = 3000;

// Configuration MySQL
const dbConfig = {
  host: '192.168.56.30',
  user: 'cloud_user',
  password: 'Cloud_Secure_2025!',
  database: 'cloud_app'
};

// Configuration Multer pour l'upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Connexion à la base de données
async function connectDB() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connecté à la base de données MySQL');
    return connection;
  } catch (error) {
    console.error('❌ Erreur de connexion MySQL:', error.message);
    return null;
  }
}

// Route principale - MODIFIÉE
app.get('/', async (req, res) => {
    const serverName = process.env.SERVER_NAME || 'Development';
    const serverColor = serverName === 'Web1' ? '#e8f4fd' : '#f0f8f0';
    
    let dbStatus = '❌ Déconnecté';
    let imageCount = 0;
    
    try {
        const connection = await connectDB();
        if (connection) {
            dbStatus = '✅ Connecté';
            const [rows] = await connection.execute('SELECT COUNT(*) as count FROM images');
            imageCount = rows[0].count;
            await connection.end();
        }
    } catch (error) {
        dbStatus = `❌ Erreur: ${error.message}`;
    }
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Cloud HA App - Node.js</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 40px;
                    background: ${serverColor};
                    transition: background 0.5s;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                }
                h1 { color: #2c3e50; }
                .info { 
                    background: #f8f9fa; 
                    padding: 15px; 
                    border-radius: 5px; 
                    margin: 15px 0;
                }
                .upload-form {
                    background: #e8f4fd;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .refresh-btn, .upload-btn {
                    background: #3498db;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 10px 5px;
                }
                .upload-btn { background: #27ae60; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 Serveur ${serverName} - Node.js</h1>
                
                <div class="info">
                    <p><strong>IP:</strong> ${req.ip}</p>
                    <p><strong>Hostname:</strong> ${require('os').hostname()}</p>
                    <p><strong>Base de données:</strong> ${dbStatus}</p>
                    <p><strong>Images stockées:</strong> ${imageCount}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                </div>

                <!-- FORMULAIRE UPLOAD -->
                <div class="upload-form">
                    <h3>📤 Uploader une image</h3>
                    <form action="/upload" method="POST" enctype="multipart/form-data">
                        <input type="file" name="image" accept="image/*" required>
                        <button type="submit" class="upload-btn">📤 Uploader</button>
                    </form>
                </div>

                <button class="refresh-btn" onclick="location.reload()">
                    🔄 Rafraîchir la page
                </button>

                <div style="margin-top: 20px;">
                    <h4>📊 Routes disponibles:</h4>
                    <ul>
                        <li><a href="/">/ - Cette page</a></li>
                        <li><a href="/health">/health - Health check</a></li>
                        <li><a href="/api/info">/api/info - Info API</a></li>
                        <li><a href="/images">/images - Voir les images</a></li>
                    </ul>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Route UPLOAD - NOUVELLE
app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('Aucun fichier uploadé');
    }

    try {
        const connection = await connectDB();
        if (!connection) {
            return res.status(500).send('Erreur de connexion à la base de données');
        }

        const { originalname, buffer, mimetype, size } = req.file;
        
        await connection.execute(
            'INSERT INTO images (filename, image_data, mime_type, file_size, server_name, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
            [originalname, buffer, mimetype, size, process.env.SERVER_NAME || 'Development', req.ip]
        );

        await connection.end();
        
        res.send(`
            <div style="padding: 20px; background: #d4edda; border-radius: 5px;">
                <h3>✅ Image uploadée avec succès !</h3>
                <p><strong>Fichier:</strong> ${originalname}</p>
                <p><strong>Taille:</strong> ${(size / 1024).toFixed(2)} KB</p>
                <p><strong>Type:</strong> ${mimetype}</p>
                <a href="/">← Retour à l'accueil</a>
            </div>
        `);
    } catch (error) {
        console.error('Erreur upload:', error);
        res.status(500).send('Erreur lors de l\'upload');
    }
});

// Route pour voir les images - NOUVELLE
app.get('/images', async (req, res) => {
    try {
        const connection = await connectDB();
        if (!connection) {
            return res.status(500).send('Erreur de connexion à la base de données');
        }

        const [images] = await connection.execute('SELECT id, filename, mime_type, file_size, uploaded_at, server_name FROM images ORDER BY uploaded_at DESC');
        await connection.end();

        let html = `
            <div class="container">
                <h1>📸 Images stockées</h1>
                <p><a href="/">← Retour à l'accueil</a></p>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
        `;

        images.forEach(img => {
            html += `
                <div style="border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
                    <p><strong>${img.filename}</strong></p>
                    <p>${(img.file_size / 1024).toFixed(2)} KB</p>
                    <p>${new Date(img.uploaded_at).toLocaleString()}</p>
                    <p><small>Serveur: ${img.server_name}</small></p>
                    <a href="/image/${img.id}">Voir l'image</a>
                </div>
            `;
        });

        html += `</div></div>`;
        res.send(html);
    } catch (error) {
        res.status(500).send('Erreur lors de la récupération des images');
    }
});

// Route pour afficher une image - NOUVELLE
app.get('/image/:id', async (req, res) => {
    try {
        const connection = await connectDB();
        const [rows] = await connection.execute('SELECT image_data, mime_type FROM images WHERE id = ?', [req.params.id]);
        await connection.end();

        if (rows.length === 0) {
            return res.status(404).send('Image non trouvée');
        }

        const image = rows[0];
        res.set('Content-Type', image.mime_type);
        res.send(image.image_data);
    } catch (error) {
        res.status(500).send('Erreur lors de la récupération de l\'image');
    }
});

// Gardez les routes existantes...
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        server: process.env.SERVER_NAME || 'Development',
        timestamp: new Date().toISOString(),
        database: 'connected'
    });
});

app.get('/api/info', (req, res) => {
    res.json({
        server: process.env.SERVER_NAME || 'Development',
        hostname: require('os').hostname(),
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime()
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🔄 Serveur ${process.env.SERVER_NAME || 'Development'} démarré`);
    console.log(`📍 http://localhost:${port}`);
    console.log(`🌐 http://0.0.0.0:${port} (accessible depuis le réseau)`);
    console.log(`🗄️  Base de données: ${dbConfig.host}`);
});