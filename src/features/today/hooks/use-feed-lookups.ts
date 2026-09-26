import { useMemo } from "react"

import { useListUsers } from "@/api/generated/auth/auth"
import { useListServices } from "@/api/generated/config/config"
import type { RunOut, UserOut } from "@/api/generated/model"

import type { FeedEntry } from "../lib/feed"
import { useRecentRuns } from "./use-recent-runs"

export type FeedLookups = {
  runs: ReadonlyMap<string, RunOut>
  serviceName: (serviceId: string) => string | undefined
  activeServiceCount: number
  actorName: (userId: string) => string
}

/** Names the events do not carry: services, run kinds and feedback authors. */
export function useFeedLookups(me: UserOut, feed: FeedEntry[]): FeedLookups {
  const services = useListServices({ query: { staleTime: 5 * 60_000 } })
  const runs = useRecentRuns()
  // Only admins may list users; everyone else sees "A teammate" for other people's votes.
  const needsUsers =
    me.role === "admin" &&
    feed.some(
      (entry) =>
        entry.type === "feedback" && entry.event.payload.user_id !== me.id
    )
  const users = useListUsers({
    query: { enabled: needsUsers, staleTime: 5 * 60_000 },
  })

  return useMemo(() => {
    const serviceNames = new Map(
      (services.data ?? []).map((service) => [service.id, service.name])
    )
    const userNames = new Map(
      (users.data ?? []).map((user) => [user.id, user.full_name || user.email])
    )
    return {
      runs: new Map((runs.data ?? []).map((run) => [run.id, run])),
      serviceName: (serviceId) => serviceNames.get(serviceId),
      activeServiceCount: (services.data ?? []).filter(
        (service) => service.is_active
      ).length,
      actorName: (userId) =>
        userId === me.id ? "You" : (userNames.get(userId) ?? "A teammate"),
    }
  }, [me.id, runs.data, services.data, users.data])
}
