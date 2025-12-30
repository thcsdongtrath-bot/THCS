
import { GoogleGenAI, Type } from "@google/genai";

export const generateEnglishTest = async (grade: number, topic: string, level: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Bạn là một chuyên gia khảo thí Tiếng Anh THCS tại Việt Nam, am hiểu sâu sắc Công văn 5512/BGDĐT.
    Hãy lập một MA TRẬN ĐỀ KIỂM TRA và tạo ĐỀ THI TRẮC NGHIỆM cho học sinh lớp ${grade}.
    Chủ đề: "${topic}"
    Mức độ ưu tiên: ${level}
    Thời gian: 45-60 phút.

    Yêu cầu cấu trúc đề (Tổng chính xác 50 câu):
    1. PHONETICS (Phát âm & Trọng âm): 10 câu
    2. LANGUAGE FOCUS (Vocabulary, Grammar, Communication): 20 câu
    3. READING (Cloze test & Reading Comprehension): 15 câu
    4. WRITING (Error recognition & Sentence transformation - trắc nghiệm): 5 câu

    Tỉ lệ ma trận: Nhận biết (40%) - Thông hiểu (30%) - Vận dụng (20%) - Vận dụng cao (10%).

    Yêu cầu định dạng JSON phản hồi (Strict JSON):
    {
      "title": "Tên đề thi chuyên nghiệp",
      "matrix": "Mô tả ngắn gọn ma trận kiến thức theo 5512",
      "questions": [
        {
          "id": "uuid",
          "type": "Loại câu hỏi (Ngữ âm, Ngữ pháp, ...)",
          "difficulty": "Nhận biết/Thông hiểu/Vận dụng/Vận dụng cao",
          "content": "Nội dung câu hỏi",
          "passage": "Đoạn văn (nếu có)",
          "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
          "correctAnswer": "A/B/C/D",
          "explanation": "Giải thích chi tiết lý do chọn đáp án"
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI không trả về nội dung");

    // Làm sạch chuỗi JSON nếu bị bao bởi markdown
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
};

export const getAIFeedback = async (score: number, answers: any, questions: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Phân tích kết quả bài thi Tiếng Anh lớp ${questions[0]?.grade || 'THCS'}:
    - Điểm số: ${score}/10
    - Dữ liệu bài làm: ${JSON.stringify(answers)}
    Hãy viết một nhận xét sư phạm chuyên sâu (khoảng 150 từ) đánh giá đúng các kỹ năng (Listening/Reading/Use of English) và đưa ra lời khuyên học tập.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return response.text;
  } catch (error) {
    return "Hệ thống đang bận, Thầy vui lòng xem lại bảng điểm bên dưới.";
  }
};
