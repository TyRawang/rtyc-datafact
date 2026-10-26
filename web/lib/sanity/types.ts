import type { PortableTextBlock } from "@portabletext/react";

export type TopicRef = { _id: string; title: string; slug: string; description?: string; count?: number };

export type SourceSummary = {
  _id: string;
  title: string;
  publisher?: string;
  date?: string;
  originalUrl?: string;
  language?: string;
  rightsStatus?: string;
  hostingPolicy?: "full" | "excerpt" | "private";
  fileUrl?: string | null;
  citedByCount?: number;
};

export type SourceDetail = SourceSummary & {
  notes?: string;
  relatedSources?: SourceSummary[];
  citedBy: { question: string; slug: string }[];
};

export type Citation = {
  _key: string;
  _type: "citation";
  source?: SourceSummary | null;
  locator?: string;
  quote?: string;
  quoteLanguage?: string;
  translation?: string;
  supports?: string;
};

export type Correction = {
  _key: string;
  date: string;
  change: string;
  reason?: string;
};

export type Capture = {
  captureDate?: string;
  captureMethod?: string;
  waybackUrl?: string;
  captureFileUrl?: string | null;
  archiveUnavailable?: boolean;
  archiveNote?: string;
};

export type ReviewImage = { url: string; alt?: string; credit?: string };

export type ReviewSummary = {
  _id: string;
  slug: string;
  question: string;
  image?: ReviewImage | null;
  shortAnswer?: string;
  finding?: string;
  claimType?: string;
  topics?: TopicRef[];
  reviewDate?: string;
};

export type ReviewDetail = ReviewSummary & {
  claimText?: string;
  claimLanguage?: string;
  claimTranslation?: string;
  translator?: string;
  speaker?: string;
  publisher?: string;
  statementDate?: string;
  originalUrl?: string;
  capture?: Capture;
  evidence?: PortableTextBlock[];
  limitations?: PortableTextBlock[];
  searchKeywords?: string[];
  reviewer?: string;
  corrections?: Correction[];
  _updatedAt?: string;
};

export type Dataset = {
  _id: string;
  title: string;
  description?: string;
  source?: SourceSummary | null;
  fileUrl?: string | null;
  fileName?: string | null;
  periodStart?: string;
  periodEnd?: string;
  geographicCoverage?: string;
  units?: string;
  methodology?: string;
  limitations?: string;
};

export type SearchDoc = {
  id: string;
  question: string;
  claimText?: string;
  claimTranslation?: string;
  shortAnswer?: string;
  evidenceText?: string;
  finding?: string;
  topics?: string[];
  topicTitles?: string[];
  searchKeywords?: string[];
};

export type PageDoc = { title: string; body?: PortableTextBlock[] };

export type CorrectionEntry = Correction & {
  question: string;
  slug: string;
};
