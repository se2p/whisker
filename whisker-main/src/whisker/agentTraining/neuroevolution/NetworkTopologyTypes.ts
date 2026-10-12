import { NodeGene } from "./networkComponents/NodeGene";
import { ConnectionGene } from "./networkComponents/ConnectionGene";

/**
 * A single node as serialized by NodeGene.toJSON(), reused here for the network-topology/species charts.
 */
export type SerializedNode = ReturnType<NodeGene['toJSON']>;

/**
 * A single connection as serialized by ConnectionGene.toJSON(), reused here for the network-topology/
 * species charts. Only enabled connections are ever included (filtered before serialization).
 */
export type SerializedConnection = ReturnType<ConnectionGene['toJSON']>;

/**
 * A snapshot of the best network's topology at a given generation, as reported to and cached for the
 * network-topology chart in the UI.
 */
export interface NetworkTopologySnapshot {
    generation: number;
    nodes: SerializedNode[];
    connections: SerializedConnection[];
}

/**
 * A single species' representative network topology, as included in a SpeciesTopologySnapshot.
 */
export interface SpeciesTopologyEntry {
    speciesId: number;
    memberCount: number;
    averageFitness: number;
    nodes: SerializedNode[];
    connections: SerializedConnection[];
}

/**
 * A snapshot of every species' representative network topology at a given generation, as reported to
 * and cached for the species-networks chart in the UI.
 */
export interface SpeciesTopologySnapshot {
    generation: number;
    species: SpeciesTopologyEntry[];
    bestSpeciesId: number | null;
}

/**
 * A UI request to re-serve a past generation's topology/species snapshot (see REQUEST_TOPOLOGY_GEN and
 * REQUEST_SPECIES_TOPOLOGY_GEN).
 */
export interface TopologyGenerationRequest {
    generation: number;
}
