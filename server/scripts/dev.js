/**
 * @file dev.js
 * تشغيل خادم الـ Express والواجهة (Vite) معاً في بيئة التطوير بدون مكتبة خارجية (حسب A1)
 */

import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const serverDir = path.resolve(__dirname, '..')
const clientDir = path.resolve(serverDir, '..', 'client')

const isWindows = process.platform === 'win32'
const npmCmd = isWindows ? 'npm.cmd' : 'npm'
const nodeCmd = process.execPath

console.log('[DevRunner] بدء تشغيل الخادم والواجهة معاً...')

// 1. تشغيل خادم Express مع المراقبة
const serverProcess = spawn(nodeCmd, ['--env-file-if-exists=.env', '--watch', 'src/index.js'], {
  cwd: serverDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
  },
})

// 2. تشغيل واجهة Vite
const clientProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: clientDir,
  stdio: 'inherit',
  shell: isWindows,
  env: process.env,
})

function cleanup() {
  console.log('\n[DevRunner] إيقاف العمليات...')
  serverProcess.kill('SIGINT')
  clientProcess.kill('SIGINT')
  process.exit(0)
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

serverProcess.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`[DevRunner] توقف الخادم برمز خروج: ${code}`)
  }
})

clientProcess.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`[DevRunner] توقفت الواجهة برمز خروج: ${code}`)
  }
})
