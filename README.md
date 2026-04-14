# Alkitab Indolinear

An open-source web application for viewing the Indonesian Interlinear Bible.

## Acknowledgements & Data Sources
This application was built to interface with data provided by SABDA. 
* **Biblical Text:** The Indonesian Terjemahan Baru (TB) translation is the copyright of **Lembaga Alkitab Indonesia (LAI)**.
* **Interlinear & Dictionary Data:** Sourced from **[SABDA](https://devx.sabda.org/)** (Yayasan Lembaga SABDA).

## License
The **source code** of this application is licensed under the [MIT License](LICENSE). 

**Disclaimer:** The license applies *only* to the software source code (the React application and scraping scripts). It does **not** apply to the biblical text, Strong's dictionary definitions, or any scraped data. All biblical data remains the copyrighted property of Lembaga Alkitab Indonesia (LAI) and/or SABDA.

## Using this repository

- Clone or download the project repository to your local computer.
- Find the file named bible.db and delete it. (If you also see files named bible.db-journal, bible.db-wal, or bible.db-shm, delete those as well.)
- Run `npm install` to install dependencies.
- Run `npm run dev` in one terminal to start the local server.
-Run `npm run export` in another terminal. This will take a long time and will populate the `public/data/` folder with all the Bible chapters and Strong's definitions.
- If there was an error resulting in a skipped chapter, run `npm run export` again.
- Once the export is complete, run `npm run build:static`.
- The resulting `dist/` folder will contain your fully static app (HTML, JS, CSS, and all the JSON data).