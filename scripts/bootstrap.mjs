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
    cp.on('error', reject)
    cp.on('close', (code) => {
      if (code !== 0) {
        const error = new Error(`Command failed with exit code ${code}`)
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

async function main() {
  await execa('pnpm', ['install'])
  await execa('pnpm', ['build:replacer'])
}


main()
