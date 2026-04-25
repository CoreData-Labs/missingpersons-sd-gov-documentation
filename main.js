const puppeteer = require("puppeteer");
const fs = require("fs");

const URL = "https://missingpersons.sd.gov/";
const OUTPUT_FILE = "output.txt";

async function scrape() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 1920,
            height: 1080,
        },
    });

    const page = await browser.newPage();

    await page.goto(URL, {
        waitUntil: "networkidle2", // wait for JS to finish loading
    });

    // Wait for cards to appear
    await page.waitForSelector("article.card");

    // Extra safety wait (ensures collapsible sections render)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const data = await page.evaluate(() => {
        const results = [];

        const cards = document.querySelectorAll("article.card");

        cards.forEach(card => {
            const name = card.querySelector("h3 a")?.innerText.trim() || "";

            const getField = (label) => {
                const el = Array.from(card.querySelectorAll(".listing-data"))
                    .find(p => p.innerText.includes(label));
                return el?.querySelector("span")?.innerText.trim() || "";
            };

            const ageMissing = getField("Age Missing");
            const ageCurrent = getField("Age Current");
            const agency = getField("Agency");
            const phone = getField("Phone");
            const race = getField("Race");
            const sex = getField("Sex");

            if (name) {
                results.push({
                    name,
                    ageMissing,
                    ageCurrent,
                    agency,
                    phone,
                    sex,
                    race,
                });
            }
        });

        return results;
    });

    await browser.close();
    return data;
}

function saveToTxt(data) {
    const timestamp = new Date().toISOString();

    const lines = data.map(d => {
        return [
            `Timestamp: ${timestamp}`,
            `Name: ${d.name}`,
            `Age Missing: ${d.ageMissing}`,
            `Age Current: ${d.ageCurrent}`,
            `Agency: ${d.agency}`,
            `Phone: ${d.phone}`,
            `Sex: ${d.sex}`,
            `Race: ${d.race}`,
            "-----------------------------"
        ].join("\n");
    });

    fs.appendFileSync(OUTPUT_FILE, lines.join("\n") + "\n");
}

async function run() {
    try {
        console.log("Starting scraper...");
        const data = await scrape();

        console.log(`Found ${data.length} records`);

        saveToTxt(data);

        console.log("Saved to output.txt");
    } catch (err) {
        console.error("Error:", err);
    }
}

run();
