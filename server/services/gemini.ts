// PWC GenAI API configuration
const PWC_GENAI_API_URL = 'https://genai-sharedservice-americas.pwc.com/completions';
const API_KEY = process.env.PWC_API_KEY || process.env.API_KEY || "";

interface PWCGenAIRequest {
  model: string;
  prompt: string;
  presence_penalty: number;
  seed: number;
  stop: string | null;
  stream: boolean;
  stream_options: null;
  temperature: number;
  top_p: number;
}

interface PWCGenAIResponse {
  // Add response interface based on actual API response structure
  choices?: Array<{
    text?: string;
    message?: {
      content?: string;
    };
  }>;
  content?: string;
}

export interface GeneratedPageContent {
  html: string;
  css: string;
  js: string;
}

export async function generatePageWithAI(
  prompt: string, 
  pageType: string,
  options?: {
    colorScheme?: string;
    layoutStyle?: string;
    includeResponsive?: boolean;
    includeInteractive?: boolean;
    includeSEO?: boolean;
  }
): Promise<GeneratedPageContent> {
  try {
    const systemPrompt = `You are an expert web developer and designer. Generate a complete, professional webpage based on the user's requirements.

Requirements:
- Generate clean, semantic HTML5
- Create modern, responsive CSS (use CSS Grid and Flexbox)
- Include minimal, functional JavaScript if needed
- Ensure accessibility (ARIA labels, semantic elements)
- Use modern design principles
- Make it mobile-responsive by default
- Include proper meta tags and SEO elements
- Use professional color schemes and typography

Return ONLY a JSON object with this exact structure:
{
  "html": "complete HTML document with DOCTYPE, head, and body",
  "css": "complete CSS styles",
  "js": "JavaScript code if needed, or empty string"
}

Do not include any markdown formatting or code blocks in your response.`;

    let enhancedPrompt = `Create a ${pageType} page: ${prompt}`;
    
    if (options?.colorScheme) {
      enhancedPrompt += `\n- Use color scheme: ${options.colorScheme}`;
    }
    if (options?.layoutStyle) {
      enhancedPrompt += `\n- Layout style: ${options.layoutStyle}`;
    }
    if (options?.includeResponsive) {
      enhancedPrompt += `\n- Make it fully responsive for mobile, tablet, and desktop`;
    }
    if (options?.includeInteractive) {
      enhancedPrompt += `\n- Add interactive elements and animations`;
    }
    if (options?.includeSEO) {
      enhancedPrompt += `\n- Include proper SEO meta tags and structured data`;
    }

    // Combine system prompt and user prompt for PWC API
    const fullPrompt = `${systemPrompt}\n\nUser Request: ${enhancedPrompt}`;

    const requestBody: PWCGenAIRequest = {
      model: "vertex_ai.gemini-2.0-flash",
      prompt: fullPrompt,
      presence_penalty: 0,
      seed: 25,
      stop: null,
      stream: false,
      stream_options: null,
      temperature: 1,
      top_p: 1
    };

    const response = await fetch(PWC_GENAI_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'API-Key': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`PWC GenAI API error: ${response.status} ${response.statusText}`);
    }

    const responseData: PWCGenAIResponse = await response.json();
    // Extract text content from PWC API response structure
    let rawJson = responseData.choices?.[0]?.text || 
                 responseData.choices?.[0]?.message?.content || 
                 responseData.content || 
                 "";
    if (!rawJson) {
      throw new Error("Empty response from AI model");
    }

    // Clean up markdown code blocks that PWC API returns
    if (rawJson.includes('```')) {
      // Extract JSON from markdown code blocks
      const jsonMatch = rawJson.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        rawJson = jsonMatch[1];
      } else {
        // Fallback - remove all backticks
        rawJson = rawJson.replace(/`{3,}(?:json)?/gi, '').replace(/`{3,}/g, '').trim();
      }
    }

    const generatedContent: GeneratedPageContent = JSON.parse(rawJson);
    
    // Validate the response structure
    if (!generatedContent.html || typeof generatedContent.html !== 'string') {
      throw new Error("Invalid HTML content generated");
    }
    if (!generatedContent.css || typeof generatedContent.css !== 'string') {
      throw new Error("Invalid CSS content generated");
    }
    if (typeof generatedContent.js !== 'string') {
      generatedContent.js = ''; // Default to empty string if not provided
    }

    return generatedContent;
  } catch (error) {
    console.error("Error generating page with AI:", error);
    throw new Error(`Failed to generate page: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generatePageThumbnail(html: string, css: string): Promise<string> {
  // For now, return a placeholder base64 image
  // In a real implementation, you might use a headless browser to capture screenshots
  return "data:image/svg+xml;base64," + Buffer.from(`
    <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="150" fill="#f1f5f9"/>
      <rect x="20" y="20" width="160" height="20" fill="#e2e8f0"/>
      <rect x="20" y="50" width="120" height="15" fill="#cbd5e1"/>
      <rect x="20" y="75" width="140" height="15" fill="#cbd5e1"/>
      <rect x="20" y="110" width="60" height="25" fill="#3b82f6"/>
    </svg>
  `).toString('base64');
}
