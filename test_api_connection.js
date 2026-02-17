async function main() {
    try {
        console.log("Fetching /api/users/chat-contacts...");
        // API requires authentication (session). 
        // We can't easily fake the session cookie here without logging in.
        // However, if we hit it without cookie, it should return 401, not 500.
        // If it returns 500 even without auth, then the issue is likely in the import or setup *before* auth check.

        const res = await fetch('http://localhost:3000/api/users/chat-contacts');
        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Response: ${text.substring(0, 500)}...`); // Print first 500 chars

        console.log("\nFetching /api/messages/unread...");
        const res2 = await fetch('http://localhost:3000/api/messages/unread');
        console.log(`Status: ${res2.status}`);
        const text2 = await res2.text();
        console.log(`Response: ${text2.substring(0, 500)}...`);

    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

main();
