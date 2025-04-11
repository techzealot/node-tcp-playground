import { server } from "./tcp/tcp-server";

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';

// Start listening for connections
server.listen(PORT, HOST, () => {
    console.log(`[Server] TCP server listening on ${HOST}:${PORT}`);
});

// Handle server shutdown gracefully (e.g., on Ctrl+C)
process.on('SIGINT', () => {
    console.log('[Server] Shutting down server...');
    server.close(() => {
        console.log('[Server] Server closed.');
        process.exit(0);
    });

    // Force close remaining connections after a timeout if needed
    setTimeout(() => {
        console.error('[Server] Forcing shutdown after timeout.');
        process.exit(1);
    }, 5000); // 5 seconds timeout
});
