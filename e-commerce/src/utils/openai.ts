import axios from "axios";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

/**
 * Sends a prompt to the OpenAI API and returns the assistant's response.
 * @param prompt The user's message or question.
 * @param options Optional: override model, system prompt, etc.
 */
export async function getOpenAIResponse(
  prompt: string,
  options?: {
    model?: string;
    systemPrompt?: string;
    max_tokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const model = options?.model || "gpt-4o"; // or "gpt-3.5-turbo"
  const systemPrompt =
    options?.systemPrompt ||
    "You are Makena, a friendly, helpful shopping assistant for an e-commerce site. Always be helpful, concise, and positive.";
  const max_tokens = options?.max_tokens || 300;
  const temperature = options?.temperature ?? 0.7;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_tokens,
        temperature,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    return "Sorry, I couldn't get a response from OpenAI.";
  }
}

/**
 * Example helper for product description prompt.
 */
export function buildProductDescriptionPrompt(productName: string, productDetails?: string) {
  return `Describe the product \"${productName}\" for a customer. ${productDetails ? "Details: " + productDetails : ""}`;
} 