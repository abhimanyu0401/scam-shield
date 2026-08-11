import * as fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : process.env.GEMINI_API_KEY;

async function run() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    for (const model of data.models) {
        if (model.name.includes("embedding")) {
            console.log(model.name, model.supportedGenerationMethods);
        }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
