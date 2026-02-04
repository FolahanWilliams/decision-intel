export interface BiasDetectionResult {
    biasType: string;
    found: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    excerpt: string; // Changed from excerpts[] to single string
    explanation: string;
    suggestion: string;
}

export interface AnalysisResult {
    overallScore: number;
    noiseScore: number;
    summary: string;
    biases: BiasDetectionResult[];
    // New Fields for Multi-Agent Output
    noiseStats?: {
        mean: number;
        stdDev: number;
        variance: number;
    };
    factCheck?: {
        score: number;
        flags: string[];
    };
    compliance?: {
        status: 'PASS' | 'FLAGGED';
        details: string;
    };
    speakers?: string[];
}

export interface DocumentWithAnalysis {
    id: string;
    filename: string;
    fileType: string;
    fileSize: number;
    content: string;
    uploadedAt: Date;
    status: string;
    analyses: Array<{
        id: string;
        overallScore: number;
        noiseScore: number;
        summary: string;
        createdAt: Date;
        biases: Array<{
            id: string;
            biasType: string;
            severity: string;
            excerpt: string;
            explanation: string;
            suggestion: string;
        }>;
    }>;
}

export type BiasCategory =
    | 'confirmation_bias'
    | 'anchoring_bias'
    | 'availability_heuristic'
    | 'groupthink'
    | 'authority_bias'
    | 'bandwagon_effect'
    | 'overconfidence_bias'
    | 'hindsight_bias'
    | 'planning_fallacy'
    | 'loss_aversion'
    | 'sunk_cost_fallacy'
    | 'status_quo_bias'
    | 'framing_effect'
    | 'selective_perception'
    | 'recency_bias';

export const BIAS_CATEGORIES: Record<BiasCategory, { name: string; description: string; category: string }> = {
    confirmation_bias: {
        name: 'Confirmation Bias',
        description: 'Favoring information that confirms pre-existing beliefs',
        category: 'Judgment'
    },
    anchoring_bias: {
        name: 'Anchoring Bias',
        description: 'Over-relying on the first piece of information encountered',
        category: 'Judgment'
    },
    availability_heuristic: {
        name: 'Availability Heuristic',
        description: 'Overweighting easily recalled information',
        category: 'Judgment'
    },
    groupthink: {
        name: 'Groupthink',
        description: 'Conforming to group consensus over independent thinking',
        category: 'Group Dynamics'
    },
    authority_bias: {
        name: 'Authority Bias',
        description: 'Attributing greater accuracy to authority figures',
        category: 'Group Dynamics'
    },
    bandwagon_effect: {
        name: 'Bandwagon Effect',
        description: 'Adopting beliefs because others hold them',
        category: 'Group Dynamics'
    },
    overconfidence_bias: {
        name: 'Overconfidence Bias',
        description: 'Excessive confidence in one\'s own answers',
        category: 'Overconfidence'
    },
    hindsight_bias: {
        name: 'Hindsight Bias',
        description: 'Believing past events were predictable',
        category: 'Overconfidence'
    },
    planning_fallacy: {
        name: 'Planning Fallacy',
        description: 'Underestimating time, costs, and risks',
        category: 'Overconfidence'
    },
    loss_aversion: {
        name: 'Loss Aversion',
        description: 'Preferring to avoid losses over acquiring gains',
        category: 'Risk Assessment'
    },
    sunk_cost_fallacy: {
        name: 'Sunk Cost Fallacy',
        description: 'Continuing due to past investment rather than future value',
        category: 'Risk Assessment'
    },
    status_quo_bias: {
        name: 'Status Quo Bias',
        description: 'Preference for the current state of affairs',
        category: 'Risk Assessment'
    },
    framing_effect: {
        name: 'Framing Effect',
        description: 'Drawing conclusions based on how information is presented',
        category: 'Information'
    },
    selective_perception: {
        name: 'Selective Perception',
        description: 'Filtering information based on expectations',
        category: 'Information'
    },
    recency_bias: {
        name: 'Recency Bias',
        description: 'Overweighting recent events over historical data',
        category: 'Information'
    }
};
