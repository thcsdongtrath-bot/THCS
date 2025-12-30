
import React, { useState } from 'react';
import { Button } from './Button';
import { generateEnglishTest } from '../geminiService';
import { Test, Difficulty } from '../types';
import { Sparkles, BookOpen, ShieldCheck, AlertCircle } from 'lucide-react';

interface TestGeneratorProps {
  onTestCreated: (test: Test) => void;
}

export const TestGenerator: React.FC<TestGeneratorProps> = ({ onTestCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState({
    grade: 6,
    topic: 'Unit 1: My New School',
    level: 'Chuẩn (Bám sát SGK Global Success)',
    duration: 45
  });

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateEnglishTest(config.grade, config.topic, config.level);
      
      if (!result.questions || result.questions.length === 0) {
        throw new Error("Không thể trích xuất câu hỏi từ dữ liệu AI.");
      }

      const newTest: Test = {
        id: Math.random().toString(36).substr(2, 9),
        title: result.title || `Đề kiểm tra Tiếng Anh lớp ${config.grade} - ${config.topic}`,
        grade: config.grade,
        topic: config.topic,
        duration: config.duration,
        questions: result.questions,
        createdAt: new Date().toISOString(),
        assignedClass: `${config.grade}A1`
      };
      
      onTestCreated(newTest);
    } catch (error: any) {
      console.error("Lỗi khi tạo đề:", error);
      setError("Không thể tạo đề thi ngay lúc này. Thầy vui lòng kiểm tra kết nối mạng hoặc thử lại với chủ đề ngắn gọn hơn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <BookOpen className="w-32 h-32 text-indigo-600" />
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="bg-indigo-100 p-2 rounded-xl">
            <Sparkles className="text-indigo-600 w-6 h-6" />
        </div>
        <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Trợ lý Soạn đề & Giáo án</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Thiết lập Ma trận chuẩn 5512</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đối tượng Khối lớp</label>
          <select 
            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700"
            value={config.grade}
            onChange={(e) => setConfig({...config, grade: parseInt(e.target.value)})}
          >
            {[6, 7, 8, 9].map(g => <option key={g} value={g}>Lớp {g} (THCS)</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thời lượng (Phút)</label>
          <input 
            type="number" 
            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700"
            value={config.duration}
            onChange={(e) => setConfig({...config, duration: parseInt(e.target.value)})}
          />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nội dung / Chủ đề bài học</label>
          <input 
            type="text" 
            placeholder="Ví dụ: Unit 2: My House, Comparison, ..."
            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700"
            value={config.topic}
            onChange={(e) => setConfig({...config, topic: e.target.value})}
          />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Yêu cầu sư phạm bổ sung</label>
          <select 
            className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700"
            value={config.level}
            onChange={(e) => setConfig({...config, level: e.target.value})}
          >
            <option>Chuẩn (Bám sát SGK Global Success)</option>
            <option>Nâng cao (Bồi dưỡng HSG)</option>
            <option>Ôn tập (Trọng tâm kiến thức cơ bản)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 text-red-700 text-sm font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
        </div>
      )}

      <div className="bg-indigo-50/50 p-5 rounded-2xl mb-8 flex items-start gap-4 border border-indigo-100">
        <ShieldCheck className="w-6 h-6 text-indigo-600 mt-1" />
        <div>
            <p className="text-sm font-bold text-indigo-900">Cam kết quy chuẩn CV 5512</p>
            <p className="text-xs text-indigo-700 leading-relaxed">Đề thi sẽ bao gồm đầy đủ ma trận 4 mức độ tư duy, tích hợp bài đọc hiểu và giải thích đáp án sư phạm chi tiết.</p>
        </div>
      </div>

      <Button 
        variant="primary" 
        className="w-full py-5 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100" 
        onClick={handleGenerate}
        loading={loading}
      >
        {loading ? 'AI đang biên soạn giáo án...' : 'Thiết lập đề thi ngay'}
      </Button>

      {loading && (
        <div className="mt-6 flex flex-col items-center gap-2">
            <div className="flex gap-1">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
            </div>
            <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                Đang tổng hợp dữ liệu từ ngân hàng đề và chương trình mới...
            </p>
        </div>
      )}
    </div>
  );
};
