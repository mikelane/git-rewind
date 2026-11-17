import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { getAppInstallUrl, getAppSelectTargetUrl } from './github-app-urls'

describe('github-app-urls', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('with the slug unset', () => {
    it('returns the default install URL', () => {
      vi.stubEnv('NEXT_PUBLIC_GITHUB_APP_SLUG', '')
      expect(getAppInstallUrl()).toBe('https://github.com/apps/git-rewind/installations/new')
    })

    it('returns the default select-target URL', () => {
      vi.stubEnv('NEXT_PUBLIC_GITHUB_APP_SLUG', '')
      expect(getAppSelectTargetUrl()).toBe(
        'https://github.com/apps/git-rewind/installations/select_target'
      )
    })
  })

  describe('with a custom slug', () => {
    it('returns the install URL for that slug', () => {
      vi.stubEnv('NEXT_PUBLIC_GITHUB_APP_SLUG', 'my-rewind')
      expect(getAppInstallUrl()).toBe('https://github.com/apps/my-rewind/installations/new')
    })

    it('returns the select-target URL for that slug', () => {
      vi.stubEnv('NEXT_PUBLIC_GITHUB_APP_SLUG', 'my-rewind')
      expect(getAppSelectTargetUrl()).toBe(
        'https://github.com/apps/my-rewind/installations/select_target'
      )
    })
  })

  it('reads the slug at call time, not import time', () => {
    vi.stubEnv('NEXT_PUBLIC_GITHUB_APP_SLUG', 'first')
    const first = getAppInstallUrl()
    vi.stubEnv('NEXT_PUBLIC_GITHUB_APP_SLUG', 'second')
    expect([first, getAppInstallUrl()]).toEqual([
      'https://github.com/apps/first/installations/new',
      'https://github.com/apps/second/installations/new',
    ])
  })

  it.each(['src/app/page.tsx', 'src/components/chapters/epilogue.tsx'])(
    'keeps the github.com/apps literal out of %s and imports these helpers instead',
    (file) => {
      const source = readFileSync(join(process.cwd(), file), 'utf8')
      expect([source.includes('github.com/apps/'), source.includes('@/lib/github-app-urls')]).toEqual([
        false,
        true,
      ])
    }
  )
})
