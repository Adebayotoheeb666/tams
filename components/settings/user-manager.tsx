"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createUser, toggleUserActive } from "@/lib/actions/settings";
import type { User } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function UserManager({ users }: { users: User[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createUser({
        name: String(formData.get("name")),
        email: String(formData.get("email")),
        password: String(formData.get("password")),
        role: String(formData.get("role")),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      (event.target as HTMLFormElement).reset();
      router.refresh();
    });
  }

  function handleToggle(userId: string) {
    setError(null);
    startTransition(async () => {
      const result = await toggleUserActive(userId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add team member</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Temporary password</Label>
                <Input id="password" name="password" type="password" minLength={6} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select id="role" name="role" defaultValue="staff" required>
                  <option value="staff">Staff</option>
                  <option value="accountant">Accountant</option>
                </Select>
              </div>
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={isPending} loading={isPending}>
              {isPending ? "Adding…" : "Add user"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-col gap-3 border-b pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{user.name}</p>
                  <Badge variant="secondary">{user.role}</Badge>
                  {!user.isActive ? (
                    <Badge variant="destructive">Inactive</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              {user.role !== "owner" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  loading={isPending}
                  onClick={() => handleToggle(user.id)}
                >
                  {user.isActive ? "Deactivate" : "Reactivate"}
                </Button>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
