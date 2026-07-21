"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCategory } from "@/lib/actions/inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Category } from "@/lib/db/schema";
import { businessUnitLabel } from "@/lib/utils";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const thriftCategories = categories.filter((c) => c.businessUnit === "thrift");
  const nailsCategories = categories.filter((c) => c.businessUnit === "nails");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createCategory({
        name: String(formData.get("name")),
        businessUnit: String(formData.get("businessUnit")),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      (event.target as HTMLFormElement).reset();
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
        <h3 className="font-medium">Add category</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Category name</Label>
            <Input id="name" name="name" required placeholder="e.g. Crop Tops" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessUnit">Business unit</Label>
            <Select id="businessUnit" name="businessUnit" defaultValue="thrift" required>
              <option value="thrift">Tams Thrift</option>
              <option value="nails">Glitz Nails</option>
            </Select>
          </div>
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={isPending} loading={isPending}>
          {isPending ? "Adding…" : "Add category"}
        </Button>
      </form>

      <CategoryGroup
        title={businessUnitLabel("thrift")}
        categories={thriftCategories}
      />
      <CategoryGroup
        title={businessUnitLabel("nails")}
        categories={nailsCategories}
      />
    </div>
  );
}

function CategoryGroup({
  title,
  categories,
}: {
  title: string;
  categories: Category[];
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium">{title}</h3>
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">No categories yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge key={category.id} variant="secondary" className="text-sm">
              {category.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
