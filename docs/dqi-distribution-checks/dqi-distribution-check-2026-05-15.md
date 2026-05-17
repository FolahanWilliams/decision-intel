# DQI Distribution Check — Held-Out Sample Regression

Generated: 2026-05-15T07:47:04.803Z
Methodology under test: 2.4.0 canonical default (22×22 interaction matrix, M-1 epoch 2026-05-13) · 2.3.0 user-adjustable-weights path

Cells computed: 20 (5 sample memos × 4 weight configs)
Score range: [56, 92]
Mean score: 75.4
Invariant violations: NONE ✓

## Distribution

| Memo                                                                     | Config                                                       | Score | Grade | Methodology | Hash           |
| ------------------------------------------------------------------------ | ------------------------------------------------------------ | ----- | ----- | ----------- | -------------- |
| Clean memo · low bias load · adequate process                            | Canonical baseline (methodology 2.4.0 default; 22×22 matrix) | 92    | A     | 2.4.0       | `4e51b0850db4` |
| Clean memo · low bias load · adequate process                            | Small-fund GP                                                | 89    | A     | 2.3.0       | `c69bb43f0001` |
| Clean memo · low bias load · adequate process                            | Mid-market corp dev                                          | 92    | A     | 2.3.0       | `0c86787d7fd6` |
| Clean memo · low bias load · adequate process                            | Fractional CSO                                               | 92    | A     | 2.3.0       | `8a7e48a40353` |
| Mid-market corp dev · IC memo · Synergy Mirage critical + winner's curse | Canonical baseline (methodology 2.4.0 default; 22×22 matrix) | 56    | C     | 2.4.0       | `4e51b0850db4` |
| Mid-market corp dev · IC memo · Synergy Mirage critical + winner's curse | Small-fund GP                                                | 56    | C     | 2.3.0       | `c69bb43f0001` |
| Mid-market corp dev · IC memo · Synergy Mirage critical + winner's curse | Mid-market corp dev                                          | 57    | C     | 2.3.0       | `0c86787d7fd6` |
| Mid-market corp dev · IC memo · Synergy Mirage critical + winner's curse | Fractional CSO                                               | 58    | C     | 2.3.0       | `8a7e48a40353` |
| Small-fund GP · venture memo · low-validity environment                  | Canonical baseline (methodology 2.4.0 default; 22×22 matrix) | 73    | B     | 2.4.0       | `4e51b0850db4` |
| Small-fund GP · venture memo · low-validity environment                  | Small-fund GP                                                | 75    | B     | 2.3.0       | `c69bb43f0001` |
| Small-fund GP · venture memo · low-validity environment                  | Mid-market corp dev                                          | 74    | B     | 2.3.0       | `0c86787d7fd6` |
| Small-fund GP · venture memo · low-validity environment                  | Fractional CSO                                               | 75    | B     | 2.3.0       | `8a7e48a40353` |
| Fractional CSO · market-entry memo · mixed bias profile                  | Canonical baseline (methodology 2.4.0 default; 22×22 matrix) | 79    | B     | 2.4.0       | `4e51b0850db4` |
| Fractional CSO · market-entry memo · mixed bias profile                  | Small-fund GP                                                | 77    | B     | 2.3.0       | `c69bb43f0001` |
| Fractional CSO · market-entry memo · mixed bias profile                  | Mid-market corp dev                                          | 80    | B     | 2.3.0       | `0c86787d7fd6` |
| Fractional CSO · market-entry memo · mixed bias profile                  | Fractional CSO                                               | 80    | B     | 2.3.0       | `8a7e48a40353` |
| PE-backed founder · board memo · escalation-of-commitment risk           | Canonical baseline (methodology 2.4.0 default; 22×22 matrix) | 76    | B     | 2.4.0       | `4e51b0850db4` |
| PE-backed founder · board memo · escalation-of-commitment risk           | Small-fund GP                                                | 73    | B     | 2.3.0       | `c69bb43f0001` |
| PE-backed founder · board memo · escalation-of-commitment risk           | Mid-market corp dev                                          | 77    | B     | 2.3.0       | `0c86787d7fd6` |
| PE-backed founder · board memo · escalation-of-commitment risk           | Fractional CSO                                               | 77    | B     | 2.3.0       | `8a7e48a40353` |

## Invariants enforced

1. Every computed DQI ∈ [0, 100]
2. User-adjustable weights stamp methodology 2.3.0
3. Canonical weights + compoundPatterns stamp methodology 2.4.0
4. weightsHash is a stable 12-char hex per (weights × input) pair
5. All weight configs pass `validateUserAdjustableWeights` (sum-to-1 ± 0.001)
