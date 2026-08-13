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
    <main className="page page--narrow">
      {session?.user?.id ? (
        <TableLinkPanel initialCode={code} />
      ) : (
        <div className="panel">
          <h1 style={{ marginTop: 0 }}>Стіл {code}</h1>
          <p className="text-muted">Увійдіть, щоб привʼязати цей стіл до свого акаунту.</p>
          <div style={{ marginTop: "1rem" }}>
            <TelegramBotLoginButton callbackUrl={`/t/${code}`} />
          </div>
        </div>
      )}
    </main>
  );
}
