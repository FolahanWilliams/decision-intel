'use client';

import { useState, useEffect, useCallback } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { EnhancedEmptyState } from '@/components/ui/EnhancedEmptyState';
import {
  BookTemplate,
  Plus,
  ChevronRight,
  Shield,
  Brain,
  Users,
  TrendingUp,
  Target,
  Briefcase,
  Loader2,
  X,
  Check,
} from 'lucide-react';

interface Playbook {
  id: string;
  name: string;
  description: string;
  category: string;
  industry: string | null;
  documentType: string | null;
  complianceFrameworks: string[];
  biasFocus: string[];
  personaConfig: {
    roles: Array<{ name: string; role: string; focus: string; riskTolerance: string }>;
  } | null;
  isBuiltIn: boolean;
  isPublic: boolean;
  usageCount: number;
  createdAt: string | null;
}

interface Category {
  value: string;
  label: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  m_and_a: <Briefcase size={18} />,
  board_review: <Users size={18} />,
  risk_assessment: <Shield size={18} />,
  investment_committee: <TrendingUp size={18} />,
  strategic_planning: <Target size={18} />,
  custom: <Brain size={18} />,
};

/** Risk-tolerance accent colours driven by severity tokens so the
 *  palette follows both themes and matches the rest of the platform
 *  (previously shipped as raw hex, which broke the dark-theme severity
 *  ramp and made Playbooks read hotter than any other surface). */
const RISK_COLORS: Record<string, string> = {
  conservative: 'var(--error)',
  moderate: 'var(--warning)',
  aggressive: 'var(--success)',
};

