
import React from 'react';
import { Test, Difficulty, QuestionType, Question } from '../types';
import { Button } from './Button';
import { ArrowLeft, Printer, Send, Edit3, ShieldCheck, ListChecks } from 'lucide-react';

interface TestPreviewProps {
  test: Test;
  onBack: () => void;
  onAssign: () => void;
}

export const TestPreview: React.FC<TestPreviewProps> = ({ test, onBack, onAssign }) => {
  // Group questions by type
  const sections: Record<string, Question[]> = test.questions.reduce((acc: Record<string, Question[]>, q: Question) => {
    const typeKey = q.type as string;
    if (!acc[typeKey]) acc[typeKey] = [];
    acc[typeKey].push(q);
    return acc;
  }, {});

  const handlePrint = () => {
    window.print();
  };

  const testCode = React.useMemo(() => Math.floor(100 + Math.random() * 900), []);

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 sm:px-0">
      {/* Action Bar - Hidden during print */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 sticky top-20 bg-slate-50/90 backdrop-blur py-4 z-30 gap-4 no-print">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Quay lại Dashboard</span>
        </button>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none bg-white" onClick={handlePrint}>
            <Printer className="w-4 h-4" /> In đề thi (Giấy A4)
          </Button>
          <Button variant="primary" className="flex-1 md:flex-none" onClick={onAssign}>
            <Send className="w-4 h-4" /> Giao cho lớp {test.assignedClass}
          </Button>
        </div>
      </div>

      <div className="space-y-10">
        {/* Matrix Section - Standard for Teachers */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 no-print">
          <h3 className="flex items-center gap-2 font-black text-slate-800 uppercase text-sm mb-4 tracking-tight">
            <ListChecks className="w-5 h-5 text-indigo-600" /> 
            Ma trận đặc tả đề thi (Chuẩn 5512)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(Difficulty).map(([key, label]) => {
              const count = test.questions.filter(q => q.difficulty === label).length;
              const percent = ((count / test.questions.length) * 100).toFixed(0);
              return (
                <div key={key} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{label}</p>
                  <p className="text-2xl font-black text-slate-800">{count} <span className="text-xs text-slate-400">câu</span></p>
                  <div className="w-full bg-slate-200 h-1 mt-2 rounded-full">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* The "Paper" Exam - optimized for print */}
        <div className="bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none">
          <div className="p-8 md:p-16 print:p-0">
            
            {/* Header Section */}
            <div className="grid grid-cols-2 gap-4 mb-8 text-sm md:text-base">
              <div className="text-center space-y-1">
                <p className="font-bold uppercase underline decoration-1 underline-offset-4">TRƯỜNG THCS ĐÔNG TRÀ</p>
                <p className="text-xs mt-4">Họ và tên: .....................................................</p>
                <p className="text-xs text-left pl-4">Lớp: ............................................................</p>
              </div>
              <div className="text-center space-y-1 border-l border-slate-300 print:border-slate-800 pl-4">
                <p className="font-bold">ĐỀ KIỂM TRA {test.title.toUpperCase()}</p>
                <p className="font-bold">NĂM HỌC 2024 - 2025</p>
                <p>Môn: TIẾNG ANH {test.grade}</p>
                <p>Thời gian làm bài: {test.duration} phút</p>
              </div>
            </div>

            <div className="text-center mb-10 border-y py-2 border-slate-200 print:border-slate-800">
              <p className="font-black text-xl tracking-widest uppercase">MÃ ĐỀ: {testCode}</p>
            </div>

            {/* Exam Questions Section */}
            <div className="space-y-10">
              {Object.entries(sections).map(([type, qs], sIdx) => (
                <div key={type} className="space-y-4">
                  <div className="flex items-baseline gap-2 border-b border-slate-100 print:border-slate-800 pb-1">
                    <h3 className="font-black text-slate-900 uppercase text-sm">
                      PHẦN {sIdx + 1}: {type.toUpperCase()}
                    </h3>
                  </div>
                  
                  <div className="space-y-6">
                    {(qs as Question[]).map((q, qIdx) => (
                      <div key={q.id} className="relative">
                        {q.passage && (
                          <div className="mb-4 p-5 bg-slate-50 print:bg-white rounded-xl border border-slate-200 print:border-slate-800 italic text-slate-700 print:text-black leading-relaxed text-sm">
                            <p className="font-bold mb-2 not-italic">Read the following passage and mark the letter A, B, C, or D on your answer sheet to indicate the correct answer to each of the questions.</p>
                            {q.passage}
                          </div>
                        )}

                        <div className="flex gap-2 items-start">
                          <span className="font-bold min-w-[5rem] text-sm">Câu {test.questions.indexOf(q) + 1}:</span>
                          <div className="flex-1">
                            <p className="font-medium text-slate-800 mb-3 text-sm">{q.content}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                              {Object.entries(q.options).map(([key, val]) => (
                                <div key={key} className="flex items-start gap-2">
                                  <span className="font-bold">{key}.</span>
                                  <span>{val}</span>
                                </div>
                              ))}
                            </div>

                            {/* Teacher's Key & Explanation - Hidden during print */}
                            <div className="no-print mt-2 bg-emerald-50 p-4 rounded-2xl border-l-4 border-emerald-400 text-[11px] leading-relaxed">
                              <p className="text-emerald-900 mb-1">
                                <span className="font-black uppercase tracking-tighter">Đáp án: {q.correctAnswer}</span> | <span className="font-bold">Mức độ: {q.difficulty}</span>
                              </p>
                              <p className="text-emerald-700 italic font-medium">Giải thích: {q.explanation}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center border-t border-slate-200 print:border-slate-800 pt-8 italic text-slate-500 print:text-black">
              <p className="font-bold">--- HẾT ---</p>
              <p className="text-[10px] mt-2 uppercase">(Giáo viên coi thi không giải thích gì thêm)</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { margin: 1.5cm; }
          .print\:text-black { color: black !important; }
          .print\:border-slate-800 { border-color: #1e293b !important; }
        }
      `}</style>
    </div>
  );
};
