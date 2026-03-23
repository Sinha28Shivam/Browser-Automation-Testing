import { logInfo, logError } from '../../utils/logger.js';

// ─────────────────────────────────────────────
// Azure AI Foundry — GitHub Models / Llama endpoint
// Set these in your backend .env:
//   AZURE_INFERENCE_ENDPOINT=https://<your-resource>.services.ai.azure.com/models
//   AZURE_INFERENCE_KEY=<your-key>
//   AZURE_MODEL_NAME=Meta-Llama-3.3-70B-Instruct   (or whichever you subscribed to)
// ─────────────────────────────────────────────

const ENDPOINT   = process.env.AZURE_INFERENCE_ENDPOINT;
const API_KEY    = process.env.AZURE_INFERENCE_KEY;
const MODEL_NAME = process.env.AZURE_MODEL_NAME || 'Llama-3.3-70B-Instruct';

const SYSTEM_PROMPT = `You are an expert QA automation engineer specialising in Playwright (JavaScript/ESM).

Your ONLY job is to output a single valid Playwright test file — nothing else.
Do NOT output markdown fences, explanations, or commentary.
Output raw JavaScript starting with: import { test, expect } from '@playwright/test';

Rules you MUST follow:
1. Use ESM imports (import, not require).
2. Wrap every test in a try/catch. On catch: take a screenshot then re-throw.
3. Screenshot paths use the testId token exactly as given, e.g.:
     path: 'runtime/artifacts/<TESTID>/my-screenshot.png'
4. Cover at least: one positive (happy-path) test AND at least two negative tests.
5. Use the exact selectors provided. If none are provided, use sensible defaults.
6. Assertions must be realistic — check URL patterns, visible text, or element visibility.
7. Never hard-code credentials that differ from what the scenario describes.
8. The test.describe label must match the title provided.`;

function buildUserPrompt({ url, title, scenario, selectors, testId }) {
    const selectorBlock = selectors
        ? Object.entries(selectors)
              .filter(([, v]) => v)
              .map(([k, v]) => `  ${k}: "${v}"`)
              .join('\n')
        : '  (not provided — use sensible defaults)';

    return `Generate a complete Playwright test file for the following:

Title: ${title}
URL: ${url}
Scenario: ${scenario}
Test ID (use in screenshot paths): ${testId}
Selectors:
${selectorBlock}

Output ONLY the JavaScript file content.`;
}

// ─────────────────────────────────────────────
// Call Azure AI Foundry (OpenAI-compatible chat endpoint)
// ─────────────────────────────────────────────
async function callAzureLlama(messages) {
    if (!ENDPOINT || !API_KEY) {
        throw new Error(
            'Azure AI credentials missing. ' +
            'Set AZURE_INFERENCE_ENDPOINT and AZURE_INFERENCE_KEY in your backend .env'
        );
    }

    // Azure AI Foundry exposes an OpenAI-compatible endpoint
    const url = `${ENDPOINT.replace(/\/$/, '')}/chat/completions`;

    logInfo(`Calling Azure AI Foundry: ${url} (model: ${MODEL_NAME})`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
            // Azure AI Foundry also accepts api-key header as fallback
            'api-key': API_KEY,
        },
        body: JSON.stringify({
            model: MODEL_NAME,
            messages,
            temperature: 0.2,       // low temperature = more deterministic code
            max_tokens: 4096,
            top_p: 0.95,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Azure AI error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error('Azure AI returned an empty response');
    }

    return content;
}

// ─────────────────────────────────────────────
// Strip markdown fences the model may add
// ─────────────────────────────────────────────
function stripFences(raw) {
    return raw
        .replace(/^```[\w]*\n?/m, '')
        .replace(/\n?```$/m, '')
        .trim();
}

// ─────────────────────────────────────────────
// Main export — called by test.workflow.js
// ─────────────────────────────────────────────
export const generateTestScript = async ({ url, scenario, selectors, title }, testId) => {
    logInfo(`Generating test script via Azure AI Foundry for testId: ${testId}`);

    try {
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user',   content: buildUserPrompt({ url, title, scenario, selectors, testId }) },
        ];

        const raw = await callAzureLlama(messages);
        const script = stripFences(raw);

        logInfo(`Test script generated (${script.length} chars)`);
        return script;

    } catch (err) {
        logError(`Azure AI generation failed: ${err.message}`);
        logInfo('Falling back to template-based test generation');
        return fallbackTemplate({ url, title, scenario, selectors, testId });
    }
};

// ─────────────────────────────────────────────
// Fallback: template used if Azure AI is down
// ─────────────────────────────────────────────
function fallbackTemplate({ url, title, selectors, testId }) {
    const targetUrl   = url        || 'https://example.com';
    const userSel     = selectors?.username || '#username';
    const passSel     = selectors?.password || '#password';
    const btnSel      = selectors?.submit   || '#submit';
    const suiteTitle  = title      || 'Generated Test Suite';

    return `import { test, expect } from '@playwright/test';

test.describe('${suiteTitle}', () => {

    test('Positive: valid credentials', async ({ page }) => {
        try {
            await page.goto('${targetUrl}');
            await page.fill('${userSel}', 'student');
            await page.fill('${passSel}', 'Password123');
            await page.click('${btnSel}');
            await expect(page).toHaveURL(/logged-in-successfully/);
            await expect(page.locator('h1')).toContainText('Logged In Successfully');
            await page.screenshot({ path: 'runtime/artifacts/${testId}/positive-success.png' });
        } catch (error) {
            await page.screenshot({ path: 'runtime/artifacts/${testId}/positive-failure.png' });
            throw error;
        }
    });

    test('Negative: invalid password', async ({ page }) => {
        try {
            await page.goto('${targetUrl}');
            await page.fill('${userSel}', 'student');
            await page.fill('${passSel}', 'WrongPassword!!!');
            await page.click('${btnSel}');
            const err = page.locator('#error');
            await expect(err).toBeVisible();
            await expect(err).toContainText('Your password is invalid!');
            await page.screenshot({ path: 'runtime/artifacts/${testId}/invalid-password.png' });
        } catch (error) {
            await page.screenshot({ path: 'runtime/artifacts/${testId}/invalid-password-failure.png' });
            throw error;
        }
    });

    test('Negative: invalid username', async ({ page }) => {
        try {
            await page.goto('${targetUrl}');
            await page.fill('${userSel}', 'fakeUser999');
            await page.fill('${passSel}', 'Password123');
            await page.click('${btnSel}');
            const err = page.locator('#error');
            await expect(err).toBeVisible();
            await expect(err).toContainText('Your username is invalid!');
            await page.screenshot({ path: 'runtime/artifacts/${testId}/invalid-username.png' });
        } catch (error) {
            await page.screenshot({ path: 'runtime/artifacts/${testId}/invalid-username-failure.png' });
            throw error;
        }
    });
});
`;
}