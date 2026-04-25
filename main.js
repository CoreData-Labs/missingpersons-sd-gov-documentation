"use strict"; // Enforce strict mode to prevent unsafe JavaScript behavior

const puppeteer = require("puppeteer"); // Import Puppeteer for browser automation (headless Chrome control)
const fs = require("fs"); // Import file system module for reading/writing local files
const path = require("path"); // Import path module for safe cross-platform file handling

// ===================== CONFIGURATION =====================

const TARGET_WEBSITE_URL = "https://missingpersons.sd.gov/"; // Website to scrape missing persons data

const CSV_OUTPUT_FILE_PATH = path.join(__dirname, "missing_persons.csv"); // Output CSV file location

const SEEN_RECORDS_FILE_PATH = path.join(__dirname, "seen_records.json"); // Stores already processed people to prevent duplicates

const BROWSER_VIEWPORT_SIZE = { width: 600, height: 600 }; // Browser window size for consistent rendering

// ===================== LOGGING UTILITIES =====================

function logInfo(message) {
  // Standard log function for debugging and monitoring
  const currentTime = new Date().toLocaleTimeString(); // Get current system time
  console.log(`[INFO ${currentTime}] ${message}`); // Print formatted log message
}

function logError(message) {
  // Error logging function
  const currentTime = new Date().toLocaleTimeString(); // Get current system time
  console.error(`[ERROR ${currentTime}] ${message}`); // Print formatted error message
}

// ===================== BROWSER SCRAPER =====================

async function scrapeMissingPersonsWebsite() {
  // Main scraping function

  logInfo("Starting Puppeteer browser..."); // Log browser start

  const browserInstance = await puppeteer.launch({
    // Launch Chrome browser
    headless: false, // Show browser window for debugging
    defaultViewport: BROWSER_VIEWPORT_SIZE, // Set browser size
  });

  const pageInstance = await browserInstance.newPage(); // Open a new browser tab

  logInfo("Navigating to website..."); // Log navigation step

  await pageInstance.goto(TARGET_WEBSITE_URL, {
    // Load target website
    waitUntil: "networkidle2", // Wait until network is idle (JS fully loaded)
  });

  logInfo("Waiting for page content to load..."); // Log waiting step

  await pageInstance.waitForSelector("article.card h3 a", { timeout: 15000 }); // Wait for listings to appear

  logInfo("Extracting structured data from page..."); // Log extraction step

  const extractedData = await pageInstance.evaluate(() => {
    // Run code inside browser context

    const allPersonCards = document.querySelectorAll("article.card"); // Select all person cards on page

    const extractedResults = []; // Store final extracted records

    // Helper function: extract labeled field values from a card
    const getFieldValueByLabel = (cardElement, labelName) => {
      const matchingElement = Array.from(
        cardElement.querySelectorAll(".listing-data"),
      ) // Get all labeled fields

        .find((element) => element.innerText.includes(labelName)); // Find correct label

      return matchingElement?.querySelector("span")?.innerText.trim() || ""; // Return clean value or empty string
    };

    allPersonCards.forEach((card) => {
      // Loop through each person card

      const fullName = card.querySelector("h3 a")?.innerText.trim() || ""; // Extract person name

      if (!fullName) return; // Skip if no name exists

      const remarksBlock = Array.from(card.querySelectorAll("p")) // Select all paragraphs in card

        .find((p) => p.innerText.trim().length > 50); // Identify long text block as remarks

      const personData = {
        // Build structured record

        name: fullName, // Person full name

        ageMissing: getFieldValueByLabel(card, "Age Missing"), // Age when missing
        ageCurrent: getFieldValueByLabel(card, "Age Current"), // Current age
        agency: getFieldValueByLabel(card, "Agency"), // Reporting agency
        phone: getFieldValueByLabel(card, "Phone"), // Contact phone number
        race: getFieldValueByLabel(card, "Race"), // Race information
        sex: getFieldValueByLabel(card, "Sex"), // Gender

        eyes: getFieldValueByLabel(card, "Eyes"), // Eye color
        hair: getFieldValueByLabel(card, "Hair"), // Hair color
        height: getFieldValueByLabel(card, "Height"), // Height
        weight: getFieldValueByLabel(card, "Weight"), // Weight

        remarks: remarksBlock?.innerText.trim() || "", // Full descriptive remarks
      };

      extractedResults.push(personData); // Add record to final array
    });

    return extractedResults; // Return data to Node.js environment
  });

  await browserInstance.close(); // Close browser after scraping

  logInfo(`Scraping completed. Total records found: ${extractedData.length}`); // Log completion

  return extractedData; // Return scraped data
}

