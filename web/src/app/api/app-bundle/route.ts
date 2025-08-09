// Description: Route to serve the consolidated app bundle from repo-level data.

import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export async function GET() {
  const abs = resolve(process.cwd(), '..', 'data', 'app_bundle.json')
  const content = await readFile(abs, 'utf8')
  return new NextResponse(content, { headers: { 'content-type': 'application/json' } })
}


