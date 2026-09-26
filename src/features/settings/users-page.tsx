import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

import { api } from "@/api/client"
import { ApiError } from "@/api/http"
import type { UserCreate } from "@/api/http"
import { Button } from "@/features/components/ui/button"
import { Input } from "@/features/components/ui/input"
import { labels } from "@/lib/labels"

export function UsersPage() {
  const queryClient = useQueryClient()
  const users = useQuery({ queryKey: ["users"], queryFn: () => api.users() })
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<UserCreate["role"]>("sales")
  const create = useMutation({
    mutationFn: () =>
      api.createUser({
        email: email.trim(),
        password,
        full_name: fullName.trim() || null,
        role,
      }),
    onSuccess: () => {
      toast.success("User created")
      setEmail("")
      setPassword("")
      setFullName("")
      setRole("sales")
      void queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (error) => {
      toast.error(error instanceof ApiError || error instanceof Error ? error.message : "Could not create this user")
    },
  })

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-medium">{labels.users}</h1>
      <form
        className="grid gap-2 sm:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault()
          create.mutate()
        }}
      >
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          placeholder="Full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
        />
        <select
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          value={role}
          onChange={(event) => setRole(event.target.value as UserCreate["role"])}
        >
          <option value="sales">Sales</option>
          <option value="admin">Admin</option>
        </select>
        <Button type="submit" disabled={create.isPending}>
          {labels.add}
        </Button>
      </form>
      {users.isLoading ? <p className="text-sm text-muted-foreground">{labels.loading}</p> : null}
      {users.isError ? (
        <Button className="self-start" variant="outline" onClick={() => void users.refetch()}>
          {labels.retry}
        </Button>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {(users.data ?? []).map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="px-3 py-2 font-medium">{user.email}</td>
                <td className="px-3 py-2">{user.full_name || "—"}</td>
                <td className="px-3 py-2">{user.role === "admin" ? "Admin" : "Sales"}</td>
                <td className="px-3 py-2">{user.is_active ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
