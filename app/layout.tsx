import type { Metadata } from 'next'
import './globals.css'
import { createServerClient } from '@/lib/supabase'
import { Project } from '@/types'
import Sidebar from '@/components/layout/Sidebar'

export const metadata: Metadata = {
  title: 'Project HQ',
  description: "Dylan's personal ops center",
}

async function getProjects(): Promise<Project[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, color, status, is_system, created_at')
      .order('created_at', { ascending: true })
    if (error) return []
    return (data as Project[]) ?? []
  } catch {
    return []
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const projects = await getProjects()

  return (
    <html lang="en">
      <body style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0a0a0f', margin: 0, padding: 0 }}>
        <Sidebar projects={projects} />
        <main style={{
          flex: 1,
          marginLeft: '240px',
          padding: '28px 32px',
          overflowY: 'auto',
          minHeight: '100vh',
        }}>
          {children}
        </main>
      </body>
    </html>
  )
}
