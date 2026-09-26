import { useState } from "react"

import { Skeleton } from "@/components/ui/skeleton"

import { qualityCopy } from "../copy"
import { useInView } from "../hooks/use-in-view"
import { useReviewQueue } from "../hooks/use-review-queue"
import { CardError, QualityCard } from "./quality-card"
import { ReviewItem } from "./review-item"

/** Active learning: label the least confident signals of the top leads, one at a time. */
export function ReviewCard({ serviceId }: { serviceId: string | undefined }) {
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  // Building the queue reads up to 20 lead cards, so wait until the card is on screen.
  const inView = useInView(node)
  const queue = useReviewQueue(serviceId, inView)
  const { current } = queue

  return (
    <div ref={setNode}>
      <QualityCard
        emphasis
        title={qualityCopy.reviewTitle}
        meta={
          queue.status === "ready" ? qualityCopy.reviewLeft(queue.left) : null
        }
      >
        {queue.status === "loading" ? (
          <Skeleton className="h-[150px] rounded-md" />
        ) : queue.status === "error" ? (
          <CardError
            title={qualityCopy.reviewError}
            error={queue.error}
            onRetry={queue.retry}
          />
        ) : current ? (
          <ReviewItem
            item={current}
            onVote={(verdict) => void queue.vote(current, verdict)}
            onSkip={() => queue.skip(current)}
          />
        ) : (
          <div className="rounded-md bg-positive-surface p-3.5 text-sm font-semibold text-positive-strong">
            {qualityCopy.reviewDone}
          </div>
        )}
      </QualityCard>
    </div>
  )
}
