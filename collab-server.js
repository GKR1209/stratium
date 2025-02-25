const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const LlamaMonitor = require('./llama-monitor');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

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
        
        // Remove this line to disable automatic analysis
        // await llamaMonitor.analyzeContent(newContent);
    });

    // Update the generate:step event handler
    socket.on('generate:step', async (data) => {
        const content = await llamaMonitor.generateStepContent(data.step, data.currentContent);
        socket.emit('step:content', {
            step: data.step,
            content: content || `Failed to generate content for: ${data.step}`
        });
    });

    // Add this to your existing socket.on connections
    socket.on('trigger:analysis', async (content) => {
        console.log('🔄 Manual analysis triggered');
        await llamaMonitor.analyzeContent(content);
    });

    socket.on('disconnect', () => {
        // Handle disconnection if needed
    });
});

server.listen(3000, () => {
    console.log('Collab server running on port 3000');
});
