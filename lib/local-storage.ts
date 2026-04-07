import type { JobListing, SponsorshipTier } from "@/lib/jobs";

export const SAVED_JOBS_KEY = "borderlesshire-saved-jobs";
export const SAVED_COMPASS_KEY = "borderlesshire-saved-compass";
export const CACHED_LIVE_JOBS_KEY = "borderlesshire-cached-live-jobs";

export type SavedJob = {
  id: string;
  title: string;
  company: string;
  salaryMin: number;
  salaryMax: number;
  sponsorshipTier: SponsorshipTier;
  savedAt: string;
};

export type SavedCompassResult = {
  id: string;
  occupation: string;
  targetCompany: string;
  monthlySalary: number;
  totalScore: number;
  eligible: boolean;
  savedAt: string;
};

function readJSON<T>(key: string, fallback: T) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readSavedJobs() {
  return readJSON<SavedJob[]>(SAVED_JOBS_KEY, []);
}

export function toggleSavedJob(job: JobListing) {
  const current = readSavedJobs();
  const exists = current.some((entry) => entry.id === job.id);
  const next = exists
    ? current.filter((entry) => entry.id !== job.id)
    : [
        {
          id: job.id,
          title: job.title,
          company: job.company,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          sponsorshipTier: job.sponsorshipTier,
          savedAt: new Date().toISOString()
        },
        ...current
      ].slice(0, 12);

  writeJSON(SAVED_JOBS_KEY, next);
  return next;
}

export function readSavedCompassResults() {
  return readJSON<SavedCompassResult[]>(SAVED_COMPASS_KEY, []);
}

export function saveCompassResult(result: SavedCompassResult) {
  const current = readSavedCompassResults();
  const next = [result, ...current.filter((item) => item.id !== result.id)].slice(0, 10);
  writeJSON(SAVED_COMPASS_KEY, next);
  return next;
}

export function readCachedLiveJobs() {
  return readJSON<JobListing[]>(CACHED_LIVE_JOBS_KEY, []);
}

export function writeCachedLiveJobs(jobs: JobListing[]) {
  writeJSON(CACHED_LIVE_JOBS_KEY, jobs);
}
