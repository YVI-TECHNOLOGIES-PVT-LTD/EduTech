import { parse } from 'csv-parse';
import * as XLSX from 'xlsx';
import { Readable } from 'stream';
// NOTE: pdf-parse is intentionally NOT imported at the top level.
// pdfjs-dist (a dependency of pdf-parse) references DOMMatrix on module load,
// which is a browser-only API absent in Node.js < 20.16.0.
// Lazy-requiring inside parsePdf() prevents the crash at server startup.

export class FileParser {

    /**
     * Parse PDF Buffer to Array of Objects
     * Assumes a simple tabular structure with fixed headers.
     * Limitations: 
     * - Only works for text-based PDFs (no OCR)
     * - Assumes header is the first non-empty line
     * - Assumes columns are space/tab separated
     * - Very brittle; fails fast if structure is not detected
     */
    static async parsePdf(buffer: Buffer): Promise<any[]> {
        try {
            // Lazy-require pdf-parse to avoid pdfjs-dist loading DOMMatrix at startup
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const pdf = require('pdf-parse');
            const data = await pdf(buffer);
            const text = data.text;

            if (!text || text.trim().length === 0) {
                throw new Error("PDF appears empty or is image-based (OCR not supported)");
            }

            const lines = text.split(/\n/).map((l: string) => l.trim()).filter((l: string) => l.length > 0);
            if (lines.length < 2) return []; // Header + 1 row minimum

            // Heuristic: First line is header
            // Split by multiple spaces to detect columns
            // Regex \s{2,} matches 2 or more spaces acting as column separators
            const headers = lines[0].split(/\s{2,}/).map((h: string) => h.trim());

            if (headers.length < 2) {
                throw new Error("Unable to detect table columns. Ensure headers are clearly separated by spaces.");
            }

            const results = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                // Skip page numbers or artifacts usually short
                if (line.length < 5) continue;

                const values = line.split(/\s{2,}/).map((v: string) => v.trim());

                // Strict check: Value count must match header count
                // If not, we might merge last columns or skip. 
                // For safety Phase 4, we SKIP and warn (or fail row validation later).
                // Actually, let's try to map as best as possible.

                const row: any = {};
                headers.forEach((h: string, index: number) => {
                    row[h] = values[index] || "";
                });

                results.push(row);
            }

            return results;

        } catch (err: any) {
            throw new Error(`PDF Parsing Failed: ${err.message}`);
        }
    }

    /**
     * Parse CSV Buffer to Array of Objects
     * Expects headers in the first row.
     */
    static async parseCsv(buffer: Buffer): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const results: any[] = [];
            const stream = Readable.from(buffer.toString());

            stream.pipe(parse({
                columns: true,
                trim: true,
                skip_empty_lines: true
            }))
                .on('data', (data) => results.push(data))
                .on('error', (err) => reject(err))
                .on('end', () => resolve(results));
        });
    }

    /**
     * Parse Excel Buffer to Array of Objects
     * Reads the first sheet.
     */
    static parseExcel(buffer: Buffer): any[] {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(sheet, { defval: "" });
    }
}
