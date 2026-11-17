// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')

function readRootFile(name: string): string {
  return readFileSync(join(ROOT, name), 'utf8')
}

describe('pnpm workspace config committed for the postcss override', () => {
  // pnpm 9 refuses a pnpm-workspace.yaml without `packages:` ("packages field
  // missing or empty") and does not read overrides from it at all. main installs
  // fine on pnpm 9; this branch does not. Either the file must declare packages
  // or package.json must pin a pnpm that reads workspace-level settings.
  it('installs on any pnpm the repo admits: the workspace declares packages or package.json pins pnpm >= 10', () => {
    const workspace = readRootFile('pnpm-workspace.yaml')
    const pkg = JSON.parse(readRootFile('package.json'))
    const declaresPackages = /^packages:/m.test(workspace)
    const pinnedPnpm: string =
      pkg.packageManager ?? pkg.engines?.pnpm ?? pkg.devEngines?.packageManager?.version ?? ''

    expect({ declaresPackages, pinnedPnpm }).not.toEqual({ declaresPackages: false, pinnedPnpm: '' })
  })
})

describe('tsconfig committed in the shape Next 15 enforces', () => {
  // Next 15's `next build` and `next lint` add compilerOptions.target ES2017 and
  // rewrite tsconfig.json on every run (also visible in the Vercel build log),
  // leaving tracked files dirty after every local build.
  it('already carries the compilerOptions.target that next build would add', () => {
    const tsconfig = JSON.parse(readRootFile('tsconfig.json'))

    expect(tsconfig.compilerOptions.target).toBe('ES2017')
  })

  it('carries the next-env.d.ts route types reference that next build would add', () => {
    expect(readRootFile('next-env.d.ts')).toContain('/// <reference path="./.next/types/routes.d.ts" />')
  })
})
