import * as fs from "fs";
import * as path from "path";

const envPath = fs.existsSync(path.join(process.cwd(), ".env.local"))
  ? path.join(process.cwd(), ".env.local")
  : path.join(__dirname, "../.env.local");

const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : process.env.GEMINI_API_KEY;

async function run() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    if (data.models && Array.isArray(data.models)) {
      for (const model of data.models) {
        if (model.name.includes("embedding")) {
          console.log(model.name, model.supportedGenerationMethods);
        }
      }
    } else {
      console.log("Response:", data);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
