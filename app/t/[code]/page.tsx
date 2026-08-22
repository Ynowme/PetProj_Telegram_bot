import { Card } from "@heroui/react";
import { auth } from "@/lib/auth";
import { TableLinkPanel } from "@/components/TableLinkPanel";
import { TelegramBotLoginButton } from "@/components/TelegramBotLoginButton";

// Ціль QR-наклейки на столі (генерується в CastaPOS, lib/site-sync.ts там же не бере участі —
// сама наклейка кодує просто ${PETPROJ_PUBLIC_URL}/t/{code}). Залогінений гість одразу бачить
// TableLinkPanel з автопідставленим і автовідправленим кодом; незалогінений — код і кнопку
// входу, після якої NextAuth callbackUrl поверне його сюди ж і привʼязка продовжиться сама.
export default async function TableQrPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const session = await auth();

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      {session?.user?.id ? (
        <TableLinkPanel initialCode={code} />
      ) : (
        <Card>
          <Card.Content className="grid gap-4">
            <div className="grid gap-1">
              <h1 className="text-2xl font-semibold text-foreground">Стіл {code}</h1>
              <p className="text-sm text-muted">Увійдіть, щоб привʼязати цей стіл до свого акаунту.</p>
            </div>
            <TelegramBotLoginButton callbackUrl={`/t/${code}`} />
          </Card.Content>
        </Card>
      )}
    </main>
  );
}
