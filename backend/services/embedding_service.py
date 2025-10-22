import voyageai
import os

vo = voyageai.Client(api_key=os.getenv('VOYAGE_API_KEY'))

def get_embedding(text: str) -> list[float]:
    """Generate embedding vector for text using Voyage AI"""
    if not text or not text.strip():
        return None
    
    result = vo.embed(
        [text],
        model="voyage-large-2-instruct",
        input_type="document"
    )
    
    return result.embeddings[0]


def get_query_embedding(text: str) -> list[float]:
    """Generate embedding for search query (uses different input_type)"""
    if not text or not text.strip():
        return None
    
    result = vo.embed(
        [text],
        model="voyage-large-2-instruct",
        input_type="query"  # Optimized for search queries
    )
    
    return result.embeddings[0]


def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for multiple texts (more efficient)"""
    texts = [t for t in texts if t and t.strip()]
    
    if not texts:
        return []
    
    result = vo.embed(
        texts,
        model="voyage-large-2-instruct",
        input_type="document"
    )
    
    return result.embeddings