export type AuditStatus = "queued" | "crawling" | "analyzing" | "complete" | "failed";

export type Lead = {
  url: string;
  name: string;
  email: string;
  company?: string;
};

export type RedirectHop = { url: string; status: number };

export type LinkResult = {
  url: string;
  sourceUrls: string[];
  kind: "internal" | "external";
  status: number | null;
  finalUrl: string;
  redirects: RedirectHop[];
  error?: string;
};

export type PageData = {
  url: string;
  status: number;
  contentType: string;
  title: string;
  description: string;
  h1: string[];
  h2: string[];
  canonical: string | null;
  noindex: boolean;
  text: string;
  wordCount: number;
  links: Array<{ url: string; text: string; kind: "internal" | "external" }>;
  schemaTypes: string[];
  signals: {
    emails: string[];
    phones: string[];
    hasAddress: boolean;
    hasAboutLanguage: boolean;
    hasServiceLanguage: boolean;
    hasLocationLanguage: boolean;
    hasQuestions: boolean;
    trustTerms: string[];
    hasForm?: boolean;
    hasPrimaryCta?: boolean;
  };
};

export type CrawlData = {
  requestedUrl: string;
  finalRootUrl: string;
  startedAt: string;
  finishedAt: string;
  robots: {
    url: string;
    found: boolean;
    oaiSearchBotAllowed: boolean;
    googlebotAllowed: boolean;
    content: string;
  };
  sitemap: { url: string; found: boolean; urlsFound: number };
  pages: PageData[];
  links: LinkResult[];
  limitReached: boolean;
  errors: string[];
};

export type Check = {
  id: string;
  label: string;
  status: "pass" | "warning" | "fail" | "info";
  detail: string;
  evidence?: string[];
};

export type CategoryKey =
  | "businessClarity"
  | "serviceClarity"
  | "locationClarity"
  | "answerReadiness"
  | "trustAuthority"
  | "technicalAccessibility"
  | "structuredData";

export type CategoryResult = {
  key: CategoryKey;
  label: string;
  score: number;
  objectiveScore: number;
  source: "objective" | "ai" | "fallback";
  summary: string;
  evidence: string[];
  checks: Check[];
};

export type Recommendation = {
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
  category: string;
  source: "objective" | "ai";
};

export type AnalysisResult = {
  overallScore: number;
  categories: CategoryResult[];
  recommendations: Recommendation[];
  brokenLinks: LinkResult[];
  redirects: LinkResult[];
  reviewLinks?: LinkResult[];
  ai: { enabled: boolean; model?: string; note: string };
  summary: {
    pagesCrawled: number;
    linksChecked: number;
    internalLinks: number;
    externalLinks: number;
    brokenLinks: number;
    redirects: number;
    needsReview?: number;
  };
};

export type AuditRecord = {
  id: string;
  status: AuditStatus;
  progress: number;
  progressMessage: string;
  lead: Lead;
  createdAt: string;
  updatedAt: string;
  crawl?: CrawlData;
  analysis?: AnalysisResult;
  error?: string;
  sharedAt?: string;
};

// Browser-facing reports intentionally omit the submitter’s personal details.
export type PublicAuditRecord = Omit<AuditRecord, 'lead'> & {
  lead: Pick<Lead, 'company' | 'url'>;
};
