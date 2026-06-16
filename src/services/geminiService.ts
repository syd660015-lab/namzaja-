/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const geminiService = {
  /**
   * Parses exam text into a structured JSON object.
   */
  async parseExamText(text: string): Promise<{ title: string; subject: string; questions: any[] }> {
    const response = await fetch('/api/gemini/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'فشلت عملية تحليل النص بواسطة الذكاء الاصطناعي.');
    }

    return response.json();
  },

  /**
   * Generates a shuffled version of the questions and options.
   */
  async shuffleExam(questions: any[], version: 'A' | 'B' | 'C'): Promise<any[]> {
    const response = await fetch('/api/gemini/shuffle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ questions, version }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'فشلت عملية تبديل وترتيب الأسئلة.');
    }

    return response.json();
  }
};
