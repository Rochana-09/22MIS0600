 const axios = require('axios');
const { Log } = require('../logging_middleware/index');

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJyb2NoYW5hLnIyMDIyQHZpdHN0dWRlbnQuYWMuaW4iLCJleHAiOjE3Nzg5Mjk5MTIsImlhdCI6MTc3ODkyOTAxMiwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjVjNjdmOGY1LTRhM2QtNGNmYS1iMjg0LWVlMjIwNjYxOGMyMSIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InJvY2hhbmEgcmF0YWtvbmRhIiwic3ViIjoiMzE5Mzg5YTgtODhkYS00ZmFiLTg0ODMtMTVlZGZkM2RmYmM1In0sImVtYWlsIjoicm9jaGFuYS5yMjAyMkB2aXRzdHVkZW50LmFjLmluIiwibmFtZSI6InJvY2hhbmEgcmF0YWtvbmRhIiwicm9sbE5vIjoiMjJtaXMwNjAwIiwiYWNjZXNzQ29kZSI6IlNmRnVXZyIsImNsaWVudElEIjoiMzE5Mzg5YTgtODhkYS00ZmFiLTg0ODMtMTVlZGZkM2RmYmM1IiwiY2xpZW50U2VjcmV0IjoiQk15Y0JGWUhaYmV5aFJyVyJ9.gqEkcafApziHZ-i_g6jUW7s70zW9fNEQo99bt0MEWJA";

const TYPE_WEIGHT = { Placement: 3, Result: 2, Event: 1 };

async function getPriorityInbox(n = 10) {
  await Log("backend", "info", "service", `Fetching top ${n} priority notifications`);

  const res = await axios.get(
    'http://4.224.186.213/evaluation-service/notifications',
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );

  const notifications = res.data.notifications;
  await Log("backend", "info", "service", `Total notifications fetched: ${notifications.length}`);

  const scored = notifications.map(notif => ({
    ...notif,
    score: (TYPE_WEIGHT[notif.Type] || 0) * 1000 + new Date(notif.Timestamp).getTime() / 1e10
  }));

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, n);

  await Log("backend", "info", "service", `Returning top ${n} notifications`);
  console.log(`\n=== TOP ${n} PRIORITY NOTIFICATIONS ===\n`);
  top.forEach((notif, i) => {
    console.log(`${i + 1}. [${notif.Type}] ${notif.Message} | ${notif.Timestamp}`);
  });

  return top;
}

getPriorityInbox(10).catch(async (err) => {
  await Log("backend", "fatal", "service", `Error: ${err.message}`);
  console.error(err);
});