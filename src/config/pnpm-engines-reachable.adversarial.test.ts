// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')

function readRootFile(name: string): string {
  return readFileSync(join(ROOT, name), 'utf8')
}

describe('engines.pnpm >=10 is enforceable on pnpm 9', () => {
  // pnpm 9 parses pnpm-workspace.yaml before it checks engines.pnpm. Without a
  // `packages:` key it aborts with "packages field missing or empty" and never
  // reports the version requirement. With `packages: ["."]` pnpm 9 prints its
  // unsupported-engine error ("install the required pnpm version") instead.
  it('declares workspace packages so pnpm 9 reports the engines error rather than a workspace parse error', () => {
    const workspace = readRootFile('pnpm-workspace.yaml')

    expect(workspace).toMatch(/^packages:/m)
  })
})
