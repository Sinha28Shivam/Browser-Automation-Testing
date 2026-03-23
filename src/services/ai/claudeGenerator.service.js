// import fetch from 'node-fetch';

export const generateTestWithAI = async (payload) => {

    const prompt = `
Generate a Playwright test using JavaScript ES modules.

STRICT RULES:
- Use: import { test, expect } from '@playwright/test';
- DO NOT use require()
- DO NOT wrap code in markdown (no \`\`\`)
- Return ONLY raw code

Test Requirements:
- Include:
  1. Positive test (valid login)
  2. Negative test (invalid password)
  3. Negative test (invalid username)


URL:
${payload.url}

Selectors:
${JSON.stringify(payload.selectors, null, 2)}

Validation Rules:
- Use: await expect(page).toHaveURL(...)
- Use: await expect(locator).toBeVisible()
- Use: await expect(locator).toContainText()

Write clean, correct, executable Playwright code.
`;

    const response = await fetch(
        `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-02-15-preview`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': process.env.AZURE_OPENAI_API_KEY
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: "You are an expert Playwright automation engineer."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            })
        }
    );

    const data = await response.json();
    console.log("🔍 Azure AI RAW RESPONSE:", JSON.stringify(data, null, 2));

    return data.choices?.[0]?.message?.content || '';
};