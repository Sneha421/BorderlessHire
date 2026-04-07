import { Suspense } from "react";

import { JobsBoard } from "@/components/home/jobs-board";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <JobsBoard />
    </Suspense>
  );
}
