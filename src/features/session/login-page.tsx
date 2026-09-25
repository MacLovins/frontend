import { useState } from "react"
import { Navigate } from "react-router"

import { Button } from "@/features/components/ui/button"
import { Input } from "@/features/components/ui/input"
import { useLogin, useSession } from "@/features/session/session"
import { labels } from "@/lib/labels"

export function LoginPage() {
  const { me } = useSession()
  const login = useLogin()
  const [email, setEmail] = useState("admin@leadradar.dev")
  const [password, setPassword] = useState("password1")
  const [error, setError] = useState<string | null>(null)

  if (me) {
    return <Navigate to="/prospects" replace />
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <form
        className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border bg-card p-6"
        onSubmit={(event) => {
          event.preventDefault()
          setError(null)
          login.mutate(
            { email, password },
            { onError: () => setError("Wrong email or password.") },
          )
        }}
      >
        <div>
          <h1 className="font-heading text-2xl font-medium">{labels.signIn}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Demo: admin@leadradar.dev or sales@leadradar.dev
          </p>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Email
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Password
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <Button type="submit" size="lg" disabled={login.isPending}>
          {login.isPending ? labels.loading : labels.signIn}
        </Button>
      </form>
    </main>
  )
}

export function ForbiddenPage() {
  return (
    <main className="p-6">
      <h1 className="font-heading text-2xl font-medium">403</h1>
      <p className="mt-2 text-sm text-muted-foreground">{labels.forbidden}</p>
    </main>
  )
}
