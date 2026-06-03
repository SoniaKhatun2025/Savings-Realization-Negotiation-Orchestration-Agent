from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional

class Node(BaseModel):
    id: str
    type: str  # Supplier, Contract, Invoice, Opportunity, Negotiation, Savings, Category, Policy, Benchmark
    properties: Dict[str, Any] = Field(default_factory=dict)

class Edge(BaseModel):
    source: str
    target: str
    relationship: str  # HAS_CONTRACT, HAS_INVOICE, EXCEEDS_BENCHMARK, GENERATED_OPPORTUNITY, etc.
    properties: Dict[str, Any] = Field(default_factory=dict)

class SupplierGraph(BaseModel):
    supplier: str
    nodes: List[Node] = Field(default_factory=list)
    edges: List[Edge] = Field(default_factory=list)
