import { Loader2 } from "lucide-react";

type PageLoaderProps = {
  message?: string;
};

export function PageLoader({ message = "Carregando..." }: PageLoaderProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{message}</span>
      </div>
    </div>
  );
}