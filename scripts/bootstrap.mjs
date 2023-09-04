import { Buffer } from 'node:buffer'
import child_process from 'node:child_process'
import process from 'node:process'

const defaultOptions = {
  cwd: process.cwd(),
  shell: process.platform === 'win32',
  stdio: 'inherit'
}

function execa(command, argvs = [], options = defaultOptions) {
  return new Promise((resolve, reject) => {
    const cp = child_process.spawn(command, argvs, options)
    const stdout = []
    const stderr = []
    cp.stdout.on('data', (data) => stdout.push(data))
    cp.stderr.on('data', (err) => stderr.push(err))
    cp.on('error', reject)
    cp.on('close', (code) => {
      if (code !== 0) {
        const error = new Error(`Command failed with exit code ${code}`)
        error.stdout = Buffer.from(stdout).toString()
        error.stderr = Buffer.from(stderr).toString()
      } else {
        resolve({ stdout: Buffer.from(stdout), stderr: Buffer.from(stderr) })
      }
    })
  })
}

async function main() {
  await execa('yarn', ['install'])
  await execa('yarn', ['build:replacer'])
}


main()
