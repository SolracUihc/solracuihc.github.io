// Source: https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
export function hash(str) {
    var hash = 0,
        i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

export function timeString(currentTime) {
    const le_time = Math.round(currentTime % 60 * 1000)/1000;
    return `${Math.floor(currentTime / 60)}:${le_time.toString().split('.')[0].padStart(2, '0')}.${le_time.toString().split('.')[1]?.padEnd(3, '0') ?? '000'}`;
}