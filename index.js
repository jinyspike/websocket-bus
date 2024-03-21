const WebSocket = require('ws');
const os = require('os');
const portfinder = require('portfinder')

const clients = new Set();
const clientId = new Map();

const startPort = 8080;
const maxTries = 10;
const DEV = process.argv[2] === "dev"
let id = 0

function findAvailablePort(startPort = 8800) {
    portfinder.getPortPromise({ port: startPort }).then(port => {
        startServer(port)
    })
}

function startServer(PORT) {
    const wss = new WebSocket.Server({ port: PORT });
    wss.on('connection', function connection(ws) {
        clients.add(ws);
        clientId.set(ws, ++id)
        if (DEV) {
            console.log('client connected: ', id);
        }

        ws.on('message', function incoming(message) {
            message = message.toString()
            console.log('recived message from: ', clientId.get(ws));
            console.log('message: ', message);
            clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(message);
                    if (DEV) {
                        console.log('message sent to: ', clientId.get(client));
                    }
                }
            });
        });

        ws.on('close', function close() {
            if (DEV) {
                console.log(`client disconnected: ${clientId.get(ws)}`);
            }
            clients.delete(ws);
            clientId.delete(ws);
        });
    });
    if (DEV) {
        console.log(`ws server start on dev mode at`);
    } else {
        console.log(`ws server start at`);
    }
    console.log(`ws://${getLocalIP()}:${PORT}`);
}

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        const interface = interfaces[interfaceName];
        for (let i = 0; i < interface.length; i++) {
            const { address, family, internal } = interface[i];
            if (family === 'IPv4' && !internal) {
                return address;
            }
        }
    }
    return 'localhost';
}

findAvailablePort(startPort, maxTries);
