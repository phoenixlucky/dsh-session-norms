#!/usr/bin/env node
// Release dsh-session-norms: check, test, bump, commit, tag, publish, push.
//
//   npm run release patch            # 1.2.2 -> 1.2.3
//   npm run release minor            # 1.2.2 -> 1.3.0
//   npm run release 1.4.0            # an exact version
//   npm run release patch -- --dry-run
//
// Flags: --dry-run  --offline  --no-publish  --no-push  --skip-tests  --otp <code>
//
// The published package carries no runtime dependencies, so everything here is
// done with Node's standard library: no semver, no execa.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, openSync, closeSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const isWindows = process.platform === 'win32'

const args = process.argv.slice(2)
const flags = new Set(args.filter((arg) => arg.startsWith('--')))
const otpIndex = args.indexOf('--otp')
const otp = args.find((arg) => arg.startsWith('--otp='))?.slice('--otp='.length)
  ?? (otpIndex === -1 ? undefined : args[otpIndex + 1])
const positional = args.filter(
  (arg, index) => !arg.startsWith('--') && (otpIndex === -1 || index !== otpIndex + 1),
)
const requested = positional[0] ?? 'patch'

const dryRun = flags.has('--dry-run')
const offline = flags.has('--offline')
const publish = !flags.has('--no-publish')
const push = !flags.has('--no-push')
const tests = !flags.has('--skip-tests')

/** Print a step heading. */
function step(title) {
  console.log(`\n== ${title}`)
}

/** Run a command, echoing it, and return its combined output. */
function run(command, commandArgs, { allowFailure = false, quiet = false } = {}) {
  if (!quiet) console.log(`$ ${[command, ...commandArgs].join(' ')}`)
  // Output goes through a file rather than a pipe: a sandboxed host may forbid
  // piped stdio, and a file descriptor works everywhere.
  const directory = mkdtempSync(path.join(tmpdir(), 'dsh-release-'))
  const logPath = path.join(directory, 'output.log')
  const fd = openSync(logPath, 'w')
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: ['ignore', fd, fd],
    windowsHide: true,
    shell: command.endsWith('.cmd') || command.endsWith('.bat'),
  })
  closeSync(fd)
  const output = readFileSync(logPath, 'utf8')
  rmSync(directory, { recursive: true, force: true })
  const status = result.status ?? 1
  const failed = result.error !== undefined || status !== 0
  if (failed && !allowFailure) {
    const detail = result.error === undefined ? output.trim() : String(result.error.message)
    throw new Error(`${command} ${commandArgs.join(' ')} failed${detail === '' ? '' : `:\n${detail}`}`)
  }
  if (!quiet && output.trim() !== '') console.log(output.trimEnd())
  return { ok: !failed, status, output }
}

/** Run npm through the CLI script beside this Node, so no shell quoting is involved. */
const npmCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')
function npm(npmArgs, options) {
  return existsSync(npmCli)
    ? run(process.execPath, [npmCli, ...npmArgs], options)
    : run(isWindows ? 'npm.cmd' : 'npm', npmArgs, options)
}

/** Parse `major.minor.patch`, with an optional prerelease suffix. */
function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/.exec(version)
  return match === null ? undefined : match.slice(1, 4).map(Number)
}

/** The version a bump request asks for. */
function nextVersion(current, request) {
  if (parseVersion(request) !== undefined) return request
  const parts = parseVersion(current)
  if (parts === undefined) throw new Error(`${current} is not a semver version`)
  const [major, minor, patch] = parts
  if (request === 'major') return `${major + 1}.0.0`
  if (request === 'minor') return `${major}.${minor + 1}.0`
  if (request === 'patch') return `${major}.${minor}.${patch + 1}`
  throw new Error(`unsupported bump ${request}: use patch, minor, major or an exact version`)
}

/** Whether candidate sorts after current. */
function isNewer(candidate, current) {
  const left = parseVersion(candidate)
  const right = parseVersion(current)
  if (left === undefined || right === undefined) return false
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] > right[index]
  }
  return candidate !== current
}

/** Escape a literal string for use in a regular expression. */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const manifestPath = path.join(root, 'package.json')
const readmePath = path.join(root, 'README.md')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const name = manifest.name
const currentVersion = manifest.version
const targetVersion = nextVersion(currentVersion, requested)
const progress = { versionWritten: false, committed: false }

