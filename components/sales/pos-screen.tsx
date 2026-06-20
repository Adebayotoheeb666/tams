"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { createSale, getPosProducts, type PosProduct } from "@/lib/actions/sales";
import { enqueue, getAll, remove as removeQueued } from "@/lib/offline/queue";
import type { PaymentMethod } from "@/lib/validations/sales";
import type { SaleReceipt } from "@/lib/sales/receipt";
import { ReceiptModal } from "@/components/sales/receipt-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { businessUnitLabel, cn, formatNaira } from "@/lib/utils";

type CartLine = {
  product: PosProduct;
  quantity: number;
};

export function PosScreen({ products: initialProducts }: { products: PosProduct[] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [discountNaira, setDiscountNaira] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const syncCartWithProducts = useCallback((nextProducts: PosProduct[]) => {
    setCart((current) =>
      current
        .map((line) => {
          const product = nextProducts.find((item) => item.id === line.product.id);
          if (!product || product.quantity === 0) return null;
          return {
            product,
            quantity: Math.min(line.quantity, product.quantity),
          };
        })
        .filter((line): line is CartLine => line !== null),
    );
  }, []);

  const refreshProducts = useCallback(async () => {
    const nextProducts = await getPosProducts();
    setProducts(nextProducts);
    syncCartWithProducts(nextProducts);
    router.refresh();
  }, [router, syncCartWithProducts]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term),
    );
  }, [products, search]);

  const subtotalKobo = cart.reduce(
    (sum, line) => sum + line.product.sellingPrice * line.quantity,
    0,
  );
  const discountKobo = Math.round(discountNaira * 100);
  const totalKobo = Math.max(0, subtotalKobo - discountKobo);

  function addToCart(product: PosProduct) {
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) return current;
        return current.map((line) =>
          line.product.id === product.id
            ? { ...line, product, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((current) =>
      current
        .map((line) => {
          if (line.product.id !== productId) return line;
          const liveProduct =
            products.find((item) => item.id === productId) ?? line.product;
          const next = line.quantity + delta;
          if (next <= 0) return null;
          if (next > liveProduct.quantity) return { ...line, product: liveProduct };
          return { ...line, product: liveProduct, quantity: next };
        })
        .filter(Boolean) as CartLine[],
    );
  }

  function removeFromCart(productId: string) {
    setCart((current) => current.filter((line) => line.product.id !== productId));
  }

  async function resetSale() {
    setCart([]);
    setDiscountNaira(0);
    setPaymentMethod("cash");
    setError(null);
    setReceipt(null);
    setShowReceipt(false);
    await refreshProducts();
  }

  useEffect(() => {
    async function tryFlushPending() {
      try {
        const list: any[] = (await getAll()) as any[];
        for (const row of list) {
          try {
            const res = await createSale(row.item);
            if (res.success) {
              await removeQueued(row.id);
            }
          } catch {}
        }
        await refreshProducts();
      } catch {}
    }

    // register service worker and sync if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(async (reg) => {
        try {
          if ('sync' in reg) await reg.sync.register('tbh-sync');
        } catch {}
      });
    }

    window.addEventListener('online', tryFlushPending);
    void tryFlushPending();
    return () => window.removeEventListener('online', tryFlushPending);
  }, [refreshProducts]);

  function handleConfirmSale() {
    setError(null);

    if (cart.length === 0) {
      setError("Add at least one item to the cart.");
      return;
    }

    if (discountKobo > subtotalKobo) {
      setError("Discount cannot exceed subtotal.");
      return;
    }

    startTransition(async () => {
      const result = await createSale({
        items: cart.map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
        })),
        paymentMethod,
        discountNaira,
      });

      if (!result.success) {
        try {
          await enqueue({ action: 'createSale', payload: { items: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })), paymentMethod, discountNaira } });
          // attempt to register sync
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            if ('sync' in reg) {
              try { await reg.sync.register('tbh-sync'); } catch {}
            }
          }
        } catch {}
        setError(result.error);
        return;
      }

      await refreshProducts();
      setReceipt(result.data.receipt);
      setShowReceipt(true);
      setCart([]);
      setDiscountNaira(0);
    });
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="pl-9"
            />
          </div>

          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                {products.length === 0
                  ? "No products in stock. Add inventory first."
                  : "No products match your search."}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredProducts.map((product) => {
                const inCart = cart.find((line) => line.product.id === product.id);
                const remaining = product.quantity - (inCart?.quantity ?? 0);

                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={remaining <= 0 || isPending}
                    onClick={() => addToCart(product)}
                    className={cn(
                      "rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {remaining} left
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-semibold">
                        {formatNaira(product.sellingPrice)}
                      </span>
                      <Badge variant="outline">
                        {businessUnitLabel(product.businessUnit)}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5" />
              Cart ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tap a product to add it to the cart.
              </p>
            ) : (
              <div className="space-y-3">
                {cart.map((line) => (
                  <div
                    key={line.product.id}
                    className="flex items-start justify-between gap-3 border-b pb-3 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{line.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatNaira(line.product.sellingPrice)} each
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => updateQuantity(line.product.id, -1)}
                          disabled={isPending}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="min-w-[2ch] text-center font-medium">
                          {line.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => updateQuantity(line.product.id, 1)}
                          disabled={
                            isPending ||
                            line.quantity >=
                              (products.find((item) => item.id === line.product.id)
                                ?.quantity ?? line.product.quantity)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive"
                          onClick={() => removeFromCart(line.product.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="font-medium">
                      {formatNaira(line.product.sellingPrice * line.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (₦)</Label>
                <Input
                  id="discount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={discountNaira || ""}
                  onChange={(e) => setDiscountNaira(Number(e.target.value) || 0)}
                  disabled={isPending || cart.length === 0}
                />
              </div>

              <div className="space-y-2">
                <Label>Payment method</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: "cash", label: "Cash" },
                      { value: "transfer", label: "Transfer" },
                      { value: "pos", label: "POS" },
                    ] as const
                  ).map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      size="sm"
                      variant={paymentMethod === option.value ? "default" : "outline"}
                      onClick={() => setPaymentMethod(option.value)}
                      disabled={isPending}
                      className="min-h-[44px]"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatNaira(subtotalKobo)}</span>
                </div>
                {discountKobo > 0 ? (
                  <div className="flex justify-between text-green-700">
                    <span>Discount</span>
                    <span>−{formatNaira(discountKobo)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatNaira(totalKobo)}</span>
                </div>
              </div>

              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}

              <Button
                type="button"
                className="w-full"
                size="lg"
                disabled={isPending || cart.length === 0}
                onClick={handleConfirmSale}
              >
                {isPending ? "Processing…" : "Confirm sale"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ReceiptModal
        receipt={receipt}
        open={showReceipt}
        onClose={() => {
          void resetSale();
        }}
      />
    </>
  );
}
