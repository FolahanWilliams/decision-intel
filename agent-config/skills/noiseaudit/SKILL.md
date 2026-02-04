---
name: noiseaudit
description: audits noise
---

**The Noise Audit Skill:** Create a skill that contains a Python script to perform the "Statistical Jury" calculation. The agent should use this to spawn multiple sub-agent instances to "judge" the same document independently; the script then calculates the standard deviation (Noise) between their outputs.