// ===================== SEEN RECORDS HANDLING =====================

function loadSeenRecords() {
  // Load previously processed records

  if (!fs.existsSync(SEEN_RECORDS_FILE_PATH)) {
    // Check if file exists

    logInfo("No existing record file found. Starting fresh."); // Log first run

    return new Set(); // Return empty Set
  }

  const rawFileData = fs.readFileSync(SEEN_RECORDS_FILE_PATH, "utf-8"); // Read file content

  const parsedArray = JSON.parse(rawFileData); // Convert JSON string to array

  logInfo(`Loaded ${parsedArray.length} previously seen records.`); // Log loaded count

  return new Set(parsedArray); // Convert array to Set for fast lookup
}

function saveSeenRecords(seenRecordsSet) {
  // Save updated seen records

  fs.writeFileSync(
    // Write to JSON file

    SEEN_RECORDS_FILE_PATH, // File path

    JSON.stringify([...seenRecordsSet], null, 2), // Convert Set to JSON array
  );

  logInfo(`Updated seen records count: ${seenRecordsSet.size}`); // Log update
}

// ===================== CSV HELPERS =====================

function escapeCSVField(value) {
  // Prevent CSV breaking from commas/quotes

  if (!value) return ""; // Handle empty values

  return `"${String(value).replace(/"/g, '""')}"`; // Escape quotes for CSV format
}

// ===================== SAVE TO CSV =====================

function saveNewRecordsToCSV(allScrapedData, seenRecordsSet) {
  // Save only new records

  logInfo("Checking for new records..."); // Log step

  const newRecords = allScrapedData.filter(
    (record) => !seenRecordsSet.has(record.name),
  ); // Filter unseen records

  logInfo(`New records found: ${newRecords.length}`); // Log result

  if (newRecords.length === 0) {
    // If nothing new

    logInfo("No updates required."); // Log skip

    return; // Exit function
  }

  const fileExists = fs.existsSync(CSV_OUTPUT_FILE_PATH); // Check if CSV exists

  if (!fileExists) {
    // If first run

    const csvHeader =
      "Name,Age Missing,Age Current,Agency,Phone,Race,Sex,Eyes,Hair,Height,Weight,Remarks\n"; // CSV header row

    fs.writeFileSync(CSV_OUTPUT_FILE_PATH, csvHeader); // Create file with header

    logInfo("CSV file created with headers."); // Log creation
  }

  const csvRows = newRecords.map((person) =>
    [
      // Convert records to CSV rows

      escapeCSVField(person.name), // Name
      escapeCSVField(person.ageMissing), // Age missing
      escapeCSVField(person.ageCurrent), // Age current
      escapeCSVField(person.agency), // Agency
      escapeCSVField(person.phone), // Phone
      escapeCSVField(person.race), // Race
      escapeCSVField(person.sex), // Sex
      escapeCSVField(person.eyes), // Eyes
      escapeCSVField(person.hair), // Hair
      escapeCSVField(person.height), // Height
      escapeCSVField(person.weight), // Weight
      escapeCSVField(person.remarks), // Remarks
    ].join(","),
  ); // Join into CSV row

  fs.appendFileSync(CSV_OUTPUT_FILE_PATH, csvRows.join("\n") + "\n"); // Append to file

  logInfo(`Saved ${newRecords.length} new records to CSV.`); // Log save

  newRecords.forEach((person) => seenRecordsSet.add(person.name)); // Update seen records

  saveSeenRecords(seenRecordsSet); // Persist seen records
}

// ===================== MAIN EXECUTION =====================

async function runScraper() {
  // Entry point function

  try {
    // Start error handling

    logInfo("========== SCRAPER STARTED =========="); // Start log

    const scrapedData = await scrapeMissingPersonsWebsite(); // Run scraper

    const seenRecordsSet = loadSeenRecords(); // Load previous records

    saveNewRecordsToCSV(scrapedData, seenRecordsSet); // Save new data only

    logInfo("========== SCRAPER FINISHED SUCCESSFULLY =========="); // Finish log
  } catch (error) {
    // Catch any runtime error

    logError("Scraper execution failed"); // Error log

    console.error(error); // Print full error stack
  }
}

// Start program execution
runScraper(); // Run scraper immediately
