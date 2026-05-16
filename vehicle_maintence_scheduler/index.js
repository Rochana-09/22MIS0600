const axios = require('axios');
const { Log } = require('../logging_middleware/index');

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJyb2NoYW5hLnIyMDIyQHZpdHN0dWRlbnQuYWMuaW4iLCJleHAiOjE3Nzg5Mjk5MTIsImlhdCI6MTc3ODkyOTAxMiwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjVjNjdmOGY1LTRhM2QtNGNmYS1iMjg0LWVlMjIwNjYxOGMyMSIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InJvY2hhbmEgcmF0YWtvbmRhIiwic3ViIjoiMzE5Mzg5YTgtODhkYS00ZmFiLTg0ODMtMTVlZGZkM2RmYmM1In0sImVtYWlsIjoicm9jaGFuYS5yMjAyMkB2aXRzdHVkZW50LmFjLmluIiwibmFtZSI6InJvY2hhbmEgcmF0YWtvbmRhIiwicm9sbE5vIjoiMjJtaXMwNjAwIiwiYWNjZXNzQ29kZSI6IlNmRnVXZyIsImNsaWVudElEIjoiMzE5Mzg5YTgtODhkYS00ZmFiLTg0ODMtMTVlZGZkM2RmYmM1IiwiY2xpZW50U2VjcmV0IjoiQk15Y0JGWUhaYmV5aFJyVyJ9.gqEkcafApziHZ-i_g6jUW7s70zW9fNEQo99bt0MEWJA";
const HEADERS = { headers: { Authorization: `Bearer ${TOKEN}` } };

async function knapsack(vehicles, capacity) {
  await Log("backend", "info", "service", "Running knapsack algorithm for depot");
  const n = vehicles.length;
  const dp = Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const { Duration, Impact } = vehicles[i - 1];
    for (let w = 0; w <= capacity; w++) {
      dp[i][w] = dp[i - 1][w];
      if (Duration <= w) {
        dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - Duration] + Impact);
      }
    }
  }
  return dp[n][capacity];
}

async function main() {
  await Log("backend", "info", "controller", "Starting vehicle maintenance scheduler");

  const depotsRes = await axios.get('http://4.224.186.213/evaluation-service/depots', HEADERS);
  const vehiclesRes = await axios.get('http://4.224.186.213/evaluation-service/vehicles', HEADERS);

  const depots = depotsRes.data.depots;
  const vehicles = vehiclesRes.data.vehicles;

  await Log("backend", "info", "service", `Fetched ${depots.length} depots and ${vehicles.length} vehicles`);

  for (const depot of depots) {
    const maxImpact = await knapsack(vehicles, depot.MechanicHours);
    console.log(`Depot ${depot.ID} | Budget: ${depot.MechanicHours}h | Max Impact: ${maxImpact}`);
    await Log("backend", "info", "service", `Depot ${depot.ID} max impact score: ${maxImpact}`);
  }

  await Log("backend", "info", "controller", "Vehicle maintenance scheduler completed");
}

main().catch(async (err) => {
  await Log("backend", "fatal", "controller", `Fatal error: ${err.message}`);
  console.error(err);
});