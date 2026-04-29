import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed border-primary/[0.2] bg-[linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--secondary)/0.5)_100%)]">
      <CardHeader>
        <div className="section-kicker w-fit">Nexora</div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {action ? <CardContent>{action}</CardContent> : null}
    </Card>
  );
}
