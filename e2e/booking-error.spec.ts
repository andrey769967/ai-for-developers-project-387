import { test, expect } from "@playwright/test";

// Регресс к форме записи: если POST /api/bookings завершается ошибкой,
// гость не теряет уже введённые имя, email и тему и видит сообщение сервера.
// Ответы API не подменяются: отказ создаёт настоящий конфликт — слот занимает
// другой гость через API, пока форма открыта на устаревшем списке слотов.
test.use({ timezoneId: "Europe/Moscow" });

type MeetingType = { id: string; name: string };
type Slot = { startTime: string; endTime: string };

const MOSCOW_TIME = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  hour: "2-digit",
  minute: "2-digit",
});

test("ошибка записи сохраняет поля формы и показывает сообщение", async ({
  page,
  request,
}) => {
  const stamp = Date.now();
  const guestName = "E2E Error Guest";
  const guestEmail = `e2e-error-${stamp}@example.com`;
  const topic = "Проверить обработку ошибки";
  const conflictEmail = `e2e-rival-${stamp}@example.com`;

  await page.goto("/");
  await page.getByRole("button", { name: /Консультация/ }).click();
  await expect(page.getByText("Даты")).toBeVisible();

  // Последний день Booking window: до него далеко, поэтому Slot не станет
  // прошедшим между загрузкой страницы и созданием конфликта.
  const lastDay = page.locator("div.grid-cols-7").nth(1).getByRole("button").last();
  await lastDay.click();

  const timeSlot = page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).last();
  await expect(timeSlot).toBeVisible();
  const selectedLabel = (await timeSlot.textContent())?.trim();
  await timeSlot.click();

  await page.getByPlaceholder("Ваше имя").fill(guestName);
  await page.getByPlaceholder("you@example.com").fill(guestEmail);
  await page.getByPlaceholder("О чём хотите поговорить?").fill(topic);

  // Настоящий конфликт: тот же Slot занимает другой гость через API.
  const typesResponse = await request.get("/api/meeting-types");
  expect(typesResponse.ok()).toBeTruthy();
  const meetingTypes = (await typesResponse.json()) as MeetingType[];
  const consultation = meetingTypes.find((type) => type.name === "Консультация");
  if (!consultation) throw new Error("Консультация не найдена среди типов встреч");

  const slotsResponse = await request.get(
    `/api/meeting-types/${consultation.id}/slots`,
  );
  expect(slotsResponse.ok()).toBeTruthy();
  const slots = (await slotsResponse.json()) as Slot[];
  const target = slots[slots.length - 1];
  if (!target) throw new Error("В окне записи нет свободных слотов");

  // Кнопка в календаре и последний свободный старт окна — один и тот же Slot.
  expect(selectedLabel).toBe(MOSCOW_TIME.format(new Date(target.startTime)));

  const conflict = await request.post("/api/bookings", {
    data: {
      meetingTypeId: consultation.id,
      guestName: "E2E Rival",
      guestEmail: conflictEmail,
      topic: "Занимаю слот",
      startTime: target.startTime,
    },
  });
  expect(conflict.status()).toBe(201);

  // Отправка устаревшей формы должна получить отказ сервера.
  await page.getByRole("button", { name: "Записаться" }).click();

  await expect(
    page.getByText("Это время уже занято, выберите другое"),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Вы записаны!" })).toHaveCount(0);

  // Регресс: после ошибки введённые значения остаются в форме.
  await expect(page.getByPlaceholder("Ваше имя")).toHaveValue(guestName);
  await expect(page.getByPlaceholder("you@example.com")).toHaveValue(guestEmail);
  await expect(page.getByPlaceholder("О чём хотите поговорить?")).toHaveValue(
    topic,
  );
});
