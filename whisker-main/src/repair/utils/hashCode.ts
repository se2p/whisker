export type HashCode = number;

// Based on https://stackoverflow.com/a/7616484
export function hashCode(string: string): HashCode {
    let hash = 0;

    if (string.length === 0) {
        return hash;
    }

    for (let i = 0; i < string.length; i++) {
        const char = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }

    return hash;
}
