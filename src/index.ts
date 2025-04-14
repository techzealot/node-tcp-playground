import cluster from "cluster";
import os from "os";
import { server } from "./tcp/tcp-server";

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';

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
    }, 4000); // 4秒超时,略小于pm2的kill_timeout(默认5秒)
};

if (cluster.isPrimary) {
    //兼容node cluster模式,对于使用pm2 cluster模式,会自动进行集群化,isPrimary永远返回false
    // 主进程逻辑：fork Worker 进程
    console.log(`Master ${process.pid} is running`);
    for (let i = 0; i < os.cpus().length; i++) {
        cluster.fork();
    }
    // 监听 Worker 退出事件并重启
    cluster.on('exit', (worker) => {
        console.log(`Worker ${worker.process.pid} died, restarting...`);
        cluster.fork();
    });
} else {
    // Start listening for connections
    console.log(`Worker ${process.pid} starting TCP server on ${HOST}:${PORT}`);
    server.listen(PORT, HOST, () => {
        console.log(`[Server] TCP server listening on ${HOST}:${PORT}`);
    });
    // 监听信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // 未捕获异常处理
    process.on('uncaughtException', (err) => {
        console.error('Uncaught exception:', err);
        gracefulShutdown('uncaughtException');
    });
}
