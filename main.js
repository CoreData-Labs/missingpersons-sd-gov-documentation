// ===== IMPORT REQUIRED MODULES =====
const puppeteer = require("puppeteer"); // Browser automation
const fs = require("fs"); // File system (read/write files)

// ===== CONFIGURATION (EASY TO MODIFY) =====
const URL = "https://missingpersons.sd.gov/"; // Target website
const OUTPUT_FILE = "output.txt"; // Where results are saved
const SEEN_FILE = "seen.json"; // Stores already saved people (to prevent duplicates)

// ===== SIMPLE LOGGER FUNCTION =====
function log(message) {
    const time = new Date().toLocaleTimeString(); // Current time
    console.log(`[${time}] ${message}`); // Pretty log format
}

// ===== SCRAPER FUNCTION =====
async function scrape() {
    log("Launching browser...");

    // Launch Chrome (visible window, 600x600)
    const browser = await puppeteer.launch({
        headless: false, // Show browser (for debugging)
        defaultViewport: { width: 600, height: 600 }, // Set resolution
    });

    const page = await browser.newPage(); // Open new tab

    log("Opening website...");
    await page.goto(URL, {
        waitUntil: "networkidle2", // Wait until page fully loads
    });

    log("Waiting for listings to appear...");
    await page.waitForSelector("article.card h3 a", { timeout: 10000 }); // Wait for names

    log("Extracting data from page...");

    // Run code inside the browser
    const data = await page.evaluate(() => {
        const results = []; // Store all records

        // Select all person cards
        const cards = document.querySelectorAll("article.card");

        cards.forEach(card => {
            // Extract name
            const name = card.querySelector("h3 a")?.innerText.trim() || "";

            // Helper function to extract fields by label
            const getField = (label) => {
                const el = Array.from(card.querySelectorAll(".listing-data"))
                    .find(p => p.innerText.includes(label)); // Find matching label
                return el?.querySelector("span")?.innerText.trim() || ""; // Get value
            };

            // Build record object
            const record = {
                name,
                ageMissing: getField("Age Missing"),
                ageCurrent: getField("Age Current"),
                agency: getField("Agency"),
                phone: getField("Phone"),
                sex: getField("Sex"),
                race: getField("Race"),
            };

            // Only add if name exists
            if (name) results.push(record);
        });

        return results; // Return all records
    });

    log(`Found ${data.length} total records on page`);

    await browser.close(); // Close browser
    log("Browser closed");

    return data; // Return scraped data
}

// ===== LOAD PREVIOUSLY SAVED NAMES =====
function loadSeen() {
    if (!fs.existsSync(SEEN_FILE)) {
        log("No seen file found, starting fresh");
        return new Set(); // Empty set if first run
    }

    const content = fs.readFileSync(SEEN_FILE); // Read file
    const parsed = JSON.parse(content); // Convert JSON to array

    log(`Loaded ${parsed.length} previously saved records`);

    return new Set(parsed); // Convert to Set for fast lookup
}

// ===== SAVE UPDATED SEEN LIST =====
function saveSeen(set) {
    fs.writeFileSync(SEEN_FILE, JSON.stringify([...set], null, 2)); // Save as JSON
    log(`Updated seen file (${set.size} total unique records)`);
}

// ===== SAVE ONLY NEW RECORDS =====
function saveNew(data, seen) {
    log("Checking for new records...");

    // Filter out already saved names
    const newEntries = data.filter(d => !seen.has(d.name));

    if (newEntries.length === 0) {
        log("No new records found (nothing to save)");
        return;
    }

    log(`Found ${newEntries.length} NEW records`);

    // Format text output
    const lines = newEntries.map(d => {
        return [
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

    // Append to output file
    fs.appendFileSync(OUTPUT_FILE, lines.join("\n") + "\n");

    log(`Saved ${newEntries.length} records to ${OUTPUT_FILE}`);

    // Add new names to seen set
    newEntries.forEach(d => seen.add(d.name));

    // Save updated seen list
    saveSeen(seen);
}

// ===== MAIN FUNCTION =====
async function run() {
    try {
        log("===== STARTING SCRAPER =====");

        const data = await scrape(); // Get data from website

        const seen = loadSeen(); // Load existing records

        saveNew(data, seen); // Save only new ones

        log("===== SCRAPER FINISHED =====");
    } catch (err) {
        log("ERROR OCCURRED:");
        console.error(err); // Print full error
    }
}

// ===== RUN SCRIPT =====
run();