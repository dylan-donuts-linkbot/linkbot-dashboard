import { NextRequest, NextResponse } from 'next/server'

const REPO = 'dylan-donuts-linkbot/linkbot-dashboard'
const FILE_PATH = 'MEMORY.md'

function githubHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }
}

export async function GET() {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
    { headers: githubHeaders(), cache: 'no-store' }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json(
      { error: (err as { message?: string }).message || 'Failed to fetch' },
      { status: res.status }
    )
  }
  const data = await res.json()
  const content = Buffer.from(data.content, 'base64').toString('utf-8')
  return NextResponse.json({ content, sha: data.sha })
}

export async function PUT(req: NextRequest) {
  const { content, sha, message } = await req.json()
  const encoded = Buffer.from(content, 'utf-8').toString('base64')

  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers: githubHeaders(),
      body: JSON.stringify({
        message: message || 'Update MEMORY.md via dashboard',
        content: encoded,
        sha,
      }),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json(
      { error: (err as { message?: string }).message || 'Failed to update' },
      { status: res.status }
    )
  }
  const data = await res.json()
  return NextResponse.json({ sha: data.content.sha })
}
