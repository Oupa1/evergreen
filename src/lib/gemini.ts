import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export async function generateLearnerReport(studentName: string, subjects: any[]) {
  if (!apiKey) {
    return "AI report generation is currently unavailable. Please configure the Gemini API key.";
  }

  const model = "gemini-3-flash-preview";
  const prompt = `
    Generate a short, professional academic report for a student named ${studentName}.
    Based on the following subject performance (marks are percentages):
    ${subjects.map(s => `${s.name}: ${s.score}%`).join(', ')}

    The report should:
    1. Be concise (2-3 sentences).
    2. Identify strengths (subjects with high marks).
    3. Identify challenges (subjects with low marks).
    4. Provide a constructive recommendation.
    5. Use the format: "[Name] is [strength description]. However, [Name] has a challenge with [challenge description]. We recommend [recommendation]."
    Return ONLY the text.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Report generation failed.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate AI report.";
  }
}

export async function generateQuizFromImage(base64Image: string, mimeType: string) {
  if (!apiKey) {
    throw new Error("AI quiz generation is currently unavailable. Please configure the Gemini API key.");
  }

  const model = "gemini-3-flash-preview";
  const prompt = `
    Analyze the uploaded image (which could be a textbook page, a handwritten note, or a worksheet) and generate a structured quiz or puzzle based on its content.
    
    The output must be a JSON object with the following structure:
    {
      "name": "A catchy title for the quiz",
      "description": "A brief description of what the quiz covers",
      "total_marks": 10,
      "questions": [
        {
          "question": "The question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "The correct option text"
        }
      ]
    }
    
    Generate at least 5 questions if possible. If the image is a puzzle, adapt the structure accordingly.
    Return ONLY the JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          inlineData: {
            data: base64Image.split(',')[1] || base64Image,
            mimeType: mimeType
          }
        },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });
    
    if (!response.text) throw new Error("No response from AI");
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to generate quiz from image.");
  }
}
