/**
 * Curated RSS feed configuration for the Web Intelligence layer.
 *
 * Each feed is categorized so the sync service can classify articles and
 * the contextBuilder can query by category at analysis time.
 */

export interface FeedConfig {
  url: string;
  name: string;
  category: FeedCategory;
}

export type FeedCategory =
  | 'psychology'
  | 'business'
  | 'regulatory'
  | 'industry'
  | 'academic'
  | 'corp_dev';

export const NEWS_FEEDS: FeedConfig[] = [
  // ── Psychology & Decision Science ────────────────────────────────
  {
    url: 'https://behavioralscientist.org/feed/',
    name: 'Behavioral Scientist',
    category: 'psychology',
  },
  {
    url: 'https://fs.blog/feed/',
    name: 'Farnam Street',
    category: 'psychology',
  },

  // ── Business Strategy & Governance ───────────────────────────────
  {
    url: 'https://www.mckinsey.com/insights/rss',
    name: 'McKinsey Insights',
    category: 'business',
  },
  {
    url: 'https://sloanreview.mit.edu/feed/',
    name: 'MIT Sloan Management Review',
    category: 'business',
  },
  {
    url: 'https://corpgov.law.harvard.edu/feed/',
    name: 'Harvard Law Corporate Governance',
    category: 'business',
  },

  // ── Regulatory & Compliance ──────────────────────────────────────
  {
    url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=8-K&dateb=&owner=include&count=40&search_text=&action=getcompany&output=atom',
    name: 'SEC EDGAR 8-K Filings',
    category: 'regulatory',
  },
  {
    url: 'https://www.fca.org.uk/news/rss.xml',
    name: 'FCA Announcements',
    category: 'regulatory',
  },

  // ── Industry News ────────────────────────────────────────────────
  {
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    name: 'BBC Business',
    category: 'industry',
  },

  // ── Corp Dev / M&A deal flow ─────────────────────────────────────
  // Feeds for the nightly Outreach Intelligence Brief. fetchFeed()
  // fails soft (logs a warn, returns []) if a feed URL dies, and the
  // brief synthesis also draws on the `business` + SEC `regulatory`
  // feeds above, so a flaky source degrades the brief rather than
  // breaking it. Verify these resolve before assuming zero signal.
  {
    url: 'https://news.crunchbase.com/feed/',
    name: 'Crunchbase News',
    category: 'corp_dev',
  },
  {
    url: 'https://www.pehub.com/feed/',
    name: 'PE Hub',
    category: 'corp_dev',
  },
];

/** How long articles stay in the DB before cron cleanup removes them. */
export const ARTICLE_TTL_HOURS = 48;

/** Maximum concurrent feed fetches to avoid overwhelming sources. */
export const FEED_FETCH_CONCURRENCY = 3;
