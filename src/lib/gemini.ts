async function callGemini(contents: any, config?: any): Promise<string> {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gemini-2.5-flash", contents, config }),
  });
  const data = await res.json() as { text?: string; error?: string; retryAfter?: number };
  if (!res.ok || data.error) {
    const err: any = new Error(data.error || "Gemini API error.");
    err.retryAfter = data.retryAfter;
    err.status = res.status;
    throw err;
  }
  return data.text || "";
}

export async function generateLearnerReport(studentName: string, subjects: any[]) {
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
    return await callGemini(prompt);
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate AI report.";
  }
}

export async function generateCAPSLessonPlan(
  subject: string,
  grade: string,
  term: string,
  week: number,
  duration: number,
  topic?: string
) {
  const topicInstruction = topic
    ? `The teacher wants to focus on this topic/concept: "${topic}". Use this as the primary CAPS-aligned topic.`
    : `Automatically determine the appropriate CAPS topic and sub-topic for ${subject} Grade ${grade} ${term} Week ${week}.`;

  const prompt = `You are an expert South African educator specialising in the CAPS (Curriculum and Assessment Policy Statement) curriculum.

Generate a detailed, professionally structured CAPS-aligned lesson plan for:
- Subject: ${subject}
- Grade: ${grade}
- Term: ${term}
- Week: ${week}
- Duration: ${duration} minutes
- ${topicInstruction}

Return ONLY a valid JSON object with this exact structure (no markdown, no code fences):
{
  "capsAlignment": {
    "topic": "Exact CAPS topic name",
    "subTopic": "Specific sub-topic or concept",
    "strand": "The CAPS content area/strand"
  },
  "priorKnowledge": "What learners should already know before this lesson",
  "learningObjectives": [
    "By the end of this lesson, learners will be able to...",
    "Learners will demonstrate...",
    "Learners will apply..."
  ],
  "resources": ["CAPS-approved textbook", "Whiteboard", "Worksheets", "..."],
  "phases": [
    {
      "name": "Introduction / Activation of Prior Knowledge",
      "duration": "5 minutes",
      "teacherActivities": ["Greet learners and settle the class", "Ask a warm-up question related to prior knowledge", "..."],
      "learnerActivities": ["Respond to teacher questions", "Share prior knowledge", "..."]
    },
    {
      "name": "Lesson Development / Direct Instruction",
      "duration": "${Math.round(duration * 0.55)} minutes",
      "teacherActivities": ["Introduce the new concept with examples", "Use the board to demonstrate", "Explain key terminology", "..."],
      "learnerActivities": ["Listen and take notes", "Complete guided examples in their workbooks", "Ask clarifying questions", "..."]
    },
    {
      "name": "Guided Practice",
      "duration": "${Math.round(duration * 0.25)} minutes",
      "teacherActivities": ["Provide practice exercises", "Circulate and provide support", "Address misconceptions", "..."],
      "learnerActivities": ["Complete practice tasks", "Work in pairs or small groups", "Check each other's work", "..."]
    },
    {
      "name": "Consolidation / Conclusion",
      "duration": "5 minutes",
      "teacherActivities": ["Summarise key points", "Check for understanding using questioning", "Set homework", "..."],
      "learnerActivities": ["Respond to consolidation questions", "Write down homework", "Reflect on learning", "..."]
    }
  ],
  "assessment": {
    "type": "Formative",
    "methods": ["Observation during activities", "Questioning technique", "Classwork marking"],
    "successCriteria": ["Learner can correctly...", "Learner demonstrates understanding of...", "..."]
  },
  "homework": "Brief description of homework task or 'No formal homework — learners complete classwork'",
  "differentiation": {
    "support": "Specific strategies and modified tasks for learners who need extra support",
    "extension": "Enrichment activities for learners who complete work early or need more challenge"
  },
  "teacherReflection": "What worked well? What would I change? Were the objectives achieved?"
}`;

  try {
    const text = await callGemini(prompt);
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Gemini Lesson Plan Error:", error);
    throw new Error("Failed to generate lesson plan. Please try again.");
  }
}

export async function generateCAPSTermPlan(
  subject: string,
  grade: string,
  term: string,
  totalWeeks: number,
  topic?: string
) {
  const topicInstruction = topic
    ? `The teacher wants the term to focus on: "${topic}". Build a coherent week-by-week progression around this focus.`
    : `Use the official CAPS curriculum sequence for ${subject} ${grade} ${term}.`;

  const prompt = `You are an expert South African educator specialising in the CAPS (Curriculum and Assessment Policy Statement) curriculum.

Generate a comprehensive, CAPS-aligned FULL TERM lesson plan overview for:
- Subject: ${subject}
- Grade: ${grade}
- Term: ${term}
- Total Weeks: ${totalWeeks}
- ${topicInstruction}

Return ONLY a valid JSON object with this exact structure (no markdown, no code fences):
{
  "termOverview": {
    "subject": "${subject}",
    "grade": "${grade}",
    "term": "${term}",
    "totalWeeks": ${totalWeeks},
    "focus": "One-sentence summary of what this term covers",
    "strand": "Main CAPS content area or strand for this term",
    "formalAssessmentTasks": ["e.g. Test Week 5", "Assignment Week 8", "..."],
    "teachingApproach": "Brief description of the main pedagogical approach for this term"
  },
  "weeklyPlans": [
    {
      "week": 1,
      "topic": "Exact CAPS topic",
      "subTopic": "Specific concept or sub-topic",
      "objectives": ["Learners will be able to...", "Learners will demonstrate..."],
      "keyActivities": "Brief description of main teacher and learner activities",
      "resources": ["Textbook p. XX", "Worksheet", "..."],
      "assessment": "Type and method of assessment for this week",
      "homework": "Brief homework task or 'Classwork completion'"
    }
  ],
  "termReflection": "Space for teacher to note what worked, what to adjust, and whether CAPS pace was maintained across the term"
}

Generate a weeklyPlan entry for EVERY week from 1 to ${totalWeeks}. Ensure topics follow the official CAPS sequence and build progressively across the term.`;

  try {
    const text = await callGemini(prompt);
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Gemini Term Plan Error:", error);
    throw new Error("Failed to generate term plan. Please try again.");
  }
}

export async function generateQuizFromImage(base64Image: string, mimeType: string) {
  const prompt = `
    Analyse the uploaded image (which could be a textbook page, a handwritten note, or a worksheet) and generate a structured quiz or puzzle based on its content.
    
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

  const contents = [
    {
      inlineData: {
        data: base64Image.split(',')[1] || base64Image,
        mimeType,
      },
    },
    { text: prompt },
  ];

  try {
    const text = await callGemini(contents, { responseMimeType: "application/json" });
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to generate quiz from image.");
  }
}
