
import React, { useState, useEffect } from 'react';
import { 
  UserRole, User, Test, Submission, Question, Difficulty, QuestionType 
} from './types';
import { Button } from './components/Button';
import { TestGenerator } from './components/TestGenerator';
import { Statistics } from './components/Statistics';
import { TestPreview } from './components/TestPreview';
import { 
  ClipboardList, Users, PieChart, LogOut, Clock, Send, User as UserIcon, Lock,
  CheckCircle2, XCircle, Sparkles, Eye, FileSpreadsheet, AlertCircle, History, BarChart3, Radio
} from 'lucide-react';
import { getAIFeedback } from './geminiService';

const TEACHER_PASSWORD = 'dongtra_english';

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 'sample-1',
    type: QuestionType.GRAMMAR,
    difficulty: Difficulty.RECALL,
    content: "My new school ______ a large playground and many modern classrooms.",
    options: { A: "has", B: "have", C: "is having", D: "are having" },
    correctAnswer: 'A',
    explanation: "Chủ ngữ 'My new school' là danh từ số ít, nên động từ 'have' phải chia là 'has' ở thì Hiện tại đơn."
  },
  {
    id: 'sample-2',
    type: QuestionType.VOCABULARY,
    difficulty: Difficulty.COMPREHENSION,
    content: "Students usually ______ their homework after dinner.",
    options: { A: "make", B: "do", C: "play", D: "study" },
    correctAnswer: 'B',
    explanation: "Cụm từ cố định (Collocation): 'do homework' nghĩa là làm bài tập về nhà."
  }
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'landing' | 'dashboard' | 'test-taking' | 'results' | 'test-preview'>('landing');
  
  const [tests, setTests] = useState<Test[]>(() => {
    const saved = localStorage.getItem('edutest_tests');
    if (saved) return JSON.parse(saved);
    return [{
      id: 'mock-test-1',
      title: 'Kiểm tra khảo sát - Unit 1: My New School',
      grade: 6,
      topic: 'My New School',
      duration: 15,
      questions: SAMPLE_QUESTIONS,
      createdAt: new Date().toISOString(),
      assignedClass: '6A1'
    }];
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('edutest_submissions');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [latestResult, setLatestResult] = useState<Submission | null>(null);

  // Sync dữ liệu giữa các tab (Quan trọng để GV thấy bài nộp ngay lập tức)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'edutest_submissions' && e.newValue) {
        setSubmissions(JSON.parse(e.newValue));
      }
      if (e.key === 'edutest_tests' && e.newValue) {
        setTests(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('edutest_tests', JSON.stringify(tests));
  }, [tests]);

  useEffect(() => {
    localStorage.setItem('edutest_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    let timer: any;
    if (view === 'test-taking' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && view === 'test-taking') {
      handleSubmitTest();
    }
    return () => clearInterval(timer);
  }, [view, timeLeft]);

  const handleLogin = (role: UserRole) => {
    setError(null);
    const finalName = loginName.trim() || (role === UserRole.TEACHER ? 'Thầy Lê Vũ Thương' : 'Học sinh');

    if (role === UserRole.TEACHER) {
      if (!password) {
        setError("Vui lòng nhập mật khẩu giáo viên.");
        return;
      }
      if (password !== TEACHER_PASSWORD) {
        setError("Mật khẩu giáo viên không chính xác.");
        return;
      }
    }

    setUser({
      id: Math.random().toString(),
      name: finalName,
      role,
      classCode: role === UserRole.STUDENT ? 'CLASS6A' : undefined
    });
    setView('dashboard');
  };

  const handleSubmitTest = async () => {
    if (!activeTest) return;
    
    let correctCount = 0;
    activeTest.questions.forEach(q => {
      if (currentAnswers[q.id] === q.correctAnswer) correctCount++;
    });
    const score = (correctCount / activeTest.questions.length) * 10;
    
    const submission: Submission = {
      id: Math.random().toString(),
      testId: activeTest.id,
      studentId: user?.id || 'anonymous',
      studentName: user?.name || 'Học sinh Ẩn danh',
      answers: currentAnswers,
      score: parseFloat(score.toFixed(1)),
      completedAt: new Date().toISOString()
    };

    // Cập nhật state cục bộ VÀ lưu vào localStorage ngay lập tức
    const newSubmissions = [...submissions, submission];
    setSubmissions(newSubmissions);
    localStorage.setItem('edutest_submissions', JSON.stringify(newSubmissions));
    
    setLatestResult(submission);
    setView('results');

    try {
      const feedback = await getAIFeedback(submission.score, currentAnswers, activeTest.questions);
      setSubmissions(prev => {
        const updated = prev.map(s => s.id === submission.id ? { ...s, aiFeedback: feedback } : s);
        localStorage.setItem('edutest_submissions', JSON.stringify(updated));
        return updated;
      });
      setLatestResult(prev => prev?.id === submission.id ? { ...prev, aiFeedback: feedback } : prev);
    } catch (e) {
      console.error("AI Feedback error");
    }
  };

  const getPersonalCompetency = () => {
    if (!latestResult || !activeTest) return null;
    const stats = {
      [Difficulty.RECALL]: { correct: 0, total: 0 },
      [Difficulty.COMPREHENSION]: { correct: 0, total: 0 },
      [Difficulty.APPLICATION]: { correct: 0, total: 0 },
      [Difficulty.HIGH_APPLICATION]: { correct: 0, total: 0 },
    };
    activeTest.questions.forEach(q => {
      stats[q.difficulty].total++;
      if (latestResult.answers[q.id] === q.correctAnswer) stats[q.difficulty].correct++;
    });
    return stats;
  };

  const exportToCSV = () => {
    if (submissions.length === 0) { alert("Chưa có kết quả."); return; }
    const headers = ["Học sinh", "Đề thi", "Điểm", "Thời gian"];
    const rows = submissions.map(s => [
        s.studentName, 
        tests.find(t => t.id === s.testId)?.title || "N/A",
        s.score.toString(), 
        new Date(s.completedAt).toLocaleString()
    ]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Ket_qua_hoc_sinh.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (view === 'landing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-700 via-blue-800 to-slate-900 p-4">
        <div className="max-w-md w-full text-center bg-white/10 backdrop-blur-2xl p-10 rounded-[3.5rem] border border-white/20 shadow-2xl">
          <div className="bg-white w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-8 transform hover:rotate-6 transition-transform">
            <ClipboardList className="text-indigo-600 w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">EduTest AI</h1>
          <p className="text-indigo-100 mb-10 text-[10px] opacity-80 font-black uppercase tracking-[0.3em]">Trường THCS Đông Trà</p>
          <div className="space-y-4">
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
              <input type="text" placeholder="Nhập họ và tên..." className="w-full bg-white/10 border-2 border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 outline-none focus:border-white/40 focus:bg-white/20 font-bold transition-all" value={loginName} onChange={(e) => setLoginName(e.target.value)} />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
              <input type="password" placeholder="Mật khẩu giáo viên" className="w-full bg-white/10 border-2 border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 outline-none focus:border-white/40 focus:bg-white/20 font-bold transition-all" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <div className="flex items-center gap-2 text-red-300 text-[11px] font-bold bg-red-950/30 p-3 rounded-xl border border-red-500/20 animate-pulse"><AlertCircle className="w-4 h-4" />{error}</div>}
            <div className="grid grid-cols-1 gap-4 pt-4">
              <Button variant="primary" onClick={() => handleLogin(UserRole.TEACHER)} className="py-5 bg-white text-indigo-700 hover:bg-indigo-50 border-none shadow-xl font-black rounded-2xl">Vào Cổng Giáo viên</Button>
              <div className="relative py-2"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div><div className="relative flex justify-center text-[10px] uppercase font-black text-white/20 tracking-widest"><span className="bg-transparent px-2">Hoặc</span></div></div>
              <Button variant="outline" onClick={() => handleLogin(UserRole.STUDENT)} className="py-5 border-white/20 text-white hover:bg-white/10 font-bold rounded-2xl">Vào Cổng Học sinh</Button>
            </div>
          </div>
          <p className="mt-8 text-[9px] text-white/40 font-bold uppercase tracking-[0.2em]">Hệ thống thiết lập cho Thầy Lê Vũ Thương</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col print:bg-white">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 no-print shadow-sm backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl cursor-pointer shadow-lg shadow-indigo-100" onClick={() => setView('dashboard')}><ClipboardList className="text-white w-5 h-5" /></div>
            <span className="font-black text-xl tracking-tighter text-slate-800 cursor-pointer" onClick={() => setView('dashboard')}>EduTest <span className="text-indigo-600">AI</span></span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block border-r border-slate-100 pr-4">
              <p className="text-sm font-bold text-slate-800">{user?.name}</p>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{user?.role === UserRole.TEACHER ? 'Giáo viên' : 'Học sinh'}</p>
            </div>
            <button onClick={() => { setUser(null); setLoginName(''); setPassword(''); setError(null); setView('landing'); }} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {user?.role === UserRole.TEACHER ? (
          <>
            {view === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Quản lý Đề thi</h2>
                    <p className="text-slate-500 font-medium italic">Chào Thầy {user.name.split(' ').pop()}, công cụ hỗ trợ chuẩn 5512 đang hoạt động.</p>
                  </div>
                  <Button variant="outline" className="bg-white border-slate-200 shadow-sm" onClick={exportToCSV}><FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Xuất Bảng điểm</Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <TestGenerator onTestCreated={(t) => { setTests(prev => [t, ...prev]); setActiveTest(t); setView('test-preview'); }} />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><PieChart className="w-6 h-6 text-indigo-600" /> Phân tích năng lực học sinh</h3>
                         <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse border border-emerald-100">
                            <Radio className="w-3 h-3" /> Live Update
                         </div>
                      </div>
                      <Statistics submissions={submissions} tests={tests} />
                    </div>
                  </div>
                  <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden h-fit">
                    <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center"><h4 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Danh sách Đề thi</h4><span className="text-[10px] font-black text-white bg-indigo-500 px-2 py-0.5 rounded-full">{tests.length}</span></div>
                    <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                      {tests.map(test => (
                        <div key={test.id} className="p-5 hover:bg-slate-50 cursor-pointer transition-all group relative" onClick={() => { setActiveTest(test); setView('test-preview'); }}>
                          <p className="font-bold text-slate-800 line-clamp-2 pr-8 text-sm group-hover:text-indigo-600 transition-colors">{test.title}</p>
                          <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500 font-bold uppercase"><span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {test.assignedClass}</span><span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {test.duration}P</span></div>
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"><Eye className="w-5 h-5 text-indigo-600" /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {view === 'test-preview' && activeTest && <TestPreview test={activeTest} onBack={() => setView('dashboard')} onAssign={() => { alert(`Đề thi "${activeTest.title}" đã được lưu.`); setView('dashboard'); }} />}
          </>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {view === 'dashboard' && (
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
                  <div className="bg-indigo-50 w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-inner"><ClipboardList className="text-indigo-600 w-10 h-10" /></div>
                  <h2 className="text-3xl font-black mb-2 text-slate-900 tracking-tight">Khu vực Làm bài</h2>
                  <p className="text-slate-500 mb-10 font-medium italic">Chào mừng em <span className="text-indigo-600 font-black">{user?.name}</span> đã quay trở lại.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tests.filter(t => t.questions?.length > 0).map(test => (
                      <div key={test.id} className="p-6 border-2 border-slate-100 rounded-[2rem] flex items-center justify-between hover:border-indigo-300 transition-all bg-white shadow-sm hover:shadow-xl group">
                        <div className="text-left"><h4 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">{test.title}</h4><div className="flex gap-4 mt-2"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> {test.duration}P</span><span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Khối {test.grade}</span></div></div>
                        <Button variant="primary" onClick={() => { setActiveTest(test); setCurrentAnswers({}); setTimeLeft(test.duration * 60); setView('test-taking'); }} className="px-6 rounded-xl shadow-lg font-black uppercase text-[10px] tracking-widest">Làm bài</Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center gap-3"><History className="text-indigo-600 w-6 h-6" /><h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Kết quả em đã đạt được</h3></div>
                    <div className="divide-y divide-slate-50">
                        {submissions.filter(s => s.studentName === user?.name).length === 0 ? (
                            <div className="p-12 text-center text-slate-400 italic">Em chưa làm bài kiểm tra nào.</div>
                        ) : (
                            [...submissions].filter(s => s.studentName === user?.name).reverse().map(sub => (
                                <div key={sub.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex-1"><p className="font-bold text-slate-800">{tests.find(t => t.id === sub.testId)?.title || 'Bài thi đã xóa'}</p><p className="text-[10px] font-medium text-slate-400 mt-1">{new Date(sub.completedAt).toLocaleString('vi-VN')}</p></div>
                                    <div className="flex items-center gap-6"><div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Điểm số</p><p className={`text-2xl font-black ${sub.score >= 8 ? 'text-emerald-600' : sub.score >= 5 ? 'text-indigo-600' : 'text-red-600'}`}>{sub.score}</p></div><Button variant="outline" className="rounded-xl px-4 py-2" onClick={() => { setLatestResult(sub); setActiveTest(tests.find(t => t.id === sub.testId) || null); setView('results'); }}>Xem lại</Button></div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
              </div>
            )}
            {view === 'test-taking' && activeTest && (
              <div className="max-w-4xl mx-auto pb-24">
                <div className="sticky top-20 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-indigo-100 mb-10 flex justify-between items-center z-40">
                  <div className="flex-1"><h3 className="font-black text-slate-900 text-lg line-clamp-1">{activeTest.title}</h3><p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Thí sinh: {user?.name}</p></div>
                  <div className={`flex items-center gap-3 mx-4 px-6 py-2.5 rounded-xl font-mono text-2xl font-black shadow-inner ${timeLeft < 300 ? 'text-red-600 bg-red-50 animate-pulse' : 'text-indigo-600 bg-indigo-50'}`}><Clock className="w-6 h-6" />{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
                  <Button variant="primary" onClick={handleSubmitTest} className="shadow-2xl px-6 py-3 font-black uppercase tracking-widest text-xs">Nộp bài</Button>
                </div>
                <div className="space-y-10">
                  {activeTest.questions.map((q, idx) => (
                    <div key={q.id} className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-md">
                      {q.passage && <div className="mb-8 p-6 bg-slate-50 rounded-[1.5rem] border-l-[6px] border-indigo-500 italic text-slate-700 relative shadow-inner"><div className="absolute -top-3 left-6 bg-indigo-500 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">Reading Passage</div>{q.passage}</div>}
                      <div className="flex gap-4 mb-8"><span className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-lg flex-shrink-0">{idx + 1}</span><p className="font-bold text-lg md:text-xl text-slate-900 leading-snug">{q.content}</p></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(q.options).map(([key, value]) => (
                          <button key={key} onClick={() => setCurrentAnswers({ ...currentAnswers, [q.id]: key })} className={`p-5 md:p-6 text-left rounded-2xl border-2 transition-all flex items-center gap-5 group ${currentAnswers[q.id] === key ? 'bg-indigo-50 border-indigo-600 ring-4 ring-indigo-50 shadow-lg' : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}`}><span className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${currentAnswers[q.id] === key ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{key}</span><span className={`text-base md:text-lg font-medium ${currentAnswers[q.id] === key ? 'text-indigo-900 font-bold' : 'text-slate-600'}`}>{value}</span></button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {view === 'results' && latestResult && (
              <div className="max-w-3xl mx-auto space-y-6 animate-in zoom-in-95 duration-500">
                <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-2xl border border-slate-200 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-3 bg-indigo-600"></div>
                  <div className={`w-20 h-20 mx-auto flex items-center justify-center rounded-full mb-6 shadow-2xl ${latestResult.score >= 5 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{latestResult.score >= 5 ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}</div>
                  <h2 className="text-3xl font-black mb-2 text-slate-900 tracking-tight">Kết quả bài làm</h2>
                  <div className="mb-8 text-center"><p className={`text-7xl font-black tracking-tighter inline-block ${latestResult.score >= 8 ? 'text-emerald-600' : latestResult.score >= 5 ? 'text-indigo-600' : 'text-red-600'}`}>{latestResult.score}</p><span className="text-slate-400 font-black text-xl">/10</span><p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Học sinh: {latestResult.studentName}</p></div>
                  <div className="bg-slate-50 rounded-[2.5rem] p-8 mb-8 border border-slate-100 text-left">
                    <h4 className="flex items-center gap-2 font-black text-slate-800 mb-6 text-sm uppercase tracking-tight"><BarChart3 className="w-4 h-4 text-indigo-600" /> Phân tích Ma trận Năng lực</h4>
                    <div className="space-y-4">
                      {getPersonalCompetency() && Object.entries(getPersonalCompetency()!).map(([diff, stats]) => {
                        const percent = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
                        return (
                          <div key={diff} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest"><span>{diff}</span><span>{stats.correct}/{stats.total} câu ({percent.toFixed(0)}%)</span></div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${percent >= 80 ? 'bg-emerald-500' : percent >= 50 ? 'bg-indigo-500' : 'bg-amber-500'}`} style={{ width: `${percent}%` }}></div></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {latestResult.aiFeedback && (
                    <div className="bg-indigo-50 rounded-[2rem] p-8 text-left border-2 border-indigo-100 mb-8 shadow-inner"><h4 className="flex items-center gap-3 font-black text-indigo-900 mb-4 text-lg uppercase tracking-tight"><Sparkles className="w-5 h-5 text-indigo-500" /> Nhận xét từ AI</h4><div className="text-indigo-900 leading-relaxed font-medium italic whitespace-pre-line text-sm md:text-base">{latestResult.aiFeedback}</div></div>
                  )}
                  <Button variant="outline" onClick={() => setView('dashboard')} className="px-10 py-4 rounded-xl border-2 font-black uppercase text-xs tracking-widest w-full sm:w-auto">Quay về Dashboard</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-10 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">EduTest AI | Trường THCS Đông Trà | Thiết kế bảo mật cho Thầy Lê Vũ Thương</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
