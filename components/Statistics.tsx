
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { Submission, Test, Difficulty } from '../types';
import { User, Clock, Award, History } from 'lucide-react';

interface StatisticsProps {
  submissions: Submission[];
  tests: Test[];
}

export const Statistics: React.FC<StatisticsProps> = ({ submissions, tests }) => {
  // 1. Tính toán phân phối điểm số thực tế
  const scoreData = [
    { range: '0-3', count: submissions.filter(s => s.score < 3.5).length },
    { range: '4-5', count: submissions.filter(s => s.score >= 3.5 && s.score < 5).length },
    { range: '5-7', count: submissions.filter(s => s.score >= 5 && s.score < 7).length },
    { range: '7-8', count: submissions.filter(s => s.score >= 7 && s.score < 9).length },
    { range: '9-10', count: submissions.filter(s => s.score >= 9).length },
  ];

  // 2. Tính toán tỉ lệ năng lực (Ma trận 5512) thực tế
  // Duyệt qua tất cả bài nộp, đối chiếu với đề tương ứng để xem học sinh làm đúng bao nhiêu câu ở mỗi mức độ
  const competencyStats = {
    [Difficulty.RECALL]: { correct: 0, total: 0 },
    [Difficulty.COMPREHENSION]: { correct: 0, total: 0 },
    [Difficulty.APPLICATION]: { correct: 0, total: 0 },
    [Difficulty.HIGH_APPLICATION]: { correct: 0, total: 0 },
  };

  submissions.forEach(sub => {
    const test = tests.find(t => t.id === sub.testId);
    if (!test) return;

    test.questions.forEach(q => {
      competencyStats[q.difficulty].total++;
      if (sub.answers[q.id] === q.correctAnswer) {
        competencyStats[q.difficulty].correct++;
      }
    });
  });

  const competencyData = Object.entries(competencyStats).map(([name, stats]) => ({
    name,
    value: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
  }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

  const avgScore = submissions.length > 0 
    ? (submissions.reduce((acc, s) => acc + s.score, 0) / submissions.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-8">
      {/* Thẻ tóm tắt */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Điểm trung bình</p>
            <h3 className="text-3xl font-black text-slate-800">{avgScore}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Số học sinh đã nộp</p>
            <h3 className="text-3xl font-black text-slate-800">{submissions.length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Tỉ lệ đạt (>= 5)</p>
            <h3 className="text-3xl font-black text-slate-800">
              {submissions.length > 0 ? ((submissions.filter(s => s.score >= 5).length / submissions.length) * 100).toFixed(0) : 0}%
            </h3>
          </div>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <h4 className="font-black text-slate-800 mb-6 text-sm uppercase tracking-tight">Phân phối điểm số hệ thống</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <h4 className="font-black text-slate-800 mb-6 text-sm uppercase tracking-tight">Đánh giá Năng lực (Ma trận 5512)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={competencyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {competencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontWeight: 600, fontSize: '11px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-4 font-bold uppercase italic">Chỉ số dựa trên trung bình cộng tỉ lệ trả lời đúng từng câu theo mức độ</p>
        </div>
      </div>

      {/* Bảng điểm chi tiết */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-black text-slate-800 text-sm uppercase flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" /> Danh sách bài nộp gần đây
            </h4>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Học sinh</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Đề thi</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Điểm số</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thời gian</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {submissions.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-medium italic">Chưa có học sinh nào nộp bài.</td>
                        </tr>
                    ) : (
                        [...submissions].reverse().map(sub => {
                            const test = tests.find(t => t.id === sub.testId);
                            return (
                                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800">{sub.studentName}</p>
                                        <p className="text-[10px] text-slate-400">ID: {sub.studentId.split('-').pop()}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-slate-600 line-clamp-1">{test?.title || 'Đề đã xóa'}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full font-black text-xs ${sub.score >= 8 ? 'bg-emerald-100 text-emerald-700' : sub.score >= 5 ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-700'}`}>
                                            {sub.score}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-xs text-slate-400 font-medium">
                                        {new Date(sub.completedAt).toLocaleString('vi-VN')}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
