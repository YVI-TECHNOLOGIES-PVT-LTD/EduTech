export const exportToCSV = (
    data: any[],
    headers: string[],
    filename = 'export-data.csv'
) => {
    if (data.length === 0) return;

    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header] ?? '';
            const escaped = ('' + val).replace(/"/g, '\\"');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
