export default (fileContents) => {
    const result = {};
    const regex = /(\*|\/)\s*(\w[\w\s-]+):\s*([\w\s:\/\.\-\@]+)/g;
    let match;

    while ((match = regex.exec(fileContents)) !== null) {
        const key = match[2].trim().replace(/\s+/g, '_').toLowerCase();
        const value = match[3].trim();
        result[key] = value;
    }

    return result;
}