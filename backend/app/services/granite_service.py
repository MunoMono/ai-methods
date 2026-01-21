"""
Granite LLM Service for Epistemic Drift Analysis

This service manages IBM Granite model loading, inference, and integration
with the provenance system for academically rigorous AI outputs.
"""

import logging
from typing import Optional, Dict, Any, List
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from datetime import datetime
import os

logger = logging.getLogger(__name__)


class GraniteService:
    """Service for managing Granite LLM inference with provenance tracking."""
    
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.model_name = os.getenv("GRANITE_MODEL_PATH", "ibm-granite/granite-3.1-8b-instruct")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.max_new_tokens = int(os.getenv("GRANITE_MAX_TOKENS", "512"))
        self.temperature = float(os.getenv("GRANITE_TEMPERATURE", "0.7"))
        
    def load_model(self) -> bool:
        """
        Load Granite model with 8-bit quantization for memory efficiency.
        
        Returns:
            bool: True if model loaded successfully, False otherwise
        """
        try:
            logger.info(f"Loading Granite model: {self.model_name}")
            logger.info(f"Device: {self.device}")
            
            # Configure 8-bit quantization for memory efficiency
            quantization_config = BitsAndBytesConfig(
                load_in_8bit=True,
                llm_int8_threshold=6.0,
                llm_int8_has_fp16_weight=False,
            ) if self.device == "cuda" else None
            
            # Load tokenizer
            logger.info("Loading tokenizer...")
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                trust_remote_code=True
            )
            
            # Load model
            logger.info("Loading model (this may take a few minutes)...")
            model_kwargs = {
                "trust_remote_code": True,
                "torch_dtype": torch.float16 if self.device == "cuda" else torch.float32,
            }
            
            if quantization_config:
                model_kwargs["quantization_config"] = quantization_config
                model_kwargs["device_map"] = "auto"
            
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                **model_kwargs
            )
            
            if self.device == "cpu" and quantization_config is None:
                self.model = self.model.to(self.device)
            
            logger.info(f"✓ Granite model loaded successfully on {self.device}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load Granite model: {str(e)}")
            return False
    
    def generate_analysis(
        self,
        query: str,
        context_chunks: List[Dict[str, Any]],
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Generate analysis using Granite model with retrieved context.
        
        Args:
            query: Research question or analytical query
            context_chunks: List of retrieved document chunks with metadata
            max_tokens: Maximum tokens to generate (default from config)
            temperature: Sampling temperature (default from config)
            
        Returns:
            Dict containing analysis text, metadata, and timing info
        """
        if self.model is None or self.tokenizer is None:
            raise RuntimeError("Granite model not loaded. Call load_model() first.")
        
        start_time = datetime.now()
        
        # Build prompt with context
        prompt = self._build_prompt(query, context_chunks)
        
        # Tokenize
        inputs = self.tokenizer(prompt, return_tensors="pt")
        if self.device == "cuda":
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        # Generate
        logger.info(f"Generating response for query: {query[:100]}...")
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_tokens or self.max_new_tokens,
                temperature=temperature or self.temperature,
                do_sample=True,
                top_p=0.95,
                pad_token_id=self.tokenizer.eos_token_id
            )
        
        # Decode
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract only the generated portion (remove prompt)
        generated_text = response[len(prompt):].strip()
        
        end_time = datetime.now()
        inference_time = (end_time - start_time).total_seconds()
        
        logger.info(f"✓ Generated {len(generated_text)} chars in {inference_time:.2f}s")
        
        return {
            "analysis": generated_text,
            "query": query,
            "num_context_chunks": len(context_chunks),
            "inference_time_seconds": inference_time,
            "model": self.model_name,
            "timestamp": end_time.isoformat(),
            "context_chunk_ids": [chunk.get("id") for chunk in context_chunks]
        }
    
    def _build_prompt(self, query: str, context_chunks: List[Dict[str, Any]]) -> str:
        """
        Build prompt with research query and retrieved context chunks.
        
        Args:
            query: User's research question
            context_chunks: Retrieved document chunks with citations
            
        Returns:
            Formatted prompt string
        """
        # Format context with citations
        context_parts = []
        for i, chunk in enumerate(context_chunks, 1):
            text = chunk.get("text", "")
            citation = chunk.get("citation", f"Source {i}")
            context_parts.append(f"[{i}] {text}\n   Citation: {citation}")
        
        context_text = "\n\n".join(context_parts)
        
        # Build prompt following Granite instruction format
        prompt = f"""You are an expert in design methods research, analyzing historical literature from 1965-1985.

Your task is to analyze the following archival sources to answer a research question about epistemic drift in design theory.

IMPORTANT GUIDELINES:
1. Base your analysis ONLY on the provided sources
2. Cite specific sources using [1], [2], etc. when making claims
3. If sources don't contain enough information, say so explicitly
4. Focus on epistemological assumptions and theoretical frameworks
5. Note any shifts in terminology, concepts, or methodological approaches

SOURCES:
{context_text}

RESEARCH QUESTION:
{query}

ANALYSIS:
"""
        
        return prompt
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the loaded model.
        
        Returns:
            Dict with model metadata
        """
        return {
            "model_name": self.model_name,
            "device": self.device,
            "loaded": self.model is not None,
            "max_tokens": self.max_new_tokens,
            "temperature": self.temperature,
            "quantized": "8bit" if self.device == "cuda" else "none"
        }


# Global instance
_granite_service: Optional[GraniteService] = None


def get_granite_service() -> GraniteService:
    """Get or create the global Granite service instance."""
    global _granite_service
    if _granite_service is None:
        _granite_service = GraniteService()
    return _granite_service


async def initialize_granite():
    """Initialize Granite service on application startup."""
    logger.info("Initializing Granite service...")
    service = get_granite_service()
    success = service.load_model()
    if success:
        logger.info("✓ Granite service ready")
    else:
        logger.warning("⚠ Granite service failed to initialize - inference will not be available")
    return success
