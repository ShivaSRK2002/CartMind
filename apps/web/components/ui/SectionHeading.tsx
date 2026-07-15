interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}

export function SectionHeading({ title, subtitle, align = "left" }: SectionHeadingProps) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <h2 className="font-display text-2xl font-medium tracking-tight text-foreground md:text-3xl">
        {title}
      </h2>
      <span className={`accent-line ${align === "center" ? "mx-auto" : ""}`} />
      {subtitle && (
        <p className={`mt-3 text-sm text-text-muted ${align === "center" ? "mx-auto max-w-md" : ""}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
