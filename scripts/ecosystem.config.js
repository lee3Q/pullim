// PM2 설정 — 풀림 반자동화
// 실행: pm2 start scripts/ecosystem.config.js
// 상태: pm2 status
// 로그: pm2 logs pullim-bot

module.exports = {
  apps: [{
    name: 'pullim-bot',
    script: './scripts/telegram-bot.js',
    cwd: require('path').resolve(__dirname, '..'),
    cron_restart: '0 4 * * *',  // 매일 04시 자동 재시작 (메모리 누수 방지)
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production',
    },
    error_file: '/tmp/pullim-bot-error.log',
    out_file: '/tmp/pullim-bot-out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }],
};
