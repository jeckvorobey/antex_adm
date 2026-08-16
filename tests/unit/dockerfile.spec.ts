import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const dockerfilePath = resolve(process.cwd(), 'Dockerfile')

describe('Dockerfile', () => {
  it('не загружает внешний Dockerfile frontend перед сборкой', () => {
    const dockerfile = readFileSync(dockerfilePath, 'utf8')

    expect(dockerfile).not.toMatch(/^# syntax=/m)
    expect(dockerfile).toContain('RUN --mount=type=cache')
  })
})
