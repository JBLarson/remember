#!/usr/bin/env python3
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from models import Memory
from services.embedding_service import get_embeddings_batch

def backfill():
    app = create_app()
    
    with app.app_context():
        # Get memories without embeddings
        memories = Memory.query.filter(Memory.embedding.is_(None)).all()
        
        print(f"Found {len(memories)} memories without embeddings")
        
        if not memories:
            print("Nothing to backfill!")
            return
        
        # Process in batches of 128 (Voyage API limit)
        batch_size = 100
        total_batches = (len(memories) + batch_size - 1) // batch_size
        
        for i in range(0, len(memories), batch_size):
            batch = memories[i:i+batch_size]
            texts = [m.encrypted_content for m in batch]
            
            print(f"Processing batch {i//batch_size + 1}/{total_batches} ({len(batch)} memories)...")
            
            try:
                embeddings = get_embeddings_batch(texts)
                
                for memory, embedding in zip(batch, embeddings):
                    memory.embedding = embedding
                
                db.session.commit()
                print(f"  ✓ Batch {i//batch_size + 1} complete")
                
            except Exception as e:
                print(f"  ✗ Error in batch {i//batch_size + 1}: {e}")
                db.session.rollback()
        
        print("\nBackfill complete!")

if __name__ == '__main__':
    backfill()