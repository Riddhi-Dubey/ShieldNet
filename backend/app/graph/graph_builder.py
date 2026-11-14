import networkx as nx
from sqlalchemy.orm import Session
from backend.app.models.entity import Entity
from backend.app.models.relationship import Relationship


def build_networkx_graph(db: Session) -> nx.MultiDiGraph:
    """
    Constructs an in-memory NetworkX directed multigraph from database entities and relationships.
    Preserves all provenance attributes on nodes and edges.
    """
    G = nx.MultiDiGraph()

    entities = db.query(Entity).all()
    for e in entities:
        G.add_node(
            e.entity_id,
            entity_type=e.entity_type,
            identifier=e.identifier,
            normalized_value=e.normalized_value,
            risk_score=float(e.risk_score),
            risk_level=e.risk_level,
            source_dataset=e.source_dataset,
            evidence_status=e.evidence_status
        )

    relationships = db.query(Relationship).all()
    for r in relationships:
        # Only add edge if both endpoints exist in the graph
        if G.has_node(r.source_entity_id) and G.has_node(r.target_entity_id):
            G.add_edge(
                r.source_entity_id,
                r.target_entity_id,
                key=r.relationship_id,
                relationship_id=r.relationship_id,
                relationship_type=r.relationship_type,
                confidence=float(r.confidence),
                evidence_source=r.evidence_source,
                evidence_status=r.evidence_status,
                metadata=r.relationship_metadata
            )

    return G
