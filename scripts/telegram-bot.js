#!/usr/bin/env node
// 풀림 반자동화 텔레그램 봇 — polling + 인라인 키보드 + 배치 연결
//
// 실행: node scripts/telegram-bot.js
// PM2:  pm2 start scripts/telegram-bot.js --name pullim-bot

const TelegramBot = require('node-telegram-bot-api');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ========== 설정 ==========
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ENV_FILE = path.join(PROJECT_ROOT, '.env.notify');
const STATE_DIR = path.join(PROJECT_ROOT, '.state');
const SCRIPTS_DIR = __dirname;

// .env.notify 로드
function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) {
    console.error('.env.notify 파일 없음:', ENV_FILE);
    process.exit(1);
  }
  const lines = fs.readFileSync(ENV_FILE, 'utf-8').split('\n');
  for (const line of lines) {
    const match = line.match(/^(\w+)="?([^"]*)"?$/);
    if (match) process.env[match[1]] = match[2];
  }
}

loadEnv();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TOKEN || !CHAT_ID) {
  console.error('TELEGRAM_BOT_TOKEN 또는 TELEGRAM_CHAT_ID 미설정');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });
console.log(`[pullim-bot] 시작됨 (${new Date().toLocaleString('ko-KR')})`);

// ========== 유틸리티 ==========

function isAuthorized(msg) {
  return String(msg.chat.id) === String(CHAT_ID);
}

function readFile(filepath) {
  try {
    return fs.readFileSync(filepath, 'utf-8');
  } catch {
    return null;
  }
}

function runShell(cmd, timeout = 10000) {
  try {
    return execSync(cmd, { cwd: PROJECT_ROOT, timeout, encoding: 'utf-8' }).trim();
  } catch (e) {
    return `[오류] ${e.message}`;
  }
}

function truncate(text, max = 4000) {
  if (text.length <= max) return text;
  return text.slice(0, max) + '\n\n... (잘림)';
}

// ========== 명령어 ==========

// /start — 인사
bot.onText(/\/start/, (msg) => {
  if (!isAuthorized(msg)) return;
  bot.sendMessage(CHAT_ID, '풀림 반자동화 봇 연결됨.\n\n/status — 프로젝트 현황\n/queue — 작업 큐\n/board — 대표 보드\n/batch — 밤배치 실행\n/report — 리포트 생성\n/help — 전체 명령어');
});

// /help
bot.onText(/\/help/, (msg) => {
  if (!isAuthorized(msg)) return;
  bot.sendMessage(CHAT_ID,
`*풀림 봇 명령어*

/status — 프로젝트 현황 요약
/queue — 작업 큐 (다음 할 일)
/board — 대표 보드 (🔴 항목)
/report — 아침/밤 리포트 생성
/batch — 밤배치 실행
/health — 시스템 건강 체크
/help — 이 메시지`, { parse_mode: 'Markdown' });
});

// /status — 프로젝트 현황
bot.onText(/\/status/, (msg) => {
  if (!isAuthorized(msg)) return;

  const projectDir = path.join(STATE_DIR, 'projects');
  const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.md') && !f.startsWith('_'));

  let summary = '*프로젝트 현황*\n\n';
  for (const file of files) {
    const content = readFile(path.join(projectDir, file));
    if (!content) continue;
    const nameMatch = content.match(/^# (.+)/m);
    const stageMatch = content.match(/현재 단계:\s*(.+)/m);
    const statusMatch = content.match(/상태:\s*(진행 중|완료|대기)/m);
    const name = nameMatch ? nameMatch[1] : file;
    const stage = stageMatch ? stageMatch[1] : '?';
    const status = statusMatch ? statusMatch[1] : '?';
    if (status === '진행 중') {
      summary += `- *${name}*\n  ${stage}\n\n`;
    }
  }

  bot.sendMessage(CHAT_ID, truncate(summary), { parse_mode: 'Markdown' });
});

// /queue — 작업 큐
bot.onText(/\/queue/, (msg) => {
  if (!isAuthorized(msg)) return;
  const queue = readFile(path.join(STATE_DIR, 'queue.md'));
  if (!queue) return bot.sendMessage(CHAT_ID, 'queue.md 읽기 실패');

  // "다음 세션" ~ "대표 확인" 섹션 추출
  const nextMatch = queue.match(/## 다음 세션\n([\s\S]*?)(?=\n## )/);
  const redMatch = queue.match(/## 대표 확인[^\n]*\n([\s\S]*?)(?=\n## )/);

  let text = '*다음 작업*\n\n';
  if (nextMatch) text += nextMatch[1].trim() + '\n\n';
  if (redMatch) text += '*🔴 대표 확인 필요*\n' + redMatch[1].trim();

  bot.sendMessage(CHAT_ID, truncate(text), { parse_mode: 'Markdown' });
});

// /board — 대표 보드 (🔴 항목만)
bot.onText(/\/board/, (msg) => {
  if (!isAuthorized(msg)) return;
  const board = readFile(path.join(STATE_DIR, 'ceo-board.md'));
  if (!board) return bot.sendMessage(CHAT_ID, 'ceo-board.md 읽기 실패');

  const redMatch = board.match(/## 🔴 지금 해야 할 것[^\n]*\n([\s\S]*?)(?=\n## )/);
  const timeMatch = board.match(/## ⏰ 시간 제한[^\n]*\n([\s\S]*?)(?=\n## |\n---|\Z)/);

  let text = '*🔴 지금 해야 할 것*\n\n';
  if (redMatch) text += redMatch[1].trim();
  if (timeMatch) text += '\n\n*⏰ 시간 제한*\n' + timeMatch[1].trim();

  bot.sendMessage(CHAT_ID, truncate(text), { parse_mode: 'Markdown' });
});

// /report — 리포트 생성 (사다리식 선택)
bot.onText(/\/report/, (msg) => {
  if (!isAuthorized(msg)) return;
  bot.sendMessage(CHAT_ID, '어떤 리포트를 생성할까?', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '☀ 아침 리포트', callback_data: 'report_morning' },
          { text: '🌙 밤 리포트', callback_data: 'report_evening' },
        ],
      ],
    },
  });
});

