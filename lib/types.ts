// Sponsorship Fit Analyzer
export interface SponsorshipCategory {
  category: string;
  fitScore: number;
  rationale: string;
}

export interface BrandSuggestion {
  brandName: string;
  category: string;
  fitReason: string;
  pitchAngle: string;
}

export interface BrandContactResult {
  brandName: string;
  sponsorshipUrl: string | null;
  contactUrl: string | null;
  searchStatus: "found" | "not_found" | "error";
}

export interface SponsorshipAnalysis {
  audienceProfile: {
    ageRange: string;
    primaryInterests: string[];
    likelyGender: string;
    incomeSignal: string;
    engagementStyle: string;
  };
  contentTone: {
    primaryTone: string;
    styleKeywords: string[];
    authenticityScore: number;
    brandSafetyNotes: string;
  };
  topSponsorshipCategories: SponsorshipCategory[];
  specificBrandSuggestions: BrandSuggestion[];
  estimatedCpmRange: { low: number; high: number };
  outreachEmailTemplate?: string;
  brandsToAvoid: string[];
  dealTypeRecommendation: string;
  summaryInsight: string;
}

// Comment Intelligence
export interface TopicCluster {
  topic: string;
  commentCount: number;
  sentiment: "positive" | "negative" | "mixed";
  keyQuotes: string[];
}

export interface VideoIdea {
  title: string;
  evidenceQuotes: string[];
  demandScore: number;
}

export interface Complaint {
  complaint: string;
  frequency: string;
}

export interface CommentAnalysis {
  topicClusters: TopicCluster[];
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  futureVideoIdeas: VideoIdea[];
  topComplaints: Complaint[];
  appreciationHighlights: string[];
  summaryInsight: string;
}

// YouTube API fetch result
export interface YouTubeVideoData {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  captions: string;
  captionsAvailable: boolean;
  comments: string;
  recentVideoTitles: string[];
  viewCount?: string;
  likeCount?: string;
}

// Hook & Title Factory
export type PsychPrinciple =
  | "curiosity_gap"
  | "controversy"
  | "how_to"
  | "listicle"
  | "urgency"
  | "social_proof"
  | "story";

export interface TitleVariation {
  title: string;
  hook: string;
  psychPrinciple: PsychPrinciple;
  score: number;
  whyItWorks: string;
}

export interface TitleAnalysis {
  titles: TitleVariation[];
  topPick: string;
  audienceAngle: string;
}
