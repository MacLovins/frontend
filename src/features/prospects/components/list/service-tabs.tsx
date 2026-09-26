import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useCurrentService,
  useSelectService,
} from "@/hooks/use-current-service"
import { prospectsCopy } from "@/features/prospects/copy"

const MAX_TABS = 3

/** One segment per active service next to the H1; the same state as the sidebar switcher (`?service=`). */
export function ServiceTabs() {
  const { serviceId, services, isLoading } = useCurrentService()
  const selectService = useSelectService()

  if (isLoading) return <Skeleton className="h-10 w-72 rounded-md" />
  if (!services.length || !serviceId) return null

  if (services.length > MAX_TABS) {
    return (
      <Select
        value={serviceId}
        items={services.map((service) => ({
          value: service.id,
          label: service.name,
        }))}
        onValueChange={(value) => {
          if (typeof value === "string") selectService(value)
        }}
      >
        <SelectTrigger
          aria-label={prospectsCopy.serviceTabsLabel}
          className="min-w-56"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {services.map((service) => (
            <SelectItem key={service.id} value={service.id}>
              {service.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Tabs
      value={serviceId}
      onValueChange={(value) => selectService(String(value))}
    >
      <TabsList aria-label={prospectsCopy.serviceTabsLabel}>
        {services.map((service) => (
          <TabsTrigger key={service.id} value={service.id}>
            {service.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