try {
  step('Preflight')
  if (!isNewer(targetVersion, currentVersion)) {
    throw new Error(`${targetVersion} is not newer than the installed ${currentVersion}`)
  }
  console.log(`package   ${name}`)
  console.log(`version   ${currentVersion} -> ${targetVersion}${dryRun ? '  (dry run)' : ''}`)

  const status = run('git', ['status', '--porcelain'], { quiet: true })
  if (status.output.trim() !== '') {
    throw new Error(`the working tree has uncommitted changes:\n${status.output.trimEnd()}`)
  }
  const branch = run('git', ['branch', '--show-current'], { quiet: true }).output.trim()
  if (branch !== 'main') throw new Error(`release from main, not ${branch === '' ? 'a detached HEAD' : branch}`)
  if (run('git', ['tag', '--list', `v${targetVersion}`], { quiet: true }).output.trim() !== '') {
    throw new Error(`tag v${targetVersion} already exists`)
  }

  if (offline) {
    console.log('registry  check skipped (--offline)')
  } else {
    const published = npm(['view', `${name}@${targetVersion}`, 'version'], { allowFailure: true, quiet: true })
    const notFound = /E404|404 Not Found|is not in this registry/i.test(published.output)
    if (published.ok && published.output.trim() !== '') {
      throw new Error(`${name}@${targetVersion} is already on the registry: ${published.output.trim()}`)
    }
    if (!published.ok && !notFound) {
      throw new Error(`could not check the registry for ${name}@${targetVersion}:\n${published.output.trim()}`)
    }
    console.log(`registry  ${name}@${targetVersion} is free`)
  }

  if (publish && !offline) {
    const who = npm(['whoami'], { allowFailure: true, quiet: true })
    if (!who.ok) throw new Error(`not logged in to npm — run \`npm login\` first, or pass --no-publish`)
    console.log(`npm       logged in as ${who.output.trim()}`)
  }

  if (tests) {
    step('Tests')
    if (dryRun) {
      console.log(`$ node test/render-test.mjs`)
    } else {
      run(process.execPath, [path.join('test', 'render-test.mjs')])
    }
  }

  step('Version files')
  const readme = readFileSync(readmePath, 'utf8')
  // The git install examples pin a tag, so they follow the tag this release
  // makes; leaving them behind would advertise a version that is no longer new.
  const pin = new RegExp(`(#v)${escapeRegExp(currentVersion)}(?![0-9A-Za-z.-])`, 'g')
  const pins = (readme.match(pin) ?? []).length
  const bumpedManifest = readFileSync(manifestPath, 'utf8').replace(
    /("version":\s*")[^"]+(")/,
    `$1${targetVersion}$2`,
  )
  const bumpedReadme = readme
    .replace(/(版本 \/ version: `)[^`]+(`)/, `$1${targetVersion}$2`)
    .replace(pin, `$1${targetVersion}`)
  if (dryRun) {
    console.log(`package.json  "version": "${currentVersion}" -> "${targetVersion}"`)
    console.log(`README.md     版本 / version: \`${currentVersion}\` -> \`${targetVersion}\``)
    console.log(`README.md     ${pins} git tag example(s) v${currentVersion} -> v${targetVersion}`)
  } else {
    if (!bumpedReadme.includes(`版本 / version: \`${targetVersion}\``)) {
      throw new Error('README.md has no "版本 / version" line to update')
    }
    writeFileSync(manifestPath, bumpedManifest)
    writeFileSync(readmePath, bumpedReadme)
    progress.versionWritten = true
    console.log(`wrote ${path.relative(root, manifestPath)} and ${path.relative(root, readmePath)}`)
  }

  step('Commit and tag')
  const message = `chore(release): v${targetVersion}`
  if (dryRun) {
    console.log(`$ git add -A && git commit -m "${message}"`)
    console.log(`$ git tag -a v${targetVersion} -m "v${targetVersion}"`)
  } else {
    run('git', ['add', '-A'])
    run('git', ['commit', '-m', message])
    run('git', ['tag', '-a', `v${targetVersion}`, '-m', `v${targetVersion}`])
    progress.committed = true
  }

  if (publish) {
    step('Publish')
    const publishArgs = ['publish']
    if (otp !== undefined) publishArgs.push(`--otp=${otp}`)
    if (dryRun) {
      console.log(`$ npm ${publishArgs.join(' ')}`)
    } else {
      npm(publishArgs)
      console.log(`${name}@${targetVersion} is on the registry`)
    }
  } else {
    console.log('\nSkipped publishing (--no-publish).')
  }

  if (push) {
    step('Push')
    if (dryRun) {
      console.log('$ git push --follow-tags')
    } else {
      run('git', ['push', '--follow-tags'])
    }
  } else {
    console.log('\nSkipped pushing (--no-push); the commit and tag are local.')
  }

  console.log(`\nReleased ${name}@${targetVersion}${dryRun ? ' (dry run, nothing changed)' : ''}.`)
} catch (error) {
  console.error(`\nrelease stopped: ${error.message}`)
  if (!dryRun) {
    if (progress.committed) {
      console.error('Recovery: the release commit and tag are kept.')
      console.error(`  - publish did not finish: run \`npm publish\`${otp === undefined ? '' : ` --otp=${otp}`}, then \`git push --follow-tags\`.`)
      console.error(`  - the version is wrong: \`git tag -d v${targetVersion}\` then \`git reset --hard HEAD~1\`.`)
    } else if (progress.versionWritten) {
      console.error('Recovery: the version files were bumped but nothing was committed;')
      console.error('  `git checkout -- package.json README.md` undoes it, then re-run.')
    } else {
      console.error('Recovery: nothing was written or committed; fix the problem and re-run.')
    }
  }
  process.exit(1)
}
