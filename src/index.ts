import { server } from "./tcp/tcp-server";

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';

// Start listening for connections
server.listen(PORT, HOST, () => {
    console.log(`[Server] TCP server listening on ${HOST}:${PORT}`);
});

/**
 * 优雅关闭逻辑
 * pm2 stop 信号顺序：SIGINT → SIGTERM → SIGKILL（超时触发）。
 * 必做操作：监听 SIGTERM 实现优雅关闭，配置合理的 kill_timeout。
 * 强制终止：pm2 delete 直接发 SIGKILL，慎用
 *  */
const gracefulShutdown = (signal: string) => {
    console.log(`Received ${signal}, closing server...`);

    // 1. 停止接受新连接
    server.close(() => {
        console.log('Server closed, process exiting.');
        process.exit(0); // 正常退出
    });

    // 2. 强制超时兜底（避免长时间卡死）
    setTimeout(() => {
        console.error('Forcing shutdown after timeout!');
        process.exit(1); // 非正常退出
    }, 5000); // 5秒超时
};

// 监听信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获异常处理
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    gracefulShutdown('uncaughtException');
});
