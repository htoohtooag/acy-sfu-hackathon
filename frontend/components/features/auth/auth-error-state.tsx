import { Button } from "@/components/ui/button";

export function AuthErrorState({ message, duplicate = false }: { message: string; duplicate?: boolean }) {
  return (
    <div role="alert" className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      <p>{message}</p>
      {duplicate ? <Button variant="outline" size="sm" onClick={() => { window.location.href = "/login"; }}>Go to Login</Button> : null}
    </div>
  );
}
