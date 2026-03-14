'use client'

import { useState, useCallback } from 'react'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { Task, Project, TaskStatus } from '@/types'
import KanbanColumn from './KanbanColumn'
import TaskModal from '@/components/tasks/TaskModal'
import { createTask, updateTask, deleteTask, updateTaskStatus } from '@/lib/actions'
import { useRouter } from 'next/navigation'

interface KanbanBoardProps {
  initialTasks: Task[]
  projects: Project[]
  activeProjectId?: string | null
}

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'in_review', label: 'In Review' },
  { id: 'done', label: 'Done' },
]

export default function KanbanBoard({ initialTasks, projects, activeProjectId }: KanbanBoardProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [editingTask, setEditingTask] = useState<Task | null | undefined>(undefined)
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('backlog')

  const filtered = activeProjectId
    ? tasks.filter(t => t.project_id === activeProjectId)
    : tasks

  const byStatus = (status: TaskStatus) =>
    filtered.filter(t => t.status === status)

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination || source.droppableId === destination.droppableId) return

    const newStatus = destination.droppableId as TaskStatus

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === draggableId ? { ...t, status: newStatus } : t
    ))

    try {
      await updateTaskStatus(draggableId, newStatus)
      router.refresh()
    } catch {
      // Revert optimistic update
      setTasks(initialTasks)
    }
  }, [initialTasks, router])

  async function handleSaveTask(data: Partial<Task>) {
    if (editingTask) {
      const updated = await updateTask(editingTask.id, data)
      setTasks(prev => prev.map(t => t.id === editingTask.id ? updated : t))
    } else {
      const created = await createTask({
        ...data,
        status: data.status ?? newTaskStatus,
        title: data.title ?? '',
      })
      setTasks(prev => [...prev, created])
    }
    router.refresh()
  }

  async function handleDeleteTask() {
    if (!editingTask) return
    await deleteTask(editingTask.id)
    setTasks(prev => prev.filter(t => t.id !== editingTask.id))
    router.refresh()
  }

  function openNew(status: TaskStatus) {
    setNewTaskStatus(status)
    setEditingTask(null)
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          alignItems: 'start',
        }}>
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              tasks={byStatus(col.id)}
              onAddTask={() => openNew(col.id)}
              onTaskClick={setEditingTask}
            />
          ))}
        </div>
      </DragDropContext>

      {editingTask !== undefined && (
        <TaskModal
          task={editingTask}
          projects={projects}
          defaultStatus={newTaskStatus}
          onSave={handleSaveTask}
          onDelete={editingTask ? handleDeleteTask : undefined}
          onClose={() => setEditingTask(undefined)}
        />
      )}
    </>
  )
}
