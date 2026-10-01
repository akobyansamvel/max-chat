# Telegram Chat (GREEN-API)

React + Vite. Чат создаётся через `checkAccount` (получаем chatId). Отправка — `sendMessage`, получение — `receiveNotification` + `deleteNotification` (HTTP API).

```bash
npm install
npm run dev
```

1. В личном кабинете GREEN-API: инстанс Telegram должен быть авторизован, в настройках `webhookUrl` пустой.
2. Введите `idInstance`, `apiTokenInstance` (и `apiUrl`, если он отличается от https://api.green-api.com).
3. Введите номер получателя (79991234567) или @username → «Создать чат» → пишите сообщения.
