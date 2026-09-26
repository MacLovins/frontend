import { useId } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { FormProvider, useForm } from "react-hook-form"
import { Link } from "react-router"
import { toast } from "sonner"

import { apiPaths, invalidateApi } from "@/api/cache"
import { getGetIcpQueryKey, usePutIcp } from "@/api/generated/config/config"
import type { ICPProfileOut } from "@/api/generated/model"
import { errorMessage, fieldErrors } from "@/api/mutator"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { DiscardDialog } from "@/features/settings/icp/components/discard-dialog"
import { MustHaveCard } from "@/features/settings/icp/components/must-have-card"
import { NiceToHaveCard } from "@/features/settings/icp/components/nice-to-have-card"
import { PreviewPanel } from "@/features/settings/icp/components/preview-panel"
import { copy } from "@/features/settings/icp/copy"
import {
  useCountryCatalog,
  useIndustryCatalog,
} from "@/features/settings/icp/hooks/use-catalogs"
import { useDiscardGuard } from "@/features/settings/icp/hooks/use-discard-guard"
import {
  formFields,
  icpSchema,
  toFormValues,
  toPayload,
  type IcpFormValues,
} from "@/features/settings/icp/lib/icp-form"
import { withService } from "@/hooks/use-current-service"

/** The loaded ICP form. Keyed by version by the page, so a save starts again from the stored profile. */
export function IcpEditor({
  serviceId,
  serviceName,
  profile,
}: {
  serviceId: string
  serviceName: string
  profile: ICPProfileOut | null
}) {
  const formId = useId()
  const queryClient = useQueryClient()
  const countries = useCountryCatalog()
  const industries = useIndustryCatalog()
  const form = useForm<IcpFormValues>({
    resolver: zodResolver(icpSchema),
    defaultValues: toFormValues(profile),
  })
  const { isDirty } = form.formState
  const { blocker } = useDiscardGuard(isDirty)
  const save = usePutIcp({ mutation: { meta: { errorToast: false } } })

  const onSubmit = form.handleSubmit((values) =>
    save.mutate(
      { id: serviceId, data: toPayload(values) },
      {
        onSuccess: (saved) => {
          toast.success(copy.saved(saved.version))
          // PUT re-scores the service in the same request (config/router.py put_icp).
          void invalidateApi(queryClient, apiPaths.leads, apiPaths.activity)
          queryClient.setQueryData(getGetIcpQueryKey(serviceId), saved)
        },
        onError: (error) => {
          const errors = fieldErrors(error)
          const mapped = formFields.filter((name) => errors[name])
          mapped.forEach((name) =>
            form.setError(name, { message: errors[name] })
          )
          if (!mapped.length) toast.error(errorMessage(error))
        },
      }
    )
  )

  return (
    <FormProvider {...form}>
      <PageHeader
        title={copy.title}
        subtitle={copy.subtitle(serviceName, profile?.version ?? null)}
        actions={
          <>
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <Link to={withService("/accounts/discover", serviceId)} />
              }
            >
              {copy.findSimilar}
            </Button>
            <Button
              type="submit"
              form={formId}
              disabled={!isDirty || save.isPending}
            >
              {save.isPending ? (
                <>
                  <Spinner aria-hidden />
                  {copy.saving}
                </>
              ) : (
                copy.save
              )}
            </Button>
          </>
        }
      />
      <div className="flex items-start gap-5 px-8 py-6">
        <form
          id={formId}
          noValidate
          onSubmit={onSubmit}
          aria-label={copy.title}
          className="flex w-[720px] min-w-0 shrink flex-col gap-5"
        >
          <fieldset disabled={save.isPending} className="contents">
            <MustHaveCard countries={countries} industries={industries} />
            <NiceToHaveCard countries={countries} industries={industries} />
          </fieldset>
        </form>
        <aside className="flex min-w-[300px] flex-1 flex-col gap-4">
          <PreviewPanel serviceId={serviceId} />
        </aside>
      </div>
      <DiscardDialog
        blocker={blocker}
        title={copy.discard.title}
        body={copy.discard.body}
        keepLabel={copy.discard.keep}
        discardLabel={copy.discard.discard}
      />
    </FormProvider>
  )
}
