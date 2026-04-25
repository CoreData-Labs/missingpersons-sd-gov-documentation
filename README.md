# Missing Persons SD – OSINT Data Extraction Pipeline

A Node.js + Puppeteer-based data extraction system that transforms publicly available missing persons information from the South Dakota Missing Persons database into a structured, machine-readable dataset.

🔗 Source Website:
https://missingpersons.sd.gov/

---

## 📌 Project Overview

This project is designed to improve the accessibility, structure, and usability of publicly available missing persons data by converting a dynamically rendered government website into a clean CSV dataset.

Instead of being locked in a browser-only interface, the data is transformed into a format that can be:

- Easily searched and filtered
- Analyzed for investigative patterns
- Shared across research workflows
- Integrated into OSINT tools and pipelines
- Used for data-driven reporting and documentation

---

## 🔄 Update Cycle (IMPORTANT)

This dataset is actively maintained and is updated every **24 hours**.

Each update process:

- Re-scrapes the official source website
- Detects new entries automatically
- Prevents duplicate records
- Appends only new or changed information
- Maintains a continuously growing dataset over time

This ensures the dataset remains current, accurate, and continuously evolving.

---

## 📊 What This Tool Collects

Each record is structured into the following fields:

### 🧾 Identity Information

- Name
- Age Missing
- Age Current
- Agency
- Phone
- Sex
- Race

### 🧍 Physical Description

- Eyes
- Hair
- Height
- Weight

### 📝 Case Context

- Remarks (last seen details, clothing description, additional notes)

---

## 📁 Output Format

The extracted data is stored in a structured CSV file:

missing_persons.csv

This format is compatible with:

- Microsoft Excel
- Google Sheets
- Data analysis tools (Python, R, etc.)
- OSINT workflows
- AI / structured dataset ingestion pipelines

---

## 🧠 OSINT & Research Value

This project is designed to support **open-source intelligence (OSINT)** and investigative workflows by:

- Converting unstructured web data into structured datasets
- Enabling faster cross-case comparison and filtering
- Supporting investigative journalism and public-interest research
- Allowing integration into analytical systems and databases

By standardizing publicly available information, it becomes significantly easier to analyze trends, identify updates, and support investigative work.

---

## ⚙️ Technical Overview

Built using:

- Node.js (runtime environment)
- Puppeteer (headless Chrome automation)
- JavaScript (ES6+)
- File System (fs module)
- CSV structured data output

---

## 🔁 Deduplication System

To ensure data integrity:

- Each record is tracked locally using a persistent store (`seen_records.json`)
- Duplicate entries are automatically ignored
- Only new or updated records are appended to the dataset
- This ensures a clean, continuously growing dataset without redundancy

---

## 📍 Data Source

All data is sourced from the official public government database:

https://missingpersons.sd.gov/

No private or restricted data is accessed. All records are publicly available.

---

## ⚠️ Ethical Use Statement

This project is intended strictly for:

- Public-interest research
- Journalism and reporting
- OSINT and investigative workflows
- Educational and analytical purposes

Users are responsible for ensuring compliance with applicable laws and ethical data usage guidelines.

---

## 🚀 Project Status

This project is actively maintained and improved.

- 🟢 Status: Active
- 🔄 Update Frequency: Every 24 hours
- 📈 Ongoing Improvements: Scraping reliability, data structure enhancements, and output optimization

---

## 👨‍💻 Author

Prajwal Koirala
Data Automation | OSINT Systems | Web Scraping Engineering
