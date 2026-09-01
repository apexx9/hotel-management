interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {description && <p className="text-muted-foreground">{description}</p>}
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        Content coming soon.
      </div>
    </div>
  );
}
