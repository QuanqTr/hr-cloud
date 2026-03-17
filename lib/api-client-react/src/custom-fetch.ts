export const customFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    // Some APIs might return empty responses, handling JSON parsing gracefully
    const text = await response.text();
    return text ? JSON.parse(text) : undefined;
};
