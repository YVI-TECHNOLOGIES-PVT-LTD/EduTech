interface PrintOptions {
    title: string;
    data: Record<string, unknown>[];
    columns: string[];
}

export const PrintPreview = {
    print({ title, data, columns }: PrintOptions) {
        const html = `
            <!DOCTYPE html><html><head><title>${title}</title>
            <style>
                body{font-family:system-ui,sans-serif;padding:24px;color:#111}
                h1{font-size:18px;margin-bottom:16px}
                table{width:100%;border-collapse:collapse;font-size:12px}
                th,td{border:1px solid #ddd;padding:8px;text-align:left}
                th{background:#f5f5f5;font-weight:700;text-transform:uppercase;font-size:10px}
                @media print{body{padding:0}}
            </style></head><body>
            <h1>${title}</h1>
            <p style="font-size:11px;color:#666">${data.length} records · Generated ${new Date().toLocaleString()}</p>
            <table><thead><tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr></thead>
            <tbody>${data.map(row => `<tr>${columns.map(c => `<td>${row[c] ?? ''}</td>`).join('')}</tr>`).join('')}
            </tbody></table></body></html>`;
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
            win.focus();
            win.print();
        }
    },
};
