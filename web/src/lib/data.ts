// Description: Data loader for the consolidated app bundle.

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { AppBundle } from './types'

export async function loadAppBundle(): Promise<AppBundle> {
  const abs = resolve(process.cwd(), '..', '..', 'data', 'app_bundle.json')
  const content = await readFile(abs, 'utf8')
  return JSON.parse(content) as AppBundle
}




