export const cleanAIResponse = (response) => {
    return response
        .replace(/```javascript/g, '')
        .replace(/```/g, '')
        .replace(/const\s+\{\s*test,\s*expect\s*\}\s*=\s*require\([^)]+\);/g, 
            "import { test, expect } from '@playwright/test';")
        .trim();
};