import { formatPrice } from "@/lib/productMeta";

interface PriceTagProps {
  salePrice: number;
  mrp: number;
  discountPercent: number;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: { sale: "text-sm font-medium", mrp: "text-xs", discount: "text-xs" },
  md: { sale: "text-xl font-medium", mrp: "text-sm", discount: "text-sm" },
  lg: { sale: "text-3xl font-medium font-display", mrp: "text-base", discount: "text-sm" },
};

export function PriceTag({ salePrice, mrp, discountPercent, size = "sm" }: PriceTagProps) {
  const classes = SIZE_CLASSES[size];

  return (
    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
      <span className={`${classes.sale} text-foreground`}>{formatPrice(salePrice)}</span>
      {discountPercent > 0 && (
        <>
          <span className={`${classes.mrp} text-text-subtle line-through`}>
            {formatPrice(mrp)}
          </span>
          <span className={`${classes.discount} font-medium text-brand-success`}>
            {discountPercent}% off
          </span>
        </>
      )}
    </div>
  );
}
