const express = require('express');
const app = express();
const port = 3000;

// Middleware pour servir les fichiers statiques
app.use(express.static('public'));

// Route principale
app.get('/', (req, res) => {
    const serverName = process.env.SERVER_NAME || 'Development';
    const serverColor = serverName === 'Web1' ? '#e8f4fd' : '#f0f8f0';
    
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
                .refresh-btn {
                    background: #3498db;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 10px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 Serveur ${serverName} - Node.js</h1>
                
                <div class="info">
                    <p><strong>IP:</strong> ${req.ip}</p>
                    <p><strong>Hostname:</strong> ${require('os').hostname()}</p>
                    <p><strong>Port:</strong> ${port}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Node.js:</strong> ${process.version}</p>
                </div>

                <h3>🔄 Load Balancer Test</h3>
                <p>Rafraîchissez pour voir les différents serveurs quand le load balancing sera configuré</p>
                
                <button class="refresh-btn" onclick="location.reload()">
                    🔄 Rafraîchir la page
                </button>

                <div style="margin-top: 20px;">
                    <h4>📊 Routes disponibles:</h4>
                    <ul>
                        <li><a href="/">/ - Cette page</a></li>
                        <li><a href="/health">/health - Health check</a></li>
                        <li><a href="/api/info">/api/info - Info API</a></li>
                    </ul>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Health check endpoint (pour le load balancer)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        server: process.env.SERVER_NAME || 'Development',
        timestamp: new Date().toISOString()
    });
});

// API info endpoint
app.get('/api/info', (req, res) => {
    res.json({
        server: process.env.SERVER_NAME || 'Development',
        hostname: require('os').hostname(),
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// Démarrer le serveur
app.listen(port, '0.0.0.0', () => {
    console.log(`🔄 Serveur ${process.env.SERVER_NAME || 'Development'} démarré`);
    console.log(`📍 http://localhost:${port}`);
    console.log(`🌐 http://0.0.0.0:${port} (accessible depuis le réseau)`);
});