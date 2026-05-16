const axios = require('axios');
const { Log } = require('../logging_middleware/index');

const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJyb2NoYW5hLnIyMDIyQHZpdHN0dWRlbnQuYWMuaW4iLCJleHAiOjE3Nzg5Mjk5MTIsImlhdCI6MTc3ODkyOTAxMiwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjVjNjdmOGY1LTRhM2QtNGNmYS1iMjg0LWVlMjIwNjYxOGMyMSIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InJvY2hhbmEgcmF0YWtvbmRhIiwic3ViIjoiMzE5Mzg5YTgtODhkYS00ZmFiLTg0ODMtMTVlZGZkM2RmYmM1In0sImVtYWlsIjoicm9jaGFuYS5yMjAyMkB2aXRzdHVkZW50LmFjLmluIiwibmFtZSI6InJvY2hhbmEgcmF0YWtvbmRhIiwicm9sbE5vIjoiMjJtaXMwNjAwIiwiYWNjZXNzQ29kZSI6IlNmRnVXZyIsImNsaWVudElEIjoiMzE5Mzg5YTgtODhkYS00ZmFiLTg0ODMtMTVlZGZkM2RmYmM1IiwiY2xpZW50U2VjcmV0IjoiQk15Y0JGWUhaYmV5aFJyVyJ9.gqEkcafApziHZ-i_g6jUW7s70zW9fNEQo99bt0MEWJA";

const notifUrl = 'http://4.224.186.213/evaluation-service/notifications';

// higher number = more important
const priorityMap = {
    'Placement': 3,
    'Result': 2,
    'Event': 1
};

function calcScore(notif) {
    let typeScore = priorityMap[notif.Type] || 0;
    let timeScore = new Date(notif.Timestamp).getTime() / 1e10;
    return (typeScore * 1000) + timeScore;
}

async function getTopNotifications(topN) {
    await Log("backend", "info", "service", "starting priority inbox fetch, top " + topN);

    let response = await axios.get(notifUrl, {
        headers: { Authorization: 'Bearer ' + authToken }
    });

    let allNotifs = response.data.notifications;
    await Log("backend", "info", "service", "received " + allNotifs.length + " notifications total");

    // score and sort
    for (let i = 0; i < allNotifs.length; i++) {
        allNotifs[i].score = calcScore(allNotifs[i]);
    }

    allNotifs.sort(function(a, b) {
        return b.score - a.score;
    });

    let result = allNotifs.slice(0, topN);

    await Log("backend", "info", "service", "sorted and returning top " + topN + " results");

    console.log("\n--- Priority Inbox (Top " + topN + ") ---\n");
    for (let i = 0; i < result.length; i++) {
        let n = result[i];
        console.log((i+1) + ". [" + n.Type + "] " + n.Message + "  (" + n.Timestamp + ")");
    }

    return result;
}

getTopNotifications(10).catch(async function(err) {
    await Log("backend", "fatal", "service", "failed: " + err.message);
    console.error(err);
});