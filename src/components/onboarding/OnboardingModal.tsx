import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { RoleId } from '../../types';
import { CheckCircle2, ArrowRight, ShieldCheck, FileSpreadsheet, Sparkles } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { settings, people, roles, completeOnboarding } = useAppStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [projectName, setProjectName] = useState(settings.projectName || 'DBC 2026 — Bán hàng Online');
  const [teamName, setTeamName] = useState(settings.teamName || 'Đội Chiến Binh Số 2026');

  const [memberNames, setMemberNames] = useState<Record<RoleId, string>>({
    1: people.find((p) => p.roleId === 1 && p.isPrimary)?.fullName || 'Nguyễn Văn An',
    2: people.find((p) => p.roleId === 2 && p.isPrimary)?.fullName || 'Trần Nguyên Độ',
    3: people.find((p) => p.roleId === 3 && p.isPrimary)?.fullName || 'Lê Bảo Châu',
    4: people.find((p) => p.roleId === 4 && p.isPrimary)?.fullName || 'Hoàng Minh Dũng',
  });

  if (settings.onboardingCompleted) {
    return null;
  }

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !teamName.trim()) return;
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleFinish = (connectSheet: boolean) => {
    completeOnboarding(projectName, teamName, memberNames, connectSheet);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                DBC
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Thiết Lập Ban Đầu Nhóm Thi DBC 2026
                </h2>
                <p className="text-xs text-slate-500">
                  Hệ thống quản lý công việc và bản đồ phối hợp 4 vai trò cốt lõi
                </p>
              </div>
            </div>
            {/* Step indicators */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    step === s
                      ? 'bg-blue-600'
                      : step > s
                      ? 'bg-blue-400 dark:bg-blue-500'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* STEP 1 */}
          {step === 1 && (
            <form onSubmit={handleNextStep1} className="space-y-4">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-center font-bold">
                  1
                </span>
                Thông tin dự án &amp; Nhóm thi
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tên cuộc thi / Dự án
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="DBC 2026 — Bán hàng Online"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tên nhóm thi của bạn
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Nhập tên nhóm thi của bạn..."
                />
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  <span>Tiếp tục bước 2</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form onSubmit={handleNextStep2} className="space-y-4">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-center font-bold">
                  2
                </span>
                Gán 4 thành viên cho 4 Role cốt lõi
              </div>
              <p className="text-xs text-slate-500">
                Lưu ý: Mọi công việc gắn với ROLE. Khi đổi người cầm role, toàn bộ công việc tự động cập nhật!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Role 1 */}
                <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/80 bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    (1) Trưởng nhóm / Điều phối
                  </div>
                  <input
                    type="text"
                    required
                    value={memberNames[1]}
                    onChange={(e) => setMemberNames({ ...memberNames, 1: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Họ và tên..."
                  />
                </div>

                {/* Role 2 */}
                <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/80 bg-purple-50/50 dark:bg-purple-950/20">
                  <div className="text-xs font-bold text-purple-700 dark:text-purple-400 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                    (2) Phân tích thị trường
                  </div>
                  <input
                    type="text"
                    required
                    value={memberNames[2]}
                    onChange={(e) => setMemberNames({ ...memberNames, 2: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="Họ và tên..."
                  />
                </div>

                {/* Role 3 */}
                <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/80 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    (3) Quản lý gian hàng
                  </div>
                  <input
                    type="text"
                    required
                    value={memberNames[3]}
                    onChange={(e) => setMemberNames({ ...memberNames, 3: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Họ và tên..."
                  />
                </div>

                {/* Role 4 */}
                <div className="p-3 rounded-xl border border-orange-200 dark:border-orange-900/80 bg-orange-50/50 dark:bg-orange-950/20">
                  <div className="text-xs font-bold text-orange-700 dark:text-orange-400 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-600" />
                    (4) Marketing / Mạng xã hội / Nội dung
                  </div>
                  <input
                    type="text"
                    required
                    value={memberNames[4]}
                    onChange={(e) => setMemberNames({ ...memberNames, 4: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="Họ và tên..."
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  <span>Tiếp tục bước 3</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-center font-bold">
                  3
                </span>
                Đồng bộ Google Sheets
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Bạn có muốn kết nối Google Sheets ngay bây giờ không?
                </div>
                <p>
                  Ứng dụng hoàn toàn chạy mượt mà ở chế độ <strong>Local Mode</strong> mà không cần Google Sheet. Dữ liệu được lưu tự động trên trình duyệt và bạn có thể kết nối Sheet bất kỳ lúc nào sau này trong menu <em>Google Sheets</em>.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Quay lại
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleFinish(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition"
                  >
                    Dùng trước (Để sau)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinish(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Kết nối Google Sheets</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
