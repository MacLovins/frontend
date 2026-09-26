import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CheckIcon,
  InfoIcon,
  SpinnerIcon,
  WarningIcon,
  XIcon,
} from "@phosphor-icons/react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-center"
      className="toaster group"
      icons={{
        success: <CheckIcon weight="bold" className="size-4 text-live" />,
        info: <InfoIcon weight="bold" className="size-4 text-white" />,
        warning: <WarningIcon weight="bold" className="size-4 text-warning" />,
        error: <WarningIcon weight="bold" className="size-4 text-[#ff8a65]" />,
        loading: <SpinnerIcon className="size-4 animate-spin text-white" />,
        close: <XIcon className="size-3.5" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          // Sonner positions toasts absolutely inside its fixed-width list;
          // inset-x-0 + mx-auto + w-fit keeps each toast centred at its own width.
          toast:
            "cn-toast inset-x-0 mx-auto flex w-fit max-w-full items-center gap-2.5 rounded-md border-0 bg-black px-4 py-2.5 text-sm text-white shadow-dialog",
          content: "flex min-w-0 flex-col gap-0.5",
          title: "leading-[1.4] font-normal",
          description: "text-[13px] leading-[1.4] text-[#cccccc]",
          icon: "flex size-4 shrink-0 items-center justify-center",
          actionButton:
            "ml-1.5 inline-flex h-7 shrink-0 items-center rounded-sm bg-primary px-2.5 text-[13px] font-semibold text-black hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
          cancelButton:
            "inline-flex h-7 shrink-0 items-center rounded-sm px-2.5 text-[13px] text-[#cccccc] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
          closeButton:
            "order-last -mr-1.5 ml-1 inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-[#cccccc] hover:text-white focus-visible:outline-2 focus-visible:outline-white",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
