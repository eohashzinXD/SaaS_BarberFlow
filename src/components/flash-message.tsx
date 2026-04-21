import { Card, CardContent } from "@/components/ui/card";

type FlashMessageProps = {
  type: "success" | "error";
  message: string;
};

export function FlashMessage({ type, message }: FlashMessageProps) {
  const tone =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-rose-200 bg-rose-50 text-rose-900";

  return (
    <Card className={tone}>
      <CardContent className="p-4 text-sm font-medium">{message}</CardContent>
    </Card>
  );
}
