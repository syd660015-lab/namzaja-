import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

// API Routes
app.post('/api/gemini/parse', async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }

    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Parse the following exam text into a structured JSON format. 
      Extract the exam title, the subject/field of study, AND a list of multiple-choice questions.
      Each question should have: 'text', 'options' (array of strings), and 'correctAnswerIndex' (if identifiable, else null).
      
      EXAM TEXT:
      ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subject: { type: Type.STRING, description: "The educational subject or field (e.g., Mathematics, History, Medicine)" },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswerIndex: { type: Type.NUMBER, nullable: true },
                  difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] },
                  bloomLevel: { type: Type.STRING, enum: ["remembering", "understanding", "applying", "analyzing", "evaluating", "creating"] }
                },
                required: ["text", "options"]
              }
            }
          },
          required: ["title", "subject", "questions"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      title: parsed.title || "بدون عنوان",
      subject: parsed.subject || "غير مصنف",
      questions: parsed.questions || []
    });
  } catch (err: any) {
    console.error('Parsing error:', err);
    return res.status(500).json({ error: err.message || 'Failed to parse exam text' });
  }
});

app.post('/api/gemini/shuffle', async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { questions, version } = req.body;
    if (!questions || !version) {
      return res.status(400).json({ error: 'Questions and version parameters are required' });
    }

    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are an expert examiner. Given a list of questions, return a new version (Version ${version}) where BOTH the order of questions AND the order of options within each question are shuffled randomly.
      Maintain the link to the correct answer.
      
      QUESTIONS:
      ${JSON.stringify(questions)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswerIndex: { type: Type.NUMBER },
              difficulty: { type: Type.STRING, nullable: true },
              bloomLevel: { type: Type.STRING, nullable: true }
            },
            required: ["id", "text", "options", "correctAnswerIndex"]
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || "[]");
    return res.json(parsed);
  } catch (err: any) {
    console.error('Shuffling error:', err);
    return res.status(500).json({ error: err.message || 'Failed to shuffle exam' });
  }
});

const isProduction = process.env.NODE_ENV === "production";

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

export default app;
