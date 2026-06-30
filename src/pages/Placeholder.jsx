import { Sparkles, Bell } from "@/lib/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Placeholder({ title }) {
  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">{title}</h1>

      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="bg-joy grid h-16 w-16 place-items-center rounded-2xl text-3xl shadow-pop">
            ✨
          </div>
          <div>
            <p className="font-display text-lg font-semibold">{title} is on the way!</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              We&apos;re putting the finishing touches on this screen. It will be available
              here very soon — thanks for your patience. 🙌
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" disabled>
            <Bell className="h-4 w-4" /> We&apos;ll notify you
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
