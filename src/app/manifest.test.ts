import { describe, it, expect } from 'vitest'
import manifest from './manifest'

describe('manifest', () => {
  it('It names the app Git Rewind', () => {
    expect(manifest().name).toBe('Git Rewind')
  })

  it('It starts at the site root', () => {
    expect(manifest().start_url).toBe('/')
  })

  it('It references the file-convention icon routes', () => {
    expect(manifest().icons?.map((icon) => icon.src)).toEqual(['/icon', '/apple-icon'])
  })

  it('It declares the rendered icon sizes and types', () => {
    expect(manifest().icons).toEqual([
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ])
  })

  it('It does not reference the removed static image files', () => {
    expect(JSON.stringify(manifest())).not.toMatch(/icon-192|icon-512|og-image/)
  })
})
