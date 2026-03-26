import type { Metadata } from 'next'
import './globals.css'
import { createServerClient } from '@/lib/supabase-server'
import { Project } from '@/types'
import Sidebar from '@/components/layout/Sidebar'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Project HQ',
  description: "Dylan's personal ops center",
}

async function getProjects(): Promise<Project[]> {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, color, status, is_system, created_at')
      .order('created_at', { ascending: true })
    if (error) return []
    return (data as Project[]) ?? []
  } catch (error) {
    console.error('Failed to load projects for sidebar:', error)
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
    <html lang="en" suppressHydrationWarning>
      <body style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-base)', margin: 0, padding: 0 }}>
        <Providers>
          <Sidebar projects={projects} />
          <main className="main-content">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
