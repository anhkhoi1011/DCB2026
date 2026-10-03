import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Upload,
  Download,
  Key,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import {
  parseSpreadsheetId,
  requestGoogleAccessToken,
  getSpreadsheetMetadata,
  setupSpreadsheetStructure,
  exportDataToSpreadsheet,
  importDataFromSpreadsheet,
} from '../../utils/googleSheets';

export const SheetsSettingsView: React.FC = () => {
  const {
    syncState,
    updateSyncState,
    addSyncLog,
    roles,
    people,
    tasks,
    taskLinks,
    settings,
    importData,
  } = useAppStore();

  const [sheetUrlInput, setSheetUrlInput] = useState(syncState.spreadsheetUrl || '');
  const [googleClientId, setGoogleClientId] = useState(
    (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || ''
  );
  const [accessToken, setAccessToken] = useState<string>('');
  const [structureStatus, setStructureStatus] = useState<string | null>(null);
  const [missingSheets, setMissingSheets] = useState<string[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pulledDataStaging, setPulledDataStaging] = useState<any>(null);

  const handleUrlChange = (val: string) => {
    setSheetUrlInput(val);
    const parsedId = parseSpreadsheetId(val);
    if (parsedId) {
      updateSyncState({ spreadsheetUrl: val, spreadsheetId: parsedId });
    }
  };

  // Google OAuth Auth trigger
  const handleConnectGoogle = async () => {
    if (!googleClientId.trim()) {
      addSyncLog('warning', 'Vui lòng nhập Google OAuth Client ID hoặc cấu hình VITE_GOOGLE_CLIENT_ID trong .env');
      return;
    }

    try {
      updateSyncState({ isSyncing: true, errorMessage: undefined });
      const token = await requestGoogleAccessToken(googleClientId.trim());
      setAccessToken(token);
      updateSyncState({ isConnected: true, isSyncing: false });
      addSyncLog('success', 'Xác thực Google OAuth thành công! Sẵn sàng đồng bộ Google Sheets.');
    } catch (err: any) {
      updateSyncState({ isSyncing: false, errorMessage: err.message });
      addSyncLog('error', `Lỗi đăng nhập Google: ${err.message}`);
    }
  };

  // Check structure of Spreadsheet
  const handleCheckStructure = async () => {
    const spreadsheetId = syncState.spreadsheetId || parseSpreadsheetId(sheetUrlInput);
    if (!spreadsheetId) {
      addSyncLog('warning', 'Vui lòng nhập đúng đường link Google Sheet hợp lệ.');
      return;
    }
    if (!accessToken) {
      addSyncLog('warning', 'Vui lòng bấm Kết nối Google trước khi kiểm tra bảng tính.');
      return;
    }

    try {
      updateSyncState({ isSyncing: true });
      const { missingSheets: missing, existingSheetTitles } = await getSpreadsheetMetadata(
        spreadsheetId,
        accessToken
      );
      setMissingSheets(missing);
      updateSyncState({ isSyncing: false, isConnected: true });

      if (missing.length === 0) {
        setStructureStatus('Bảng tính đã có đầy đủ 7 sheet cấu trúc của DBC Task System!');
        addSyncLog('success', 'Kiểm tra cấu trúc: Bảng tính hoàn toàn sẵn sàng!');
      } else {
        setStructureStatus(`Google Sheet này còn thiếu ${missing.length} tab: ${missing.join(', ')}.`);
        addSyncLog('warning', `Thiếu cấu trúc sheet: ${missing.join(', ')}`);
      }
    } catch (err: any) {
      updateSyncState({ isSyncing: false, errorMessage: err.message });
      addSyncLog('error', `Lỗi kiểm tra bảng tính: ${err.message}`);
    }
  };

  // Create structure automatically
  const handleCreateStructure = async () => {
    const spreadsheetId = syncState.spreadsheetId || parseSpreadsheetId(sheetUrlInput);
    if (!spreadsheetId || !accessToken) return;

    try {
      updateSyncState({ isSyncing: true });
      await setupSpreadsheetStructure(spreadsheetId, accessToken);
      setMissingSheets([]);
      setStructureStatus('✓ Đã tạo tự động đầy đủ 6 tab và tiêu đề cột chuẩn xác trên Google Sheet!');
      updateSyncState({ isSyncing: false });
      addSyncLog('success', 'Khởi tạo cấu trúc bảng tính thành công!');
    } catch (err: any) {
      updateSyncState({ isSyncing: false, errorMessage: err.message });
      addSyncLog('error', `Lỗi khởi tạo cấu trúc: ${err.message}`);
    }
  };

  // Push Local Data -> Sheet
  const handlePushData = async () => {
    const spreadsheetId = syncState.spreadsheetId || parseSpreadsheetId(sheetUrlInput);
    if (!spreadsheetId || !accessToken) {
      addSyncLog('warning', 'Vui lòng kết nối Google trước.');
      return;
    }

    try {
      updateSyncState({ isSyncing: true });
      await exportDataToSpreadsheet(spreadsheetId, accessToken, {
        roles,
        people,
        tasks,
        taskLinks,
        settings,
      });
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      updateSyncState({
        isSyncing: false,
        lastSyncTime: timeStr,
      });
      addSyncLog('success', `Đã đẩy toàn bộ dữ liệu web lên Google Sheets lúc ${timeStr}!`);
    } catch (err: any) {
      updateSyncState({ isSyncing: false, errorMessage: err.message });
      addSyncLog('error', `Lỗi đẩy dữ liệu: ${err.message}`);
    }
  };

  // Pull Remote Data -> Web
  const handlePullData = async () => {
    const spreadsheetId = syncState.spreadsheetId || parseSpreadsheetId(sheetUrlInput);
    if (!spreadsheetId || !accessToken) return;

    try {
      updateSyncState({ isSyncing: true });
      const remoteData = await importDataFromSpreadsheet(spreadsheetId, accessToken);
      setPulledDataStaging(remoteData);
      updateSyncState({ isSyncing: false });

      // If local already has data, offer safety modal
      if (tasks.length > 0) {
        setShowConflictModal(true);
      } else {
        importData(remoteData);
        addSyncLog('success', 'Đã tải dữ liệu từ Google Sheets về ứng dụng thành công!');
      }
    } catch (err: any) {
      updateSyncState({ isSyncing: false, errorMessage: err.message });
      addSyncLog('error', `Lỗi tải dữ liệu: ${err.message}`);
    }
  };

  const handleResolveConflict = (choice: 'WEB' | 'SHEET') => {
    if (choice === 'SHEET' && pulledDataStaging) {
      importData(pulledDataStaging);
      addSyncLog('info', 'Đã ghi đè dữ liệu web bằng phiên bản Google Sheets.');
    } else {
      addSyncLog('info', 'Giữ nguyên dữ liệu trên Web.');
    }
    setShowConflictModal(false);
    setPulledDataStaging(null);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          <span>Tích Hợp Google Sheets Đồng Bộ Hai Chiều</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Đồng bộ công việc và phân công vai trò trực tiếp với Google Sheets của nhóm
        </p>
      </div>

      {/* Sync Status Banner */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between ${
          syncState.isSyncing
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
            : syncState.isConnected
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              syncState.isConnected
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            {syncState.isSyncing ? (
              <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
            ) : syncState.isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <FileSpreadsheet className="w-5 h-5 text-slate-500" />
            )}
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Trạng thái kết nối
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {syncState.isSyncing
                ? 'Đang đồng bộ với Google Sheets...'
                : syncState.isConnected
                ? 'Đã kết nối với Google Sheets'
                : 'Chưa kết nối (Đang chạy Local Mode)'}
            </div>
            {syncState.lastSyncTime && (
              <div className="text-[11px] text-slate-500">
                Đồng bộ thành công lần cuối: <strong>{syncState.lastSyncTime}</strong>
              </div>
            )}
          </div>
        </div>

        {syncState.isConnected && (
          <button
            onClick={handlePushData}
            disabled={syncState.isSyncing}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
            <span>Đồng bộ ngay</span>
          </button>
        )}
      </div>

      {/* Configuration Form */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Cấu hình Đường dẫn &amp; Xác thực
        </h3>

        {/* Spreadsheet Link Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Dán đường link Google Sheet của nhóm:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
              value={sheetUrlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {syncState.spreadsheetId && (
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              ✓ Đã nhận diện ID: {syncState.spreadsheetId}
            </div>
          )}
        </div>

        {/* OAuth Client ID */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
            <span>Google OAuth Client ID:</span>
            <span className="text-[10px] text-slate-400 font-normal">
              (Có thể cấu hình qua VITE_GOOGLE_CLIENT_ID)
            </span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="VD: 296999212203-xxxxxx.apps.googleusercontent.com"
              value={googleClientId}
              onChange={(e) => setGoogleClientId(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleConnectGoogle}
              className="px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-xs transition shrink-0"
            >
              Kết nối Google
            </button>
          </div>
        </div>

        {/* Structure Checker */}
        {syncState.spreadsheetId && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Kiểm tra &amp; Khởi tạo cấu trúc Bảng tính
              </span>
              <button
                onClick={handleCheckStructure}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-medium transition"
              >
                Kiểm tra cấu trúc
              </button>
            </div>

            {structureStatus && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <div>{structureStatus}</div>
                {missingSheets.length > 0 && (
                  <button
                    onClick={handleCreateStructure}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tạo cấu trúc tự động ngay</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Data Actions: Push / Pull */}
        {syncState.spreadsheetId && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2.5">
            <button
              onClick={handlePushData}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Đẩy dữ liệu web lên Sheet</span>
            </button>

            <button
              onClick={handlePullData}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải dữ liệu từ Sheet về Web</span>
            </button>
          </div>
        )}
      </div>

      {/* Sync Log Panel */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Nhật ký đồng bộ gần đây (Sync Log)</span>
        </h3>

        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {syncState.syncLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    log.status === 'success'
                      ? 'bg-emerald-500'
                      : log.status === 'error'
                      ? 'bg-rose-500'
                      : log.status === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                />
                <span>{log.message}</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400 shrink-0 ml-2">
                {log.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Conflict Resolution Modal */}
      {showConflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Xung Đột Dữ Liệu: Phát hiện hai nguồn dữ liệu
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Trên Web hiện đang có {tasks.length} công việc và trên Google Sheets có {pulledDataStaging?.tasks?.length || 0} công việc. Vui lòng đối chiếu thời gian cập nhật <code>updated_at</code>:
              </p>

              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Phiên bản Web:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">
                    {(() => {
                      const latest = tasks.reduce((max, t) => (t.updatedAt && t.updatedAt > max ? t.updatedAt : max), '');
                      return latest ? new Date(latest).toLocaleString('vi-VN') : 'Vừa xong';
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Phiên bản Google Sheets:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">
                    {(() => {
                      const latest = (pulledDataStaging?.tasks || []).reduce(
                        (max: string, t: any) => (t.updatedAt && t.updatedAt > max ? t.updatedAt : max),
                        ''
                      );
                      return latest ? new Date(latest).toLocaleString('vi-VN') : 'Mới cập nhật';
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleResolveConflict('WEB')}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition"
              >
                Giữ Web (Ghi đè Sheet sau)
              </button>
              <button
                onClick={() => handleResolveConflict('SHEET')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                Giữ Sheet (Cập nhật Web)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