function PlaybooksPageContent() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPlaybook, setNewPlaybook] = useState({
    name: '',
    description: '',
    category: 'custom',
    industry: '',
    biasFocus: '',
  });

  const fetchPlaybooks = useCallback(async () => {
    try {
      const params = selectedCategory ? `?category=${selectedCategory}` : '';
      const res = await fetch(`/api/playbooks${params}`);
      if (res.ok) {
        const data = await res.json();
        setPlaybooks(data.playbooks || []);
        if (data.categories) setCategories(data.categories);
      }
    } catch {
      // Silent fail — UI will show empty state
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchPlaybooks();
  }, [fetchPlaybooks]);

  const handleCreate = async () => {
    if (!newPlaybook.name.trim() || !newPlaybook.description.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/playbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlaybook.name,
          description: newPlaybook.description,
          category: newPlaybook.category,
          industry: newPlaybook.industry || null,
          biasFocus: newPlaybook.biasFocus
            ? newPlaybook.biasFocus
                .split(',')
                .map(s => s.trim())
                .filter(Boolean)
            : [],
          complianceFrameworks: [],
          personaConfig: null,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewPlaybook({
          name: '',
          description: '',
          category: 'custom',
          industry: '',
          biasFocus: '',
        });
        fetchPlaybooks();
      }
    } catch {
      // Error handled by API
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/playbooks/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPlaybooks(prev => prev.filter(p => p.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header — shared .page-header rhythm */}
      <div className="page-header">
        <div>
          <h1>
            <span className="text-gradient">Decision Playbooks</span>
          </h1>
          <p className="page-subtitle" style={{ maxWidth: 640 }}>
            Pre-configured audit templates for the strategic memos your team runs most: market
            entries, acquisitions, capital allocations, and board reviews. Each playbook tunes the
            bias taxonomy, simulation personas, and compliance frameworks to the decision type.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn btn-primary"
          style={{ gap: 8, whiteSpace: 'nowrap' }}
        >
          <Plus size={16} />
          New Playbook
        </button>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setSelectedCategory(null)}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            border: '1px solid',
            borderColor: !selectedCategory ? 'var(--accent-primary)' : 'var(--border-color)',
            background: !selectedCategory ? 'var(--accent-primary)' : 'transparent',
            color: !selectedCategory ? 'var(--text-on-accent, #fff)' : 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: '1px solid',
              borderColor:
                selectedCategory === cat.value ? 'var(--accent-primary)' : 'var(--border-color)',
              background: selectedCategory === cat.value ? 'var(--accent-primary)' : 'transparent',
              color:
                selectedCategory === cat.value
                  ? 'var(--text-on-accent, #fff)'
                  : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {CATEGORY_ICONS[cat.value]}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      )}

      {/* Playbook Grid */}
      {!loading && (
        <div style={{ display: 'grid', gap: 12 }}>
          {playbooks.map(pb => (
            <div
              key={pb.id}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}
            >
              {/* Card Header */}
              <button
                onClick={() => setExpandedId(expandedId === pb.id ? null : pb.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-primary)',
                    flexShrink: 0,
                  }}
                >
                  {CATEGORY_ICONS[pb.category] || <BookTemplate size={18} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {pb.name}
                    </span>
                    {pb.isBuiltIn && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#818cf8',
                          fontWeight: 600,
                        }}
                      >
                        BUILT-IN
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: expandedId === pb.id ? 'normal' : 'nowrap',
                    }}
                  >
                    {pb.description}
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  style={{
                    color: 'var(--text-muted)',
                    transform: expandedId === pb.id ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.15s',
                    flexShrink: 0,
                  }}
                />
              </button>

              {/* Expanded Detail */}
              {expandedId === pb.id && (
                <div
                  style={{
                    padding: '0 16px 16px',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  {/* Bias Focus */}
                  {pb.biasFocus.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          marginBottom: 6,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Bias Focus Areas
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {pb.biasFocus.map(bias => (
                          <span
                            key={bias}
                            style={{
                              fontSize: 11,
                              padding: '3px 8px',
                              borderRadius: 4,
                              background: 'rgba(var(--error-rgb), 0.08)',
                              color: 'var(--error)',
                              border: '1px solid rgba(var(--error-rgb), 0.2)',
                            }}
                          >
                            {bias.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Compliance Frameworks */}
                  {pb.complianceFrameworks.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          marginBottom: 6,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Compliance Frameworks
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {pb.complianceFrameworks.map(fw => (
                          <span
                            key={fw}
                            style={{
                              fontSize: 11,
                              padding: '3px 8px',
                              borderRadius: 4,
                              background: 'var(--bg-tertiary)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            {fw.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Personas */}
                  {pb.personaConfig?.roles && pb.personaConfig.roles.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          marginBottom: 6,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Boardroom Personas ({pb.personaConfig.roles.length})
                      </div>
                      <div style={{ display: 'grid', gap: 6 }}>
                        {pb.personaConfig.roles.map((persona, i) => (
                          <div
                            key={i}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '6px 10px',
                              borderRadius: 6,
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <div
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: RISK_COLORS[persona.riskTolerance] || '#6b7280',
                                flexShrink: 0,
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {persona.name}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {persona.role} — {persona.focus}
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: 10,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: `${RISK_COLORS[persona.riskTolerance] || '#6b7280'}15`,
                                color: RISK_COLORS[persona.riskTolerance] || '#6b7280',
                              }}
                            >
                              {persona.riskTolerance}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meta */}
                  <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
                    {pb.industry && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        <strong>Industry:</strong> {pb.industry.replace(/_/g, ' ')}
                      </div>
                    )}
                    {pb.documentType && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        <strong>Document Type:</strong> {pb.documentType.replace(/_/g, ' ')}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    {!pb.isBuiltIn && (
                      <button
                        onClick={() => handleDelete(pb.id)}
                        style={{
                          fontSize: 12,
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: '1px solid rgba(var(--error-rgb), 0.35)',
                          background: 'transparent',
                          color: 'var(--error)',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Empty State */}
          {playbooks.length === 0 && !loading && (
            <EnhancedEmptyState
              type="generic"
              title={selectedCategory ? 'No playbooks in this category' : 'No playbooks yet'}
              description="Decision playbooks are pre-configured analysis templates for common high-stakes decisions. Create one to optimize your bias detection pipeline."
              showBrief
              briefContext="playbooks"
              actions={[
                {
                  label: 'New Playbook',
                  onClick: () => setShowCreate(true),
                  variant: 'primary',
                  icon: <Plus size={16} />,
                },
              ]}
            />
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 1000 }}
          onClick={() => setShowCreate(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
              padding: 24,
              width: '100%',
              maxWidth: 480,
              margin: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <h2
                style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}
              >
                New Custom Playbook
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Name
                </label>
                <input
                  value={newPlaybook.name}
                  onChange={e => setNewPlaybook({ ...newPlaybook, name: e.target.value })}
                  placeholder="e.g., Quarterly Board Review"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Description
                </label>
                <textarea
                  value={newPlaybook.description}
                  onChange={e => setNewPlaybook({ ...newPlaybook, description: e.target.value })}
                  placeholder="What types of decisions does this playbook help with?"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Category
                </label>
                <select
                  value={newPlaybook.category}
                  onChange={e => setNewPlaybook({ ...newPlaybook, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                  }}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Bias Focus (comma-separated, optional)
                </label>
                <input
                  value={newPlaybook.biasFocus}
                  onChange={e => setNewPlaybook({ ...newPlaybook, biasFocus: e.target.value })}
                  placeholder="e.g., confirmation_bias, anchoring_bias"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newPlaybook.name.trim() || !newPlaybook.description.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'var(--accent-primary)',
                  color: 'var(--text-on-accent, #fff)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: creating ? 'wait' : 'pointer',
                  opacity: creating || !newPlaybook.name.trim() ? 0.6 : 1,
                }}
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Create Playbook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlaybooksPage() {
  return (
    <ErrorBoundary sectionName="playbooks">
      <PlaybooksPageContent />
    </ErrorBoundary>
  );
}
