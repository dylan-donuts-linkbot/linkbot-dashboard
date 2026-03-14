import { NextRequest, NextResponse } from 'next/server'

const REPO = 'dylan-donuts-linkbot/linkbot-dashboard'
const DIR_PATH = 'memory/projects'

function githubHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const filePath = `${DIR_PATH}/${slug}.md`

  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${filePath}`,
    { headers: githubHeaders(), cache: 'no-store' }
  )
  if (!res.ok) {
    return NextResponse.json({ error: 'Not found' }, { status: res.status })
  }
  const data = await res.json()
  const content = Buffer.from(data.content, 'base64').toString('utf-8')
  return NextResponse.json({ content, sha: data.sha, name: data.name })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { content, sha, message } = await req.json()
  const filePath = `${DIR_PATH}/${slug}.md`
  const encoded = Buffer.from(content, 'utf-8').toString('base64')

  const body: Record<string, string> = {
    message: message || `Update ${slug}.md via dashboard`,
    content: encoded,
  }
  if (sha) body.sha = sha

  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${filePath}`,
    {
      method: 'PUT',
      headers: githubHeaders(),
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json(
      { error: (err as { message?: string }).message || 'Failed to save' },
      { status: res.status }
    )
  }
  const data = await res.json()
  return NextResponse.json({ sha: data.content.sha })
}
