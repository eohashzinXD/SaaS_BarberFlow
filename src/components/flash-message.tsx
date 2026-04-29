import { Card, CardContent } from "@/components/ui/card";

type FlashMessageProps = {
  type: "success" | "error";
  message: string;
};

export function FlashMessage({ type, message }: FlashMessageProps) {
  const tone =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-100"
      : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-100";

  return (
    <Card className={tone}>
      <CardContent className="p-4 text-sm font-medium">{message}</CardContent>
    </Card>
  );
}
