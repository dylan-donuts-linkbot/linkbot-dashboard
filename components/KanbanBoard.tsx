'use client'

import { useState, useCallback } from 'react'
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd'
import { Task, Project, TaskStatus } from '@/types'
import TaskCard from './TaskCard'
import TaskModal from './TaskModal'
import { supabase } from '@/lib/supabase'

interface KanbanBoardProps {
  tasks: Task[]
  projects: Project[]
  activeProject: string | null
  onTasksChange: () => void
}

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'in_review', label: 'In Review' },
  { id: 'done', label: 'Done' },
]

export default function KanbanBoard({ tasks, projects, activeProject, onTasksChange }: KanbanBoardProps) {
  const [editingTask, setEditingTask] = useState<Task | null | undefined>(undefined) // undefined = closed, null = new
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('backlog')

  const filtered = activeProject
    ? tasks.filter(t => t.project_id === activeProject)
    : tasks

  const byStatus = (status: TaskStatus) =>
    filtered.filter(t => t.status === status)

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination || source.droppableId === destination.droppableId) return

    const newStatus = destination.droppableId as TaskStatus
    const task = tasks.find(t => t.id === draggableId)
    if (!task) return

    // Optimistic update happens via onTasksChange — just write to DB
    await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', draggableId)

    onTasksChange()
  }, [tasks, onTasksChange])

  async function handleSaveTask(data: Partial<Task>) {
    if (editingTask) {
      // update
      await supabase
        .from('tasks')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', editingTask.id)
    } else {
      // create
      await supabase.from('tasks').insert([{
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
    }
    onTasksChange()
  }

  async function handleDeleteTask() {
    if (!editingTask) return
    await supabase.from('tasks').delete().eq('id', editingTask.id)
    onTasksChange()
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
          {COLUMNS.map(col => {
            const colTasks = byStatus(col.id)
            return (
              <div
                key={col.id}
                style={{
                  background: '#111',
                  border: '1px solid #222',
                  borderRadius: '8px',
                  padding: '12px',
                  minHeight: '200px',
                }}
              >
                {/* Column header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {col.label}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: '#555',
                      background: 'var(--bg-hover)',
                      border: '1px solid var(--border)',
                      borderRadius: '3px',
                      padding: '1px 6px',
                    }}>
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => openNew(col.id)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border)',
                      color: '#555',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '15px',
                      lineHeight: 1,
                    }}
                    title={`Add task to ${col.label}`}
                  >
                    +
                  </button>
                </div>

                {/* Drop zone */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        minHeight: '60px',
                        background: snapshot.isDraggingOver ? 'rgba(59,130,246,0.05)' : 'transparent',
                        borderRadius: '5px',
                        transition: 'background 0.1s',
                      }}
                    >
                      {colTasks.map((task, i) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={i}
                          onClick={() => setEditingTask(task)}
                        />
                      ))}
                      {provided.placeholder}

                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div style={{
                          textAlign: 'center',
                          color: '#333',
                          fontSize: '12px',
                          padding: '16px 0',
                        }}>
                          Drop here
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
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
