import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set up pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export const fileService = {
  async extractText(file: File): Promise<string> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'pdf') {
      return this.extractFromPdf(file);
    } else if (extension === 'docx' || extension === 'doc') {
      return this.extractFromDocx(file);
    } else {
      return file.text();
    }
  },

  async extractFromPdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  },

  async extractFromDocx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }
};