// /batch — 밤배치 실행
bot.onText(/\/batch/, (msg) => {
  if (!isAuthorized(msg)) return;

  const batchDir = path.join(SCRIPTS_DIR, 'batch-tasks');
  let taskFiles = [];
  try {
    taskFiles = fs.readdirSync(batchDir).filter(f => f.endsWith('.sh'));
  } catch {}

  if (taskFiles.length === 0) {
    return bot.sendMessage(CHAT_ID, 'scripts/batch-tasks/ 에 태스크 파일 없음.');
  }

  const keyboard = taskFiles.map(f => ([{
    text: f.replace('.sh', ''),
    callback_data: `batch_${f}`,
  }]));
  keyboard.push([{ text: '취소', callback_data: 'batch_cancel' }]);

  bot.sendMessage(CHAT_ID, '*밤배치 실행*\n어떤 태스크 파일?', {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard },
  });
});

// /health — 시스템 건강
bot.onText(/\/health/, (msg) => {
  if (!isAuthorized(msg)) return;

  const gitStatus = runShell('git status --short | head -10');
  const diskFree = runShell('df -h / | tail -1 | awk \'{print $4}\'');
  const uptime = runShell('uptime');
  const nodeVer = runShell('node -v');

  bot.sendMessage(CHAT_ID,
`*시스템 건강*

디스크 여유: ${diskFree}
Node: ${nodeVer}
Uptime: ${uptime.trim()}

*Git 변경 (최근 10)*
\`\`\`
${gitStatus || '(클린)'}
\`\`\``, { parse_mode: 'Markdown' });
});

// ========== 콜백 처리 (인라인 키보드) ==========

