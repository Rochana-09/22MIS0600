const axios = require('axios');

const bearerToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJyb2NoYW5hLnIyMDIyQHZpdHN0dWRlbnQuYWMuaW4iLCJleHAiOjE3Nzg5Mjk5MTIsImlhdCI6MTc3ODkyOTAxMiwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjVjNjdmOGY1LTRhM2QtNGNmYS1iMjg0LWVlMjIwNjYxOGMyMSIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InJvY2hhbmEgcmF0YWtvbmRhIiwic3ViIjoiMzE5Mzg5YTgtODhkYS00ZmFiLTg0ODMtMTVlZGZkM2RmYmM1In0sImVtYWlsIjoicm9jaGFuYS5yMjAyMkB2aXRzdHVkZW50LmFjLmluIiwibmFtZSI6InJvY2hhbmEgcmF0YWtvbmRhIiwicm9sbE5vIjoiMjJtaXMwNjAwIiwiYWNjZXNzQ29kZSI6IlNmRnVXZyIsImNsaWVudElEIjoiMzE5Mzg5YTgtODhkYS00ZmFiLTg0ODMtMTVlZGZkM2RmYmM1IiwiY2xpZW50U2VjcmV0IjoiQk15Y0JGWUhaYmV5aFJyVyJ9.gqEkcafApziHZ-i_g6jUW7s70zW9fNEQo99bt0MEWJA";

const logUrl = 'http://4.224.186.213/evaluation-service/logs';

async function Log(stack, level, package_, message) {
    const payload = {
        stack: stack,
        level: level,
        package: package_,
        message: message
    };

    try {
        await axios.post(logUrl, payload, {
            headers: { Authorization: 'Bearer ' + bearerToken }
        });
        console.log(`[LOG] ${level} | ${package_} | ${message}`);
    } catch(e) {
        console.error("could not send log:", e.message);
    }
}

module.exports = { Log };