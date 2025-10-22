import { useState } from 'react'
import type { FormEvent } from 'react'
import api from '../services/api'

export default function Analyze() {
  const [question, setQuestion] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [memoriesAnalyzed, setMemoriesAnalyzed] = useState(0)
  const [usage, setUsage] = useState<any>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setAnalysis('')
    setLoading(true)

    try {
      const response = await api.post('/insights/analyze', { question })
      setAnalysis(response.data.analysis)
      setMemoriesAnalyzed(response.data.memories_analyzed)
      setUsage(response.data.usage)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to analyze memories')
    } finally {
      setLoading(false)
    }
  }

  const exampleQuestions = [
    "What patterns do you see in my relationships?",
    "Tell me about my childhood experiences with authority figures",
    "How have my perspectives on family changed over time?",
    "What recurring themes appear in my memories about school?",
    "Analyze my experiences with conflict and how I handled it"
  ]

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1>AI Memory Analysis</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Ask questions about patterns, themes, or insights across your memories.
            AI will search for relevant memories and provide thoughtful analysis.
          </p>
        </div>

        <div className="card" style={{ marginBottom: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="question">
                What would you like to understand?
              </label>
              <textarea
                id="question"
                className="input"
                placeholder="e.g., What patterns do you see in my childhood memories?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                disabled={loading}
                rows={4}
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Analyzing memories...</span>
                </>
              ) : (
                'Analyze Memories'
              )}
            </button>
          </form>

          {exampleQuestions.length > 0 && !analysis && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Example questions:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {exampleQuestions.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setQuestion(q)}
                    className="btn btn-secondary"
                    style={{ 
                      justifyContent: 'flex-start', 
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      padding: '0.5rem 0.75rem'
                    }}
                    disabled={loading}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {analysis && (
          <div className="card">
            <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Analysis</h3>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                Based on {memoriesAnalyzed} relevant {memoriesAnalyzed === 1 ? 'memory' : 'memories'}
                {usage && ` • ${usage.input_tokens} input tokens, ${usage.output_tokens} output tokens`}
              </div>
            </div>
            <div style={{ 
              whiteSpace: 'pre-wrap', 
              lineHeight: '1.7',
              color: 'var(--color-text)'
            }}>
              {analysis}
            </div>
            
            <div style={{ 
              marginTop: '1.5rem', 
              paddingTop: '1.5rem', 
              borderTop: '1px solid var(--color-border)' 
            }}>
              <button 
                onClick={() => {
                  setAnalysis('')
                  setQuestion('')
                  setMemoriesAnalyzed(0)
                  setUsage(null)
                }}
                className="btn btn-secondary"
              >
                Ask Another Question
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}