bot.on('callback_query', async (query) => {
  const data = query.data;
  await bot.answerCallbackQuery(query.id);

  // 리포트 생성
  if (data === 'report_morning' || data === 'report_evening') {
    const type = data === 'report_morning' ? 'morning' : 'evening';
    const scriptPath = path.join(SCRIPTS_DIR, `${type}-report.sh`);

    if (!fs.existsSync(scriptPath)) {
      return bot.sendMessage(CHAT_ID, `${scriptPath} 없음`);
    }

    bot.sendMessage(CHAT_ID, `${type === 'morning' ? '☀' : '🌙'} 리포트 생성 중...`);

    const proc = spawn('bash', [scriptPath], { cwd: PROJECT_ROOT });
    let output = '';
    proc.stdout.on('data', (d) => { output += d.toString(); });
    proc.stderr.on('data', (d) => { output += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) {
        bot.sendMessage(CHAT_ID, `${type === 'morning' ? '☀' : '🌙'} 리포트 생성 완료`);
        // 생성된 리포트 파일 읽어서 전송
        const today = new Date().toISOString().slice(0, 10);
        const reportPath = path.join(STATE_DIR, 'daily', `${today}_${type}.md`);
        const report = readFile(reportPath);
        if (report) {
          bot.sendMessage(CHAT_ID, truncate(report));
          // 밤 리포트면 하네스 초안 확인 + 승인 키보드
          if (type === 'evening') {
            const harnessPath = path.join(STATE_DIR, 'harnesses', `${today}_자동초안.md`);
            if (fs.existsSync(harnessPath)) {
              const harnessContent = readFile(harnessPath) || '';
              bot.sendMessage(CHAT_ID, `📋 하네스 초안 생성됨:\n\n${truncate(harnessContent, 800)}`, {
                reply_markup: {
                  inline_keyboard: [[
                    { text: '✅ 이 하네스 실행', callback_data: 'harness_run' },
                    { text: '✏️ 수정 필요', callback_data: 'harness_edit' },
                    { text: '⏭ 내일로', callback_data: 'harness_skip' },
                  ]],
                },
              });
            }
          }
        }
      } else {
        bot.sendMessage(CHAT_ID, `리포트 생성 실패 (code: ${code})\n${truncate(output, 1000)}`);
      }
    });
    return;
  }

  // 배치 실행
  if (data.startsWith('batch_')) {
    if (data === 'batch_cancel') {
      return bot.sendMessage(CHAT_ID, '배치 취소됨.');
    }

    const taskFile = data.replace('batch_', '');
    const taskPath = path.join(SCRIPTS_DIR, 'batch-tasks', taskFile);

    // 2단계 확인
    bot.sendMessage(CHAT_ID, `*${taskFile}* 실행할까?\ncaffeinate + night-batch.sh`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '실행', callback_data: `confirm_batch_${taskFile}` },
          { text: '취소', callback_data: 'batch_cancel' },
        ]],
      },
    });
    return;
  }

  // 배치 확인 후 실행
  if (data.startsWith('confirm_batch_')) {
    const taskFile = data.replace('confirm_batch_', '');
    const taskPath = path.join(SCRIPTS_DIR, 'batch-tasks', taskFile);

    bot.sendMessage(CHAT_ID, `배치 시작: ${taskFile}`);

    const proc = spawn('bash', ['-c',
      `caffeinate -s bash "${path.join(SCRIPTS_DIR, 'night-batch.sh')}" "${taskPath}"`
    ], {
      cwd: PROJECT_ROOT,
      detached: true,
      stdio: 'ignore',
    });
    proc.unref();

    bot.sendMessage(CHAT_ID, '배치 백그라운드 실행 중. 완료되면 알림 올게.');
    return;
  }

  // 하네스 승인 플로우
  if (data === 'harness_run') {
    const today = new Date().toISOString().slice(0, 10);
    const harnessPath = path.join(STATE_DIR, 'harnesses', `${today}_자동초안.md`);
    if (!fs.existsSync(harnessPath)) {
      return bot.sendMessage(CHAT_ID, '하네스 파일 없음. evening-report 먼저 실행해.');
    }
    bot.sendMessage(CHAT_ID, `배치 시작: ${path.basename(harnessPath)}`);
    const proc = spawn('bash', ['-c',
      `caffeinate -s bash "${path.join(SCRIPTS_DIR, 'night-batch.sh')}" --harness "${harnessPath}"`
    ], { cwd: PROJECT_ROOT, detached: true, stdio: 'ignore' });
    proc.unref();
    bot.sendMessage(CHAT_ID, '배치 백그라운드 실행 중. 완료되면 알림 올게.');
    return;
  }

  if (data === 'harness_edit') {
    const today = new Date().toISOString().slice(0, 10);
    return bot.sendMessage(CHAT_ID, `✏️ claude code에서 수정해:\n.state/harnesses/${today}_자동초안.md`);
  }

  if (data === 'harness_skip') {
    return bot.sendMessage(CHAT_ID, '⏭ 내일로 미뤄짐.');
  }
});

// ========== 일반 메시지 저장 (명령어 아닌 것) ==========

const INBOX_FILE = path.join(STATE_DIR, 'telegram-inbox.md');

bot.on('message', (msg) => {
  if (!isAuthorized(msg)) return;
  // 명령어(/)는 무시 — 이미 위에서 처리됨
  if (msg.text && msg.text.startsWith('/')) return;
  if (!msg.text) return;

  const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const entry = `\n- [${timestamp}] ${msg.text}`;

  // 파일이 없으면 헤더 생성
  if (!fs.existsSync(INBOX_FILE)) {
    fs.writeFileSync(INBOX_FILE, '# 텔레그램 인박스\n\n> 대표가 텔레그램으로 보낸 메시지. 22시 자동 확인.\n');
  }

  fs.appendFileSync(INBOX_FILE, entry + '\n');
  bot.sendMessage(CHAT_ID, '메모 저장됨 ✓');
});

// ========== 에러 처리 ==========

bot.on('polling_error', (error) => {
  console.error('[polling_error]', error.code, error.message);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

console.log('[pullim-bot] 명령어 대기 중...');
