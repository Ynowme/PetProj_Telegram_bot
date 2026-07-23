import { prisma } from "@/lib/prisma";

const DEFAULT_PERCENTAGE = 3;

export async function getBonusPercentage(): Promise<number> {
  const settings = await prisma.bonusSettings.findUnique({ where: { id: "default" } });
  return settings ? Number(settings.percentage) : DEFAULT_PERCENTAGE;
}

export async function setBonusPercentage(percentage: number): Promise<number> {
  const updated = await prisma.bonusSettings.upsert({
    where: { id: "default" },
    update: { percentage },
    create: { id: "default", percentage },
  });
  return Number(updated.percentage);
}
