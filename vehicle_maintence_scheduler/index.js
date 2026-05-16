const axios = require('axios');
const { Log } = require('../logging_middleware/index');

const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJyb2NoYW5hLnIyMDIyQHZpdHN0dWRlbnQuYWMuaW4iLCJleHAiOjE3Nzg5Mjk5MTIsImlhdCI6MTc3ODkyOTAxMiwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjVjNjdmOGY1LTRhM2QtNGNmYS1iMjg0LWVlMjIwNjYxOGMyMSIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InJvY2hhbmEgcmF0YWtvbmRhIiwic3ViIjoiMzE5Mzg5YTgtODhkYS00ZmFiLTg0ODMtMTVlZGZkM2RmYmM1In0sImVtYWlsIjoicm9jaGFuYS5yMjAyMkB2aXRzdHVkZW50LmFjLmluIiwibmFtZSI6InJvY2hhbmEgcmF0YWtvbmRhIiwicm9sbE5vIjoiMjJtaXMwNjAwIiwiYWNjZXNzQ29kZSI6IlNmRnVXZyIsImNsaWVudElEIjoiMzE5Mzg5YTgtODhkYS00ZmFiLTg0ODMtMTVlZGZkM2RmYmM1IiwiY2xpZW50U2VjcmV0IjoiQk15Y0JGWUhaYmV5aFJyVyJ9.gqEkcafApziHZ-i_g6jUW7s70zW9fNEQo99bt0MEWJA";

const reqHeaders = {
    headers: { Authorization: 'Bearer ' + authToken }
};

const baseUrl = 'http://4.224.186.213/evaluation-service';

// 0/1 knapsack - picks best vehicles within mechanic hour budget
function findBestTasks(taskList, hourLimit) {
    let total = taskList.length;
    
    // build dp table row by row
    let dp = [];
    for (let i = 0; i <= total; i++) {
        dp.push(new Array(hourLimit + 1).fill(0));
    }

    for (let i = 1; i <= total; i++) {
        let task = taskList[i - 1];
        for (let hrs = 0; hrs <= hourLimit; hrs++) {
            // either skip this task or include it
            dp[i][hrs] = dp[i-1][hrs];
            if (task.Duration <= hrs) {
                let withTask = dp[i-1][hrs - task.Duration] + task.Impact;
                if (withTask > dp[i][hrs]) {
                    dp[i][hrs] = withTask;
                }
            }
        }
    }
    return dp[total][hourLimit];
}

async function run() {
    await Log("backend", "info", "controller", "fetching depot and vehicle data from server");

    let depotData = await axios.get(baseUrl + '/depots', reqHeaders);
    let vehicleData = await axios.get(baseUrl + '/vehicles', reqHeaders);

    let depotList = depotData.data.depots;
    let vehicleList = vehicleData.data.vehicles;

    await Log("backend", "info", "service", "data fetched: " + depotList.length + " depots, " + vehicleList.length + " vehicles");

    for (let d = 0; d < depotList.length; d++) {
        let depot = depotList[d];
        await Log("backend", "info", "service", "processing depot " + depot.ID + " with " + depot.MechanicHours + " hours");
        
        let best = findBestTasks(vehicleList, depot.MechanicHours);
        
        console.log("Depot " + depot.ID + " | Hours Available: " + depot.MechanicHours + " | Best Impact Score: " + best);
        await Log("backend", "info", "service", "depot " + depot.ID + " result: " + best);
    }

    await Log("backend", "info", "controller", "scheduling complete for all depots");
}

run().catch(async function(err) {
    await Log("backend", "fatal", "controller", "unexpected error: " + err.message);
    console.error(err);
});