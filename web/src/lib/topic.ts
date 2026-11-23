// Лимит Booking topic задан контрактом (BookingCreate.topic @maxLength(200))
// и проверяется сервером по Unicode code points. Здесь он повторяется, чтобы
// форма не отправляла заведомо длинный текст. Браузерный maxLength считает
// UTF-16 code units и потому для эмодзи строже серверного — это допустимо.
export const BOOKING_TOPIC_MAX_LENGTH = 200;
