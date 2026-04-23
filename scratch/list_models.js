
const apiKey = "AIzaSyAxlJY1LxGTM2ZgdlEKUxv4Q6IMbplG_eU";
const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

async function listModels() {
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
