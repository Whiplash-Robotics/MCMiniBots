async function invalid() {
    const fs = await import('fs');
}

await invalid();
