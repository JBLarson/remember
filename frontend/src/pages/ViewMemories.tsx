// src/pages/ViewMemories.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

interface Memory {
  id: string
  year?: number
  age?: number
  grade?: number
  encrypted_content: string
  confidence_level?: number
  emotional_valence?: number
  created_at: string
}

export default function ViewMemories() {
  const navigate = useNavigate()
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [memoryToDelete, setMemoryToDelete] = useState<Memory | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [memoryToEdit, setMemoryToEdit] = useState<Memory | null>(null)
  const [editForm, setEditForm] = useState({
    content: '',
    year: '',
    age: '',
    grade: '',
    confidence_level: 5,
    emotional_valence: 0
  })
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchMemories()
  }, [])

  const fetchMemories = async () => {
    try {
      setLoading(true)
      const response = await api.get('/memories/')
      setMemories(response.data.memories || [])
      setError(null)
    } catch (err: any) {
      console.error('Error fetching memories:', err)
      setError(err.response?.data?.error || 'Failed to load memories')
    } finally {
      setLoading(false)
    }
  }

  const openDeleteModal = (memory: Memory) => {
    setMemoryToDelete(memory)
    setDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setDeleteModalOpen(false)
    setMemoryToDelete(null)
  }

  const handleDelete = async () => {
    if (!memoryToDelete) return
    
    setDeleting(true)
    try {
      await api.delete(`/memories/${memoryToDelete.id}`)
      setMemories(memories.filter(m => m.id !== memoryToDelete.id))
      closeDeleteModal()
    } catch (err: any) {
      console.error('Error deleting memory:', err)
      alert('Failed to delete memory: ' + (err.response?.data?.error || err.message))
    } finally {
      setDeleting(false)
    }
  }

  const openEditModal = (memory: Memory) => {
    setMemoryToEdit(memory)
    setEditForm({
      content: memory.encrypted_content,
      year: memory.year?.toString() || '',
      age: memory.age?.toString() || '',
      grade: memory.grade?.toString() || '',
      confidence_level: memory.confidence_level || 5,
      emotional_valence: memory.emotional_valence || 0
    })
    setEditModalOpen(true)
  }

  const closeEditModal = () => {
    setEditModalOpen(false)
    setMemoryToEdit(null)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memoryToEdit) return
    
    setUpdating(true)
    try {
      const updateData = {
        encrypted_content: editForm.content,
        year: editForm.year ? parseInt(editForm.year) : null,  // Changed undefined to null
        age: editForm.age ? parseInt(editForm.age) : null,      // Changed undefined to null
        grade: editForm.grade ? parseInt(editForm.grade) : null, // Changed undefined to null
        confidence_level: editForm.confidence_level,
        emotional_valence: editForm.emotional_valence
      }
      
      const response = await api.put(`/memories/${memoryToEdit.id}`, updateData)
      setMemories(memories.map(m => m.id === memoryToEdit.id ? response.data.memory : m))
      closeEditModal()
    } catch (err: any) {
      console.error('Error updating memory:', err)
      alert('Failed to update memory: ' + (err.response?.data?.error || err.message))
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <h1>Loading memories...</h1>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          <strong>Error:</strong> {error}
        </div>
        <button onClick={fetchMemories} className="btn btn-primary">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1>Your Memories</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {memories.length} {memories.length === 1 ? 'memory' : 'memories'} found
          </p>
        </div>
        <button 
          onClick={() => navigate('/memories/add')} 
          className="btn btn-primary"
        >
          + Add Memory
        </button>
      </div>

      {memories.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '4rem 2rem',
          backgroundColor: 'white',
          borderRadius: '1rem',
          border: '1px solid var(--color-border)'
        }}>
          <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No memories yet</p>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
            Start documenting your journey
          </p>
          <button 
            onClick={() => navigate('/memories/add')} 
            className="btn btn-primary"
          >
            Add Your First Memory
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {memories.map((memory) => (
            <div key={memory.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: 'var(--color-text-secondary)',
                    marginBottom: '0.25rem'
                  }}>
                    {memory.year && `Year ${memory.year}`}
                    {memory.age && ` • Age ${memory.age}`}
                    {memory.grade && ` • Grade ${memory.grade}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                    Created: {new Date(memory.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => openEditModal(memory)}
                    className="btn btn-sm btn-secondary"
                    style={{ 
                      padding: '0.375rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem'
                    }}
                    title="Edit memory"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <span>Edit</span>
                  </button>
                  
                  <button
                    onClick={() => openDeleteModal(memory)}
                    className="btn btn-sm btn-secondary"
                    style={{ 
                      padding: '0.375rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      color: 'var(--color-error)'
                    }}
                    title="Delete memory"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
              
              <div style={{ 
                padding: '1rem',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: '0.5rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{ 
                  fontSize: '0.9375rem',
                  color: 'var(--color-text)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6'
                }}>
                  {memory.encrypted_content}
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '1rem',
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary)'
              }}>
                {memory.confidence_level && (
                  <div>Confidence: {memory.confidence_level}/10</div>
                )}
                {memory.emotional_valence !== undefined && (
                  <div>Emotional: {memory.emotional_valence > 0 ? '+' : ''}{memory.emotional_valence}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && memoryToDelete && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Memory</h3>
              <button className="modal-close" onClick={closeDeleteModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                Are you sure you want to delete this memory? This action cannot be undone.
              </p>
              <div style={{
                padding: '0.75rem',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary)',
                maxHeight: '100px',
                overflow: 'hidden'
              }}>
                {memoryToDelete.encrypted_content.substring(0, 150)}
                {memoryToDelete.encrypted_content.length > 150 && '...'}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeDeleteModal} disabled={deleting}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Memory'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && memoryToEdit && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Memory</h3>
              <button className="modal-close" onClick={closeEditModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdate}>
                <div className="input-group">
                  <label className="input-label" htmlFor="edit-content">
                    Memory Description *
                  </label>
                  <textarea
                    id="edit-content"
                    className="input"
                    value={editForm.content}
                    onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                    required
                    disabled={updating}
                    rows={8}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="edit-year">Year</label>
                    <input
                      id="edit-year"
                      type="number"
                      className="input"
                      value={editForm.year}
                      onChange={(e) => setEditForm({...editForm, year: e.target.value})}
                      disabled={updating}
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="edit-age">Age</label>
                    <input
                      id="edit-age"
                      type="number"
                      className="input"
                      value={editForm.age}
                      onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                      disabled={updating}
                      min="0"
                      max="120"
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="edit-grade">Grade</label>
                    <input
                      id="edit-grade"
                      type="number"
                      className="input"
                      value={editForm.grade}
                      onChange={(e) => setEditForm({...editForm, grade: e.target.value})}
                      disabled={updating}
                      min="0"
                      max="20"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Confidence Level: {editForm.confidence_level}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={editForm.confidence_level}
                    onChange={(e) => setEditForm({...editForm, confidence_level: parseInt(e.target.value)})}
                    disabled={updating}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Emotional Valence: {editForm.emotional_valence > 0 ? '+' : ''}{editForm.emotional_valence}
                  </label>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    value={editForm.emotional_valence}
                    onChange={(e) => setEditForm({...editForm, emotional_valence: parseInt(e.target.value)})}
                    disabled={updating}
                    style={{ width: '100%' }}
                  />
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-tertiary)'
                  }}>
                    <span>Very Negative</span>
                    <span>Neutral</span>
                    <span>Very Positive</span>
                  </div>
                </div>

                <div className="modal-footer" style={{ padding: 0, border: 0, marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeEditModal} disabled={updating}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={updating}>
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}