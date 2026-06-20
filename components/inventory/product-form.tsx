"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createProduct, updateProduct } from "@/lib/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Category, Product } from "@/lib/db/schema";
import { koboToNaira } from "@/lib/utils";

type ProductFormProps = {
  categories: Category[];
  product?: Product;
  mode: "create" | "edit";
};

export function ProductForm({ categories, product, mode }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [businessUnit, setBusinessUnit] = useState(
    product?.businessUnit ?? "thrift",
  );

  const unitCategories = categories.filter(
    (c) => c.businessUnit === businessUnit,
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const businessUnit = String(formData.get("businessUnit"));

    // handle image upload if a file was provided
    let imageUrl = product?.imageUrl ?? "";
    const file = formData.get("image") as File | null;
    if (file && file.size > 0) {
      try {
        const uploadFd = new FormData();
        uploadFd.append("file", file);
        const res = await fetch("/api/uploads", {
          method: "POST",
          body: uploadFd,
        });
        if (!res.ok) {
          const text = await res.text();
          setError(text || "Image upload failed");
          return;
        }
        const json = await res.json();
        imageUrl = json.url;
      } catch (e: any) {
        setError(e?.message ?? "Image upload failed");
        return;
      }
    }

    const payload = {
      name: String(formData.get("name")),
      sku: String(formData.get("sku")),
      categoryId: String(formData.get("categoryId") || "") || null,
      businessUnit,
      description: String(formData.get("description") || ""),
      costPriceNaira: Number(formData.get("costPriceNaira")),
      sellingPriceNaira: Number(formData.get("sellingPriceNaira")),
      reorderLevel: Number(formData.get("reorderLevel")),
      imageUrl: imageUrl || "",
      ...(mode === "create"
        ? { quantity: Number(formData.get("quantity") ?? 0) }
        : { id: product!.id }),
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createProduct(payload)
          : await updateProduct(payload);

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(`/inventory/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Product name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={product?.name}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" defaultValue={product?.sku} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessUnit">Business unit</Label>
          <Select
            id="businessUnit"
            name="businessUnit"
            value={businessUnit}
            onChange={(e) =>
              setBusinessUnit(e.target.value as "thrift" | "nails")
            }
            required
          >
            <option value="thrift">Tams Thrift</option>
            <option value="nails">Glitz Nails</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>
          <Select
            id="categoryId"
            name="categoryId"
            defaultValue={product?.categoryId ?? ""}
          >
            <option value="">No category</option>
            {unitCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        {mode === "create" ? (
          <div className="space-y-2">
            <Label htmlFor="quantity">Opening stock</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min={0}
              step={1}
              defaultValue={0}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="costPriceNaira">Cost price (₦)</Label>
          <Input
            id="costPriceNaira"
            name="costPriceNaira"
            type="number"
            min={0}
            step="0.01"
            defaultValue={product ? koboToNaira(product.costPrice) : ""}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sellingPriceNaira">Selling price (₦)</Label>
          <Input
            id="sellingPriceNaira"
            name="sellingPriceNaira"
            type="number"
            min={0}
            step="0.01"
            defaultValue={product ? koboToNaira(product.sellingPrice) : ""}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reorderLevel">Reorder level</Label>
          <Input
            id="reorderLevel"
            name="reorderLevel"
            type="number"
            min={0}
            step={1}
            defaultValue={product?.reorderLevel ?? 3}
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="image">Image (optional)</Label>
          <Input id="image" name="image" type="file" accept="image/*" />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={product?.description ?? ""}
          />
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving…"
            : mode === "create"
              ? "Create product"
              : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
