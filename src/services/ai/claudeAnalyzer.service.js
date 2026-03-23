// import fetch from 'node-fetch';

export const analyzeFailureWithAI = async (report, screenshotPath) => {

    const prompt = `
Analyze this Playwright test failure.

Report:
${JSON.stringify(report, null, 2)}

Screenshot path:
${screenshotPath}

Tasks:
1. Explain why test failed
2. Identify selector or logic issue
3. Suggest fix
4. Suggest improved code snippet

Be concise and technical.
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
                        content: "You are an expert QA automation engineer."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.2,
                max_tokens: 1500
            })
        }
    );

    const data = await response.json();

    return data.choices?.[0]?.message?.content || '';
};