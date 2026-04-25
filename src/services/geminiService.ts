/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const geminiService = {
  /**
   * Parses exam text into a structured JSON object.
   */
  async parseExamText(text: string): Promise<{ title: string; subject: string; questions: any[] }> {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Complex task
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
    return {
      title: parsed.title || "بدون عنوان",
      subject: parsed.subject || "غير مصنف",
      questions: parsed.questions || []
    };
  },

  /**
   * Generates a shuffled version of the questions and options.
   */
  async shuffleExam(questions: any[], version: 'A' | 'B' | 'C'): Promise<any[]> {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
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

    return JSON.parse(response.text || "[]");
  }
};
