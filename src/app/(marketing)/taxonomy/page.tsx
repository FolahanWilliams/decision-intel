import type { Metadata } from 'next';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { TaxonomyClient } from './TaxonomyClient';
import { BIAS_EDUCATION } from '@/lib/constants/bias-education';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.decision-intel.com';
const BIAS_COUNT = Object.keys(BIAS_EDUCATION).length;

export const metadata: Metadata = {
  title: 'Cognitive Bias Taxonomy · Decision Intel',
  description: `Cognitive biases with stable, permanent IDs (DI-B-001 through DI-B-0${String(BIAS_COUNT).padStart(2, '0')}, growing as the Kahneman-Klein paper-application sprint lands new detectors). Each bias includes a named historical failure, debiasing techniques, and a primary academic citation. Cite these IDs in research, audits, and regulatory filings.`,
  alternates: { canonical: `${siteUrl}/taxonomy` },
  openGraph: {
    title: 'Cognitive Bias Taxonomy · Decision Intel',
    description: `${BIAS_COUNT} biases, ${BIAS_COUNT} research anchors. Stable IDs, named failures, academic citations — the full Decision Intel taxonomy.`,
    url: `${siteUrl}/taxonomy`,
  },
};

// ─── DefinedTermSet JSON-LD (AEO discipline, locked 2026-05-23) ──────────
//
// AI answer engines (ChatGPT, Perplexity, Gemini, Claude) ground citations
// against schema.org DefinedTerm shapes when answering "what is bias X" or
// "list the cognitive biases tracked by Y." Surfacing the full canonical
// taxonomy here as a DefinedTermSet — every bias as a DefinedTerm with
// stable termCode, full description, primary academic citation, and a
// deep-link to the on-page detail card — means an LLM client gets every
// bias in a single structured fetch instead of having to scrape the page.
//
// Each DefinedTerm carries:
//   - @id : stable URL fragment (e.g., #di-b-001) usable as a citation anchor
//   - name : the human-readable bias name
//   - termCode : the stable Decision Intel taxonomy ID
//   - description : the quick-tip (single-sentence summary; full description
//                   lives on the page itself + via the deep-link)
//   - inDefinedTermSet : back-reference to the canonical set @id
//   - subjectOf : ScholarlyArticle referencing the academic anchor
//
// When DI-B-023 (or beyond) lands per the bias-cascade discipline, the new
// entry flows into this DefinedTermSet automatically via the BIAS_EDUCATION
// import — no separate edit required here.
const taxonomyJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'DefinedTermSet',
  '@id': `${siteUrl}/taxonomy#canonical-bias-taxonomy`,
  name: `Decision Intel · ${BIAS_COUNT}-Bias Canonical Taxonomy`,
  description: `The canonical Decision Intel taxonomy of ${BIAS_COUNT} cognitive biases, with stable identifiers DI-B-001 through DI-B-0${String(BIAS_COUNT).padStart(2, '0')}. Each entry is anchored to a primary academic citation with DOI where available.`,
  url: `${siteUrl}/taxonomy`,
  hasDefinedTerm: Object.entries(BIAS_EDUCATION).map(([key, bias]) => {
    const ref = bias.academicReference;
    const refUrl = ref.doi ? `https://doi.org/${ref.doi}` : ref.url;
    return {
      '@type': 'DefinedTerm',
      '@id': `${siteUrl}/taxonomy#${bias.taxonomyId.toLowerCase()}`,
      name: key
        .split('_')
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' '),
      termCode: bias.taxonomyId,
      description: bias.quickTip,
      inDefinedTermSet: `${siteUrl}/taxonomy#canonical-bias-taxonomy`,
      url: `${siteUrl}/taxonomy#${bias.taxonomyId.toLowerCase()}`,
      ...(refUrl
        ? {
            subjectOf: {
              '@type': 'ScholarlyArticle',
              name: ref.title,
              author: ref.authors,
              datePublished: ref.year,
              isPartOf: { '@type': 'Periodical', name: ref.venue },
              url: refUrl,
              ...(ref.doi ? { sameAs: `https://doi.org/${ref.doi}` } : {}),
            },
          }
        : {}),
    };
  }),
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
    { '@type': 'ListItem', position: 2, name: 'Bias Taxonomy', item: `${siteUrl}/taxonomy` },
  ],
};

export default function TaxonomyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(taxonomyJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <MarketingNav />
      <TaxonomyClient />
    </div>
  );
}
