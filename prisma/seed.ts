import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function placeholder(label: string): string {
  return `https://placehold.co/400x400/1a1a1a/e0b13a.jpg?text=${encodeURIComponent(label)}`;
}

type ItemSeed = {
  name: string;
  description: string;
  price: number;
  volume: string;
  abv?: number;
};

async function main() {
  const alcohol = await prisma.menuCategory.upsert({
    where: { slug: "alcohol" },
    update: { name: "Алкогольні напої", order: 1, parentId: null },
    create: { name: "Алкогольні напої", slug: "alcohol", order: 1 },
  });
  const cocktails = await prisma.menuCategory.upsert({
    where: { slug: "cocktails" },
    update: { name: "Коктейлі", order: 1, parentId: alcohol.id },
    create: { name: "Коктейлі", slug: "cocktails", order: 1, parentId: alcohol.id },
  });
  const shots = await prisma.menuCategory.upsert({
    where: { slug: "shots" },
    update: { name: "Шоти", order: 2, parentId: alcohol.id },
    create: { name: "Шоти", slug: "shots", order: 2, parentId: alcohol.id },
  });
  const beer = await prisma.menuCategory.upsert({
    where: { slug: "beer" },
    update: { name: "Пиво", order: 3, parentId: alcohol.id },
    create: { name: "Пиво", slug: "beer", order: 3, parentId: alcohol.id },
  });
  const nonAlcohol = await prisma.menuCategory.upsert({
    where: { slug: "non-alcohol" },
    update: { name: "Безалкогольні напої", order: 2, parentId: null },
    create: { name: "Безалкогольні напої", slug: "non-alcohol", order: 2 },
  });
  const lemonades = await prisma.menuCategory.upsert({
    where: { slug: "lemonades" },
    update: { name: "Лимонади", order: 1, parentId: nonAlcohol.id },
    create: { name: "Лимонади", slug: "lemonades", order: 1, parentId: nonAlcohol.id },
  });
  const hotDrinks = await prisma.menuCategory.upsert({
    where: { slug: "hot-drinks" },
    update: { name: "Гарячі напої", order: 2, parentId: nonAlcohol.id },
    create: { name: "Гарячі напої", slug: "hot-drinks", order: 2, parentId: nonAlcohol.id },
  });

  const legacySlugs = ["appetizers", "spirits"];
  const legacyCategories = await prisma.menuCategory.findMany({
    where: { slug: { in: legacySlugs } },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.menuItem.deleteMany({ where: { categoryId: { in: legacyCategories.map(({ id }) => id) } } }),
    prisma.menuCategory.deleteMany({ where: { slug: { in: legacySlugs } } }),
  ]);
  await prisma.menuCategory.deleteMany({ where: { slug: "food" } });

  const menuItems: Array<[string, ItemSeed[]]> = [
    [
      cocktails.id,
      [
        { name: "Апероль Шприц", description: "Апероль, просеко, содова та апельсин.", price: 260, volume: "300 мл", abv: 11 },
        { name: "Негроні", description: "Джин, кампарі та червоний вермут.", price: 220, volume: "90 мл", abv: 24 },
        { name: "Олд Фешн", description: "Бурбон, цукровий сироп та ангостура.", price: 230, volume: "90 мл", abv: 32 },
        { name: "Віскі Сауер", description: "Віскі, лимонний сік, цукровий сироп і білок.", price: 210, volume: "150 мл", abv: 18 },
        { name: "Маргарита", description: "Текіла, апельсиновий лікер і свіжий лайм.", price: 210, volume: "150 мл", abv: 20 },
        { name: "Дайкірі", description: "Світлий ром, лайм і цукровий сироп.", price: 190, volume: "120 мл", abv: 18 },
        { name: "Мохіто", description: "Світлий ром, м'ята, лайм, цукор і содова.", price: 190, volume: "300 мл", abv: 12 },
        { name: "Піна Колада", description: "Ром, кокосові вершки та ананасовий сік.", price: 230, volume: "250 мл", abv: 14 },
        { name: "Лонг-Айленд Айс Ті", description: "Горілка, джин, ром, текіла, цитрус і кола.", price: 270, volume: "350 мл", abv: 22 },
        { name: "Еспресо Мартіні", description: "Горілка, еспресо, кавовий лікер і цукровий сироп.", price: 230, volume: "120 мл", abv: 18 },
      ],
    ],
    [
      shots.id,
      [
        { name: "Б-52", description: "Кавовий лікер, ірландський крем та апельсиновий лікер.", price: 150, volume: "50 мл", abv: 28 },
        { name: "Хіросіма", description: "Самбука, абсент, бейліз і гранатовий сироп.", price: 140, volume: "50 мл", abv: 30 },
        { name: "Лимонна крапля", description: "Горілка, лимонний сік і цукровий сироп.", price: 120, volume: "50 мл", abv: 22 },
        { name: "Камікадзе", description: "Горілка, апельсиновий лікер і лайм.", price: 120, volume: "50 мл", abv: 22 },
        { name: "Текіла Сламмер", description: "Текіла, лимонад і лайм — для швидкого тосту.", price: 130, volume: "50 мл", abv: 18 },
        { name: "Сет із 5 шотів", description: "П'ять будь-яких шотів із карти на вибір гостя.", price: 600, volume: "250 мл", abv: 24 },
      ],
    ],
    [
      lemonades.id,
      [
        { name: "Класичний цитрусовий", description: "Лимон, лайм, м'ята, цукровий сироп і содова.", price: 110, volume: "400 мл" },
        { name: "Малина — м'ята", description: "Малина, м'ята, лимонний сік і содова.", price: 120, volume: "400 мл" },
        { name: "Манго — маракуя", description: "Пюре манго та маракуї, лайм і содова.", price: 130, volume: "400 мл" },
        { name: "Огірок — лайм", description: "Свіжий огірок, лайм, м'ята та содова.", price: 120, volume: "400 мл" },
        { name: "Імбир — лимон", description: "Імбир, лимонний сік, медовий сироп і содова.", price: 110, volume: "400 мл" },
        { name: "Ягідний мікс", description: "Сезонні ягоди, лимонний сік, м'ята та содова.", price: 130, volume: "400 мл" },
      ],
    ],
    [
      hotDrinks.id,
      [
        { name: "Капучино", description: "Еспресо з ніжною молочною піною.", price: 90, volume: "200 мл" },
        { name: "Лате", description: "Еспресо з молоком, м'який та ніжний смак.", price: 95, volume: "250 мл" },
        { name: "Американо", description: "Класична чорна кава.", price: 70, volume: "200 мл" },
        { name: "Глінтвейн безалкогольний", description: "Гарячий виноградний сік з прянощами та цитрусом.", price: 110, volume: "250 мл" },
        { name: "Чорний чай", description: "Байховий чай з бергамотом.", price: 60, volume: "300 мл" },
        { name: "Гарячий шоколад", description: "Густий гарячий шоколад із вершками.", price: 100, volume: "250 мл" },
      ],
    ],
    [
      beer.id,
      [
        { name: "Лагер", description: "Класичний світлий лагер, легкий та освіжаючий.", price: 90, volume: "400 мл", abv: 4.5 },
        { name: "IPA", description: "Хмільний індійський світлий ель з цитрусовими нотами.", price: 120, volume: "400 мл", abv: 6.2 },
        { name: "Пшеничне", description: "Нефільтроване пшеничне пиво з нотами бананів та гвоздики.", price: 100, volume: "400 мл", abv: 5.0 },
        { name: "Стаут", description: "Темне пиво з нотами кави та карамелі.", price: 110, volume: "400 мл", abv: 5.5 },
        { name: "Портер", description: "Темний ель з шоколадними нотами.", price: 115, volume: "400 мл", abv: 6.0 },
        { name: "Пейл Ель", description: "Бурштинове пиво з м'яким хмільним смаком.", price: 105, volume: "400 мл", abv: 5.2 },
      ],
    ],
  ];

  for (const [categoryId, items] of menuItems) {
    await prisma.menuItem.deleteMany({ where: { categoryId } });
    await prisma.menuItem.createMany({
      data: items.map((item) => ({ categoryId, photoUrl: placeholder(item.name), ...item })),
    });
  }

  await prisma.siteContent.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      address: "вул. Покровська, 20, Суми, Україна",
      addressMapUrl: "https://maps.google.com/?q=вул.+Покровська+20+Суми",
      mapEmbedUrl: "https://maps.google.com/maps?q=вул.+Покровська+20+Суми&output=embed",
      workingHours: "17:00–23:30",
      phone: "+380 66 806 36 29",
      instagramUrl: "https://www.instagram.com/castaneda_smoking_bar/",
      googleUrl: "https://www.google.com/search?q=Castaneda+Smoking+Bar",
      allergyDisclaimer: "Якщо у вас алергія на певні продукти — попередьте персонал.",
      aboutText: "Затишний бар у центрі міста: класичні коктейлі, шоти та освіжаючі лимонади.",
    },
  });

  await prisma.bonusSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", percentage: 3 },
  });

  // Адмін-акаунт не сідиться заздалегідь: єдиний спосіб входу — Telegram, тому
  // акаунт з'являється сам після першого входу власника через /login, а потім
  // isAdmin виставляється вручну в БД (див. docs/production-readiness.md).
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
