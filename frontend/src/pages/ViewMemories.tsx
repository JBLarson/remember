// src/pages/ViewMemories.tsx
import { useState, useEffect } from 'react'
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
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMemories()
  }, [])

  const fetchMemories = async () => {
    try {
      setLoading(true)
      const response = await api.get('/memories')
      setMemories(response.data.memories || [])
      setError(null)
    } catch (err: any) {
      console.error('Error fetching memories:', err)
      setError(err.response?.data?.error || 'Failed to load memories')
    } finally {
      setLoading(false)
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
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Your Memories</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          {memories.length} {memories.length === 1 ? 'memory' : 'memories'} found
        </p>
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
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Add some test memories in Supabase to see them here
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {memories.map((memory) => (
            <div key={memory.id} className="card">
              <div style={{ marginBottom: '0.75rem' }}>
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
                  ID: {memory.id.substring(0, 8)}...
                </div>
              </div>
              
              <div style={{ 
                padding: '1rem',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: '0.5rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{ 
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  color: 'var(--color-text-secondary)',
                  wordBreak: 'break-all'
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
                <div>Created: {new Date(memory.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <button onClick={fetchMemories} className="btn btn-secondary">
          Refresh
        </button>
      </div>
    </div>
  )
}