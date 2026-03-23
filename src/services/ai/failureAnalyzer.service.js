import { logInfo, logError } from '../../utils/logger.js';

const ENDPOINT   = process.env.AZURE_INFERENCE_ENDPOINT;
const API_KEY    = process.env.AZURE_INFERENCE_KEY;
const MODEL_NAME = process.env.AZURE_MODEL_NAME || 'Llama-3.3-70B-Instruct';

/**
 * Analyze a Playwright test failure using Azure AI Foundry (same endpoint as test generation).
 *
 * @param {object} report        - Parsed report from reportParser.service.js
 * @param {string} artifactPath  - Path to the artifacts folder for this testId
 * @param {string} stderr        - Raw stderr from the Playwright process
 * @returns {string|null}        - AI analysis text, or null if unavailable
 */
export const analyzeFailure = async (report, artifactPath, stderr = '') => {
    if (!ENDPOINT || !API_KEY) {
        logInfo('Azure AI credentials not set — skipping failure analysis');
        return null;
    }

    const prompt = `You are an expert QA automation engineer. Analyze this Playwright test failure.

## Report
${JSON.stringify(report, null, 2)}

## Stderr / Error output
${stderr || '(none)'}

## Artifact path
${artifactPath}

## Tasks
1. Explain clearly why the test failed.
2. Identify whether it is a selector issue, assertion issue, timing issue, or logic issue.
3. Suggest a concrete fix (code snippet if relevant).
4. If the failure is due to a wrong selector, suggest the correct selector based on the error message.

Be concise and technical. Respond in plain text, no markdown headings.`;

    try {
        const url = `${ENDPOINT.replace(/\/$/, '')}/chat/completions`;
        logInfo(`Calling Azure AI Foundry for failure analysis: ${url}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'api-key': API_KEY,
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert QA automation engineer specialising in Playwright.',
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.2,
                max_tokens: 1500,
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Azure AI error ${response.status}: ${text}`);
        }

        const data    = await response.json();
        const content = data?.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('Azure AI returned empty response for failure analysis');
        }

        logInfo('Failure analysis complete');
        return content;

    } catch (err) {
        logError(`Failure analysis failed: ${err.message}`);
        return `Analysis unavailable: ${err.message}`;
    }
};