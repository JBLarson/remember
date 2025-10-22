from flask import Blueprint, request, jsonify
from anthropic import Anthropic
from middleware.auth_middleware import require_auth
from services.embedding_service import get_query_embedding
from sqlalchemy import text
from models import db
import os

bp = Blueprint('insights', __name__)
client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))



@bp.route('/analyze', methods=['POST'])
@require_auth
def analyze_memories(current_user):
    """AI analysis using RAG - retrieves relevant memories, then generates insights"""
    data = request.get_json()
    user_question = data.get('question')
    
    if not user_question:
        return jsonify({'error': 'Question required'}), 400
    
    try:
        print(f"Generating query embedding for: {user_question}")
        query_embedding = get_query_embedding(user_question)
        
        # Convert list to string format for pgvector
        embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'
        
        sql = text("""
            SELECT 
                id,
                encrypted_content,
                year,
                age,
                grade,
                confidence_level,
                emotional_valence,
                created_at,
                1 - (embedding <=> CAST(:query_embedding AS vector)) AS similarity
            FROM memories
            WHERE user_id = :user_id
                AND embedding IS NOT NULL
            ORDER BY embedding <=> CAST(:query_embedding AS vector)
            LIMIT 15
        """)
        
        print(f"Searching for relevant memories...")
        results = db.session.execute(sql, {
            'query_embedding': embedding_str,
            'user_id': str(current_user.id)
        })
        
        relevant_memories = []
        for row in results:
            similarity_pct = int(row.similarity * 100)
            memory_text = f"""Memory from {row.year or 'unknown year'} (Age {row.age or 'unknown'}):
{row.encrypted_content}

Metadata: Confidence {row.confidence_level}/10, Emotional valence {row.emotional_valence}, Relevance {similarity_pct}%"""
            relevant_memories.append(memory_text)
        
        if not relevant_memories:
            return jsonify({
                'analysis': 'No memories found. Please add some memories first.',
                'memories_analyzed': 0
            })
        
        print(f"Found {len(relevant_memories)} relevant memories")
        
        context = "\n\n---\n\n".join(relevant_memories)
        
        print(f"Sending to Claude for analysis...")
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=2048,
            system=[
                {
                    "type": "text",
                    "text": """You are a compassionate, insightful therapist analyzing personal memories.
                                Your role:
                                - Identify patterns, themes, and connections across memories
                                - Note emotional progressions and changes over time
                                - Highlight potential areas for growth or healing
                                - Be empathetic, constructive, and non-judgmental
                                - Avoid clinical diagnoses or labels

                                Provide thoughtful analysis that helps the person understand themselves better."""
                },
                {
                    "type": "text",
                    "text": f"""Relevant memories (retrieved via semantic search):

{context}""",
                    "cache_control": {"type": "ephemeral"}
                }
            ],
            messages=[
                {"role": "user", "content": user_question}
            ]
        )
        
        print(f"Analysis complete. Tokens used: {response.usage.input_tokens} input, {response.usage.output_tokens} output")
        
        return jsonify({
            'analysis': response.content[0].text,
            'memories_analyzed': len(relevant_memories),
            'usage': {
                'input_tokens': response.usage.input_tokens,
                'output_tokens': response.usage.output_tokens,
                'cache_read_tokens': getattr(response.usage, 'cache_read_input_tokens', 0),
                'cache_creation_tokens': getattr(response.usage, 'cache_creation_input_tokens', 0)
            }
        })
        
    except Exception as e:
        print(f"Error in analyze_memories: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@bp.route('/search', methods=['POST'])
@require_auth
def search_memories(current_user):
    """Semantic search - find memories by meaning, not just keywords"""
    data = request.get_json()
    query = data.get('query')
    limit = data.get('limit', 10)
    
    if not query:
        return jsonify({'error': 'Query required'}), 400
    
    try:
        query_embedding = get_query_embedding(query)
        
        embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'
        
        sql = text("""
            SELECT 
                id,
                encrypted_content,
                year,
                age,
                grade,
                confidence_level,
                emotional_valence,
                created_at,
                1 - (embedding <=> CAST(:query_embedding AS vector)) AS similarity
            FROM memories
            WHERE user_id = :user_id
                AND embedding IS NOT NULL
            ORDER BY embedding <=> CAST(:query_embedding AS vector)
            LIMIT :limit
        """)
        
        results = db.session.execute(sql, {
            'query_embedding': embedding_str,
            'user_id': str(current_user.id),
            'limit': limit
        })
        
        memories = []
        for row in results:
            memories.append({
                'id': str(row.id),
                'encrypted_content': row.encrypted_content,
                'year': row.year,
                'age': row.age,
                'grade': row.grade,
                'confidence_level': row.confidence_level,
                'emotional_valence': row.emotional_valence,
                'created_at': row.created_at.isoformat(),
                'similarity': round(float(row.similarity), 3)
            })
        
        return jsonify({
            'query': query,
            'memories': memories,
            'count': len(memories)
        })
        
    except Exception as e:
        print(f"Error in search_memories: {e}")
        return jsonify({'error': str(e)}), 500