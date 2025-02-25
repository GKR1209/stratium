const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
const LlamaMonitor = require('./llama-monitor');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(bodyParser.json());

let sharedDoc = "Start typing...";
const llamaMonitor = new LlamaMonitor(io);
console.log('🚀 Collab server starting...');

io.on('connection', (socket) => {
    console.log('👤 New client connected');
    socket.emit('doc:sync', sharedDoc);

    socket.on('doc:update', async (newContent) => {
        console.log('📝 Document updated');
        sharedDoc = newContent;
        socket.broadcast.emit('doc:sync', sharedDoc);
    });

    socket.on('generate:step', async (data) => {
        const content = await llamaMonitor.generateStepContent(data.step, data.currentContent);
        socket.emit('step:content', {
            step: data.step,
            content: content || `Failed to generate content for: ${data.step}`
        });
    });

    socket.on('trigger:analysis', async (content) => {
        console.log('🔄 Manual analysis triggered');
        await llamaMonitor.analyzeContent(content);
    });

    socket.on('disconnect', () => {
        console.log('👤 Client disconnected');
    });
});

app.post('/analyze', async (req, res) => {
    const content = req.body.content;
    try {
        const insights = await llamaMonitor.analyzeContent(content);
        res.json({ insights });
    } catch (error) {
        console.error('Analysis failed:', error);
        res.status(500).json({ error: 'Analysis failed' });
    }
});

server.listen(3000, () => {
    console.log('Collab server running on port 3000');
});