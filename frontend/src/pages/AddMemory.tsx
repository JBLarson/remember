// frontend/src/pages/AddMemory.tsx
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function AddMemory() {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [year, setYear] = useState('')
  const [age, setAge] = useState('')
  const [grade, setGrade] = useState('')
  const [confidenceLevel, setConfidenceLevel] = useState(5)
  const [emotionalValence, setEmotionalValence] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const memoryData = {
        encrypted_content: content, // For now, storing as plaintext - we'll add encryption later
        encryption_key_id: 'plaintext_v1',
        year: year ? parseInt(year) : undefined,
        age: age ? parseInt(age) : undefined,
        grade: grade ? parseInt(grade) : undefined,
        confidence_level: confidenceLevel,
        emotional_valence: emotionalValence,
        date_precision: 'approximate',
        visibility: 'private',
      }

      await api.post('/memories/', memoryData)
      navigate('/memories')
    } catch (err: any) {
      console.error('Error creating memory:', err)
      setError(err.response?.data?.error || 'Failed to create memory')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1>Add New Memory</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Document a memory from your past
          </p>
        </div>

        <div className="card">
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="content">
                Memory Description *
              </label>
              <textarea
                id="content"
                className="input"
                placeholder="Describe this memory in as much detail as you remember..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                disabled={loading}
                rows={10}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="year">
                  Year
                </label>
                <input
                  id="year"
                  type="number"
                  className="input"
                  placeholder="2015"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  disabled={loading}
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="age">
                  Age
                </label>
                <input
                  id="age"
                  type="number"
                  className="input"
                  placeholder="18"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  disabled={loading}
                  min="0"
                  max="120"
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="grade">
                  Grade
                </label>
                <input
                  id="grade"
                  type="number"
                  className="input"
                  placeholder="7"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  disabled={loading}
                  min="0"
                  max="20"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">
                Confidence Level: {confidenceLevel}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={confidenceLevel}
                onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
                disabled={loading}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
                How confident are you in the accuracy of this memory?
              </span>
            </div>

            <div className="input-group">
              <label className="input-label">
                Emotional Valence: {emotionalValence > 0 ? '+' : ''}{emotionalValence}
              </label>
              <input
                type="range"
                min="-5"
                max="5"
                value={emotionalValence}
                onChange={(e) => setEmotionalValence(parseInt(e.target.value))}
                disabled={loading}
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

            <div style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              justifyContent: 'flex-end', 
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--color-border)'
            }}>
              <button 
                type="button" 
                onClick={() => navigate('/memories')} 
                className="btn btn-secondary" 
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Memory'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}