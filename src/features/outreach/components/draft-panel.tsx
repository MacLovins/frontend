import type { OutreachChannel, SignalItem } from "@/api/generated/model"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DraftEditor } from "@/features/outreach/components/draft-editor"
import { DraftFooter } from "@/features/outreach/components/draft-footer"
import {
  DraftFailed,
  DraftWriting,
} from "@/features/outreach/components/draft-states"
import { channelLabels, channels } from "@/features/outreach/copy"
import type { OutreachDrafts } from "@/features/outreach/hooks/use-outreach-drafts"
import {
  clipboardText,
  lengthMeta,
  parseChannel,
} from "@/features/outreach/lib/draft"

export function DraftPanel({
  channel,
  onChannelChange,
  drafts,
  signalCount,
  signalsById,
  serviceName,
}: {
  channel: OutreachChannel
  onChannelChange: (channel: OutreachChannel) => void
  drafts: OutreachDrafts
  signalCount: number
  signalsById: Map<string, SignalItem>
  serviceName: string
}) {
  const { state, regenerate, edit, setEdit, resetEdit } = drafts
  const draft = state.kind === "ready" ? state.draft : null
  const subject = edit?.subject ?? draft?.subject ?? ""
  const body = edit?.body ?? draft?.body ?? ""
  const showSubject = channel !== "call_script" && Boolean(draft?.subject)
  const edited = Boolean(
    draft &&
    edit &&
    (edit.body !== draft.body || edit.subject !== (draft.subject ?? ""))
  )

  return (
    <Tabs
      value={channel}
      onValueChange={(value) =>
        onChannelChange(parseChannel(typeof value === "string" ? value : null))
      }
      className="min-w-0 flex-1 gap-0 rounded-lg border border-border bg-card"
    >
      <div className="flex gap-1 border-b border-border px-4">
        <TabsList variant="line" aria-label="Channel">
          {channels.map((item) => (
            <TabsTrigger key={item} value={item} className="h-12 px-3.5">
              {channelLabels[item]}
            </TabsTrigger>
          ))}
        </TabsList>
        {draft ? (
          <span className="ml-auto self-center text-xs text-muted-foreground">
            {lengthMeta(channel, body)}
          </span>
        ) : null}
      </div>
      <TabsContent value={channel} className="flex flex-col">
        {state.kind === "writing" ? (
          <DraftWriting signalCount={signalCount} createdAt={state.createdAt} />
        ) : state.kind === "failed" ? (
          <DraftFailed onRetry={regenerate} />
        ) : (
          <DraftEditor
            subject={subject}
            body={body}
            showSubject={showSubject}
            onChange={setEdit}
            edited={edited}
            onReset={resetEdit}
            referenced={state.draft.referenced_signals}
            signalsById={signalsById}
            serviceName={serviceName}
          />
        )}
        {state.kind === "ready" && state.stale ? (
          <p className="m-0 px-6 pt-3 text-xs text-muted-foreground">
            Style or signature changed · Regenerate to apply
          </p>
        ) : null}
        <DraftFooter
          busy={state.kind === "writing"}
          stale={state.kind === "ready" && state.stale}
          confirmDiscard={edited}
          onRegenerate={regenerate}
          copyText={
            draft ? clipboardText(showSubject ? subject : null, body) : null
          }
        />
      </TabsContent>
    </Tabs>
  )
}
