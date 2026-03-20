import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';

async function post(path, body) {
    const response = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || `HTTP ${response.status}`);
    return json;
}

export async function generateTest(payload) {
    try {
        const json = await post('/api/test/create', payload);
        return { success: true, data: json.data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

export async function runTest(payload) {
    try {
        const json = await post('/api/test/run', payload);
        return { success: true, data: json.data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

export async function getTestStatus(payload) {
    try {
        const json = await post('/api/test/report', payload);
        return { success: true, data: json.data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}