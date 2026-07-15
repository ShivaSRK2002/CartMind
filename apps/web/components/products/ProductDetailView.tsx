"use client";

import { useEffect, useState } from "react";
import type { ProductWithImages } from "cartmind-shared-types";
import { trackAddToCart, trackProductViewed } from "@/lib/analytics/track";
import { useCart } from "@/lib/cart/CartContext";
import { buildPlaceholderImage, colorForCategory } from "@/lib/placeholderImage";
import { getProductMeta } from "@/lib/productMeta";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { StarRating } from "@/components/ui/StarRating";
import { PriceTag } from "@/components/ui/PriceTag";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { RecommendedProducts } from "@/components/recommendations/RecommendedProducts";

export function ProductDetailView({ product }: { product: ProductWithImages }) {
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pincode, setPincode] = useState("");
  const [deliveryChecked, setDeliveryChecked] = useState(false);
  const cart = useCart();
  const meta = getProductMeta(product.id, product.price);

  useEffect(() => {
    trackProductViewed({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
    });
  }, [product.id, product.name, product.category, product.price]);

  const images =
    product.images.length > 0
      ? product.images
      : [
          {
            id: "fallback",
            productId: product.id,
            imageUrl:
              product.imageUrl ?? buildPlaceholderImage(product.name, colorForCategory(product.category), 800, 800),
            displayOrder: 0,
            createdAt: "",
          },
        ];

  function handleAddToCart() {
    trackAddToCart({ id: product.id, name: product.name, price: product.price }, quantity);
    cart.addItem(
      { productId: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl },
      quantity,
    );
    setToastMessage(`Added ${quantity} × ${product.name} to bag`);
  }

  function handleBuyNow() {
    handleAddToCart();
    window.location.href = "/cart";
  }

  function checkDelivery() {
    if (pincode.length === 6) {
      setDeliveryChecked(true);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/products" },
          { label: product.category, href: `/products?category=${encodeURIComponent(product.category)}` },
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="flex gap-4">
            {images.length > 1 && (
              <div className="flex flex-col gap-3">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    aria-label={`View image ${index + 1}`}
                    className={`h-20 w-16 overflow-hidden border-2 transition-colors ${
                      index === activeImageIndex ? "border-brand-primary" : "border-border-subtle"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.imageUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1">
              <div className="aspect-square overflow-hidden bg-surface-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[activeImageIndex].imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:col-span-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-subtle">
                {product.category}
              </p>
              <h1 className="mt-2 font-display text-2xl font-medium leading-snug text-foreground lg:text-3xl">
                {product.name}
              </h1>
            </div>
            <WishlistButton productId={product.id} className="shrink-0" />
          </div>

          <StarRating rating={meta.rating} reviewCount={meta.reviewCount} size="md" />
          <PriceTag
            salePrice={meta.salePrice}
            mrp={meta.mrp}
            discountPercent={meta.discountPercent}
            size="lg"
          />

          {meta.isAssured && (
            <span className="inline-flex w-fit items-center gap-2 text-xs uppercase tracking-[0.15em] text-brand-primary">
              <span className="h-px w-4 bg-brand-accent" />
              Verified Seller
            </span>
          )}

          <p className={product.stock > 0 ? "text-sm text-brand-success" : "text-sm text-red-600"}>
            {product.stock > 0 ? `In stock — ${product.stock} available` : "Currently unavailable"}
          </p>

          <p className="text-sm leading-relaxed text-text-muted">{product.description}</p>

          <div className="border-t border-border-subtle pt-5">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-text-muted">Offers</p>
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              <li>10% off with code <strong className="text-foreground">VELORA10</strong></li>
              <li>₹50 off with <strong className="text-foreground">FUNKY50</strong> (orders ₹200+)</li>
              <li>Complimentary delivery on orders above ₹499</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:col-span-3">
          <div className="border border-border-subtle bg-surface p-6 premium-shadow">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-text-muted">
              Your Selection
            </p>
            <div className="mt-3">
              <PriceTag
                salePrice={meta.salePrice * quantity}
                mrp={meta.mrp * quantity}
                discountPercent={meta.discountPercent}
                size="md"
              />
            </div>

            <div className="mt-5 flex items-center gap-3">
              <label htmlFor="quantity" className="text-xs font-medium uppercase tracking-[0.15em] text-text-muted">
                Qty
              </label>
              <select
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="border border-border-warm bg-surface px-4 py-2 text-sm focus:border-brand-primary focus:outline-none"
                disabled={product.stock === 0}
              >
                {Array.from({ length: Math.min(10, product.stock) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button
                type="button"
                variant="cart"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full"
              >
                Add to Bag
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="w-full"
              >
                Buy Now
              </Button>
            </div>
          </div>

          <div className="border border-border-subtle p-6">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-text-muted">Delivery</p>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setDeliveryChecked(false);
                }}
                placeholder="Pincode"
                className="flex-1 border border-border-warm bg-transparent px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={checkDelivery}
                className="border border-brand-primary px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-brand-primary transition-colors hover:bg-brand-primary hover:text-white"
              >
                Check
              </button>
            </div>
            {deliveryChecked && (
              <p className="mt-3 text-sm text-brand-success">
                Estimated delivery by{" "}
                {new Date(Date.now() + meta.deliveryDays * 86400000).toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      <section className="mt-16 border-t border-border-subtle pt-12">
        <SectionHeading title="Customer Reviews" subtitle={`${meta.reviewCount.toLocaleString("en-IN")} verified ratings`} />
        <div className="mt-8 flex items-center gap-6">
          <span className="font-display text-5xl font-medium text-foreground">{meta.rating}</span>
          <StarRating rating={meta.rating} size="md" />
        </div>
        <div className="mt-8 divide-y divide-border-subtle">
          {["Exceptional quality and swift delivery.", "Truly value for money — would recommend.", "Exactly as described, beautifully packaged."].map(
            (review, i) => (
              <div key={i} className="py-6">
                <StarRating rating={4 + (i % 2)} size="sm" />
                <p className="mt-2 text-sm leading-relaxed text-foreground">{review}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.12em] text-text-subtle">Verified Purchase</p>
              </div>
            ),
          )}
        </div>
      </section>

      <div className="mt-8">
        <RecommendedProducts
          title="You May Also Like"
          subtitle="Frequently bought together & similar picks"
          limit={6}
          excludeProductId={product.id}
        />
      </div>

      {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}
    </main>
  );
}
