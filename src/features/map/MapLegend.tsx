import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

export const MapLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 z-10 select-none">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden text-xs max-w-xs transition-all">
        {/* Toggle header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
        >
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            <span>Chú giải quan hệ &amp; Màu vai trò</span>
          </div>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>

        {/* Legend content */}
        {isOpen && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            {/* Roles */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                4 Vai trò cốt lõi
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                  <span className="truncate">R1: Trưởng nhóm</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
                  <span className="truncate">R2: Thị trường</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                  <span className="truncate">R3: Gian hàng</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-600 shrink-0" />
                  <span className="truncate">R4: Marketing</span>
                </div>
              </div>
            </div>

            {/* Relationship Lines */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Đường quan hệ công việc
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-[3px] bg-blue-600 rounded" />
                  <span className="text-blue-600 dark:text-blue-400 font-medium">→</span>
                  <span>Cầm chính (Chịu trách nhiệm hoàn thành)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 border-t-2 border-dashed border-slate-400" />
                  <span className="text-slate-400 font-medium">→</span>
                  <span>Phối hợp (Trực tiếp thực hiện 1 phần)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-[2px] bg-amber-500 rounded" />
                  <span className="text-amber-500 font-medium">→</span>
                  <span>Người chốt (Phê duyệt kết quả)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-[2px] bg-slate-500 rounded" />
                  <span className="text-slate-500 font-bold">→</span>
                  <span>Bàn giao kết quả / Phụ thuộc trước - sau</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 border-t-2 border-dashed border-emerald-500" />
                  <span className="text-emerald-500 font-bold">↺</span>
                  <span>Phản hồi &amp; Tối ưu lặp (Feedback loop)</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
              💡 <strong>Mẹo:</strong> Click vào bất kỳ ROLE hoặc TASK nào trên bản đồ để hệ thống tự động làm sáng mối quan hệ liên kết và ẩn mờ các node khác!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
