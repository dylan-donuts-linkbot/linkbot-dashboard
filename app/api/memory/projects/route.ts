import { NextResponse } from 'next/server'

const REPO = 'dylan-donuts-linkbot/linkbot-dashboard'
const DIR_PATH = 'memory/projects'

function githubHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
  }
}

interface GithubFile {
  type: string
  name: string
  path: string
  sha: string
  size: number
}

export async function GET() {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${DIR_PATH}`,
    { headers: githubHeaders(), cache: 'no-store' }
  )
  if (!res.ok) {
    if (res.status === 404) {
      return NextResponse.json({ files: [] })
    }
    return NextResponse.json({ error: 'Failed to fetch' }, { status: res.status })
  }
  const data = await res.json()
  const files = Array.isArray(data)
    ? data
        .filter((f: GithubFile) => f.type === 'file' && f.name.endsWith('.md'))
        .map((f: GithubFile) => ({
          name: f.name,
          path: f.path,
          sha: f.sha,
          size: f.size,
          slug: f.name.replace(/\.md$/, ''),
        }))
    : []
  return NextResponse.json({ files })
}
