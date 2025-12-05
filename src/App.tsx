import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Activity,
  CheckCircle,
  Database,
  Bell,
  Settings,
  Edit3,
  ChevronRight,
  Folder,
  Clock,
  LogOut,
  ArrowRight,
  ArrowLeft,
  Save,
  RotateCcw,
  Search,
  Download,
  AlertTriangle,
  Play,
  Calendar,
  X,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// --- Mock Data ---

const MOCK_RESOURCES = [
  {
    id: 'RES-001',
    path: '/XX/XXXXX/2025Q3_Trade_Data',
    createTime: '2025-11-19 10:00:00',
    lastViewed: 'a few seconds ago',
  },
  {
    id: 'RES-002',
    path: '/XX/XXXXX/2025Q2_Trade_Data',
    createTime: '2025-08-15 09:30:00',
    lastViewed: '11 months ago',
  },
];

const MOCK_SCENARIOS = [
  {
    id: '1-1',
    title: '單一帳戶大額現金頻繁存提',
    category: '存提匯款',
    updateTime: '2025-11-19',
    schedule: '月跑批',
    status: 'Active',
  },
  {
    id: '1-2',
    title: '單一客戶多帳戶大額現金頻繁存提',
    category: '存提匯款',
    updateTime: '2025-11-19',
    schedule: '月跑批',
    status: 'Active',
  },
  {
    id: '1-3',
    title: '化整為零規避申報門檻存提',
    category: '存提匯款',
    updateTime: '2025-11-19',
    schedule: '月跑批',
    status: 'Active',
  },
  {
    id: '3-1',
    title: '多筆境內居民收款由單人集中操作',
    category: '跨境交易',
    updateTime: '2025-11-19',
    schedule: '月跑批',
    status: 'Active',
  },
];

const MOCK_FIELDS = [
  {
    name: 'txn_time',
    type: 'timestamp',
    desc: '交易時間',
    source: 'TXN_DT_TIME',
    status: 'Mapped',
  },
  {
    name: 'period_days',
    type: 'int',
    desc: '統計期間（天）',
    source: 'PARAM_DAYS',
    status: 'Mapped',
  },
  {
    name: 'party_id',
    type: 'string',
    desc: '客戶識別碼',
    source: 'CUST_ID',
    status: 'Mapped',
  },
  {
    name: 'txn_amount',
    type: 'decimal',
    desc: '單筆金額',
    source: 'TXN_AMT',
    status: 'Mapped',
  },
  {
    name: 'channel',
    type: 'string',
    desc: '交易渠道',
    source: '',
    status: 'Unmapped',
  },
];

const MOCK_VERIFY_JOBS = [
  {
    id: 'V-001',
    title: '2025 Q4 分析 - 驗證 XXXX',
    date: '2025-11-19',
    startTime: '2025-11-20 10:00',
    endTime: '2025-11-21 10:00',
    status: 'Success',
    alerts: 98,
    type1: 1,
    type2: 1,
  },
  {
    id: 'V-002',
    title: '2025 Q4 參數調整測試',
    date: '2025-11-20',
    startTime: '2025-11-20 14:00',
    endTime: '-',
    status: 'In Progress',
    alerts: 0,
    type1: 0,
    type2: 0,
  },
];

const CHART_DATA = [
  { name: '11/13', error: 4, processing: 20, verified: 50 },
  { name: '11/14', error: 2, processing: 30, verified: 60 },
  { name: '11/15', error: 5, processing: 25, verified: 55 },
  { name: '11/16', error: 1, processing: 40, verified: 80 },
  { name: '11/17', error: 0, processing: 10, verified: 90 },
];

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
      active
        ? 'bg-gray-800 text-white border-l-4 border-blue-500'
        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`}
  >
    <Icon size={18} />
    {label}
  </button>
);

const StatusBadge = ({ status }) => {
  const styles = {
    Success: 'bg-green-100 text-green-800',
    Failed: 'bg-red-100 text-red-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    Mapped: 'bg-green-100 text-green-800',
    Unmapped: 'bg-gray-100 text-gray-800',
    Active: 'bg-green-100 text-green-800',
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        styles[status] || 'bg-gray-100'
      }`}
    >
      {status}
    </span>
  );
};

// --- Main Application ---

export default function AMLPortal() {
  // Navigation State
  const [selectedResource, setSelectedResource] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Drill-down States
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isCreatingScenario, setIsCreatingScenario] = useState(false);

  const [editingField, setEditingField] = useState(null);

  const [selectedVerify, setSelectedVerify] = useState(null);
  const [isCreatingVerify, setIsCreatingVerify] = useState(false); // New State for Create Verify Flow
  const [verifySubTab, setVerifySubTab] = useState('setting'); // 'setting' | 'report'

  // Scenario Edit Params
  const [sqlParams, setSqlParams] = useState({
    lookbackDays: 30,
    depositThreshold: 1500000,
    withdrawalThreshold: 1500000,
  });

  const generatedSQL = `-- 自動生成的 SQL 邏輯
WITH Parameters AS (
 SELECT 
 ${sqlParams.lookbackDays} AS Lookback_Days, 
 ${sqlParams.depositThreshold} AS Deposit_Threshold, 
 ${sqlParams.withdrawalThreshold} AS Withdrawal_Threshold 
),
-- 步驟 1: 計算每個帳戶在指定期間內的現金存提累計金額
Account_Aggregates AS (
 SELECT
   t1.ACCOUNT_ID,
   SUM(CASE WHEN t1.TRANSACTION_TYPE = 'CASH_DEPOSIT' THEN t1.AMOUNT ELSE 0 END) AS Total_Cash_Deposit,
   SUM(CASE WHEN t1.TRANSACTION_TYPE = 'CASH_WITHDRAWAL' THEN t1.AMOUNT ELSE 0 END) AS Total_Cash_Withdrawal
 FROM STANDARD_TRANSACTION t1
 WHERE t1.TRANSACTION_DATE >= DATE_SUB(CURRENT_DATE(), INTERVAL ${sqlParams.lookbackDays} DAY)
 GROUP BY t1.ACCOUNT_ID
)
SELECT * FROM Account_Aggregates
WHERE Total_Cash_Deposit >= ${sqlParams.depositThreshold} 
   AND Total_Cash_Withdrawal >= ${sqlParams.withdrawalThreshold};`;

  // --- Render Functions ---

  const renderHomeResources = () => (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <Activity className="text-blue-600" size={24} />
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">
            XX Bank AML Portal
          </h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>User001</span>
          <span className="cursor-pointer hover:text-gray-800">Logout</span>
        </div>
      </header>

      <main className="flex-1 p-10">
        <div className="w-full mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Resources</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex gap-4 items-center bg-gray-50/50">
              <label className="text-sm font-medium text-gray-600">
                File path
              </label>
              <input
                type="text"
                placeholder="/XXX/XXXX"
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                disabled
              />
              <button className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 text-gray-600">
                Connect
              </button>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="p-5">File path</th>
                  <th className="p-5">Create time</th>
                  <th className="p-5">Last Viewed</th>
                  <th className="p-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK_RESOURCES.map((res) => (
                  <tr
                    key={res.id}
                    onClick={() => setSelectedResource(res)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors group"
                  >
                    <td className="p-5 flex items-center gap-3 font-mono text-sm text-gray-700 font-medium">
                      <Folder size={16} className="text-blue-400" />
                      {res.path}
                    </td>
                    <td className="p-5 text-sm text-gray-500">
                      {res.createTime}
                    </td>
                    <td className="p-5 text-sm text-gray-500 flex items-center gap-2">
                      <Clock size={14} /> {res.lastViewed}
                    </td>
                    <td className="p-5 text-right">
                      <ChevronRight className="text-gray-300 group-hover:text-blue-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );

  const renderDashboard = () => (
    <div className="p-6 space-y-6 animate-fade-in w-full">
      <div className="grid grid-cols-1 gap-6">
        {/* Data Prep Status (Version 1 Style) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Database size={20} className="text-blue-600" /> 資料準備狀態 (
            {selectedResource.path.split('/').pop()})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>1. 資料擷取</span>{' '}
                <span className="text-green-600">已完成 (12.5M 筆)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-500 h-2.5 rounded-full"
                  style={{ width: '100%' }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>2. 欄位標準化</span>{' '}
                <span className="text-blue-600">46/49 完成</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full"
                  style={{ width: '94%' }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>3. 資料載入</span>{' '}
                <span className="text-gray-500">等待中</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gray-400 h-2.5 rounded-full"
                  style={{ width: '0%' }}
                ></div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded text-sm flex items-center gap-2">
              <Play size={16} /> 開始處理
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-red-500">
            <div className="text-gray-500 text-sm font-medium">
              發生錯誤 (Last 7 days)
            </div>
            <div className="text-4xl font-bold text-gray-800 mt-2">
              12 <span className="text-base font-normal text-gray-400">件</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-blue-500">
            <div className="text-gray-500 text-sm font-medium">正在進行中</div>
            <div className="text-4xl font-bold text-gray-800 mt-2">
              5 <span className="text-base font-normal text-gray-400">件</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-green-500">
            <div className="text-gray-500 text-sm font-medium">
              已完成驗證 (Last 7 days)
            </div>
            <div className="text-4xl font-bold text-gray-800 mt-2">
              128{' '}
              <span className="text-base font-normal text-gray-400">件</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">驗證概況趨勢</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="error"
                  fill="#EF4444"
                  name="發生錯誤"
                  stackId="a"
                />
                <Bar
                  dataKey="processing"
                  fill="#3B82F6"
                  name="進行中"
                  stackId="a"
                />
                <Bar
                  dataKey="verified"
                  fill="#10B981"
                  name="已完成"
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStandardFields = () => {
    if (editingField) {
      return (
        <div className="p-6 h-full flex flex-col w-full">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setEditingField(null)}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Edit Standard Field
              </h2>
              <p className="text-sm text-gray-500">
                Field:{' '}
                <span className="font-mono font-bold text-blue-600">
                  {editingField.name}
                </span>
              </p>
            </div>
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setEditingField(null)}
                className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setEditingField(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Save Logic
              </button>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
            {/* Source Tables (Left) */}
            <div className="col-span-3 bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden">
              <div className="p-3 bg-gray-50 border-b border-gray-200 font-medium text-sm flex items-center justify-between">
                <span>Source Tables</span>
                <Search size={14} />
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {[
                  'STANDARD_TRANSACTION',
                  'CUSTOMER_INFO',
                  'ACCOUNT_MASTER',
                ].map((tbl) => (
                  <div
                    key={tbl}
                    className="text-sm text-gray-700 p-2 hover:bg-blue-50 rounded cursor-pointer flex gap-2 items-center"
                  >
                    <Database size={12} className="text-gray-400" /> {tbl}
                  </div>
                ))}
              </div>
            </div>

            {/* Editor (Middle/Right) */}
            <div className="col-span-9 bg-white border border-gray-200 rounded-lg flex flex-col p-6">
              <h3 className="font-bold text-gray-700 mb-4">
                Mapping Logic Expression
              </h3>
              <div className="flex-1 bg-gray-50 border border-gray-300 rounded p-4 font-mono text-sm text-gray-800">
                {`-- Logic for ${editingField.name}\n`}
                {editingField.status === 'Mapped'
                  ? `SELECT ${editingField.source} FROM STANDARD_TRANSACTION`
                  : `CASE \n  WHEN channel_id = 'ATM' THEN 'ATM'\n  ELSE 'Branch'\nEND`}
              </div>
              <div className="mt-4 p-4 bg-slate-900 text-green-400 font-mono text-xs rounded">
                Result Preview: 2025-11-19 14:30:25
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6 w-full">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Standard Fields</h2>
          <div className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-2">
            <Activity size={16} className="text-blue-500" />
            <span>
              總共 49 個標準欄位，已完成 46 個配對，
              <span className="text-red-500 font-bold">
                剩餘 3 個需手動調整
              </span>
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase">
              <tr>
                <th className="p-4">Standard Field</th>
                <th className="p-4">Type</th>
                <th className="p-4">Description</th>
                <th className="p-4">Source</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {MOCK_FIELDS.map((field, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono font-medium text-blue-700">
                    {field.name}
                  </td>
                  <td className="p-4 text-gray-500">{field.type}</td>
                  <td className="p-4">{field.desc}</td>
                  <td className="p-4 font-mono text-gray-600">
                    {field.source || '-'}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={field.status} />
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setEditingField(field)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 px-3 py-1 rounded hover:bg-blue-50"
                    >
                      Edit Logic
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderScenario = () => {
    // 1. Create Mode
    if (isCreatingScenario) {
      return (
        <div className="p-6 w-full max-w-4xl mx-auto">
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => setIsCreatingScenario(false)}
              className="p-2 hover:bg-gray-200 rounded-full"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-2xl font-bold text-gray-800">
              Create New Scenario
            </h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scenario No
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="e.g., 1-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select className="w-full border border-gray-300 rounded px-3 py-2">
                  <option>存提匯款</option>
                  <option>跨境交易</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Scenario Title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea className="w-full border border-gray-300 rounded px-3 py-2 h-24"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule Rule
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" name="sch" /> 日跑批
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="sch" defaultChecked /> 月跑批
                </label>
              </div>
            </div>
            <div className="pt-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setIsCreatingScenario(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsCreatingScenario(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Scenario
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 2. Detail Mode
    if (selectedScenario) {
      return (
        <div className="p-6 h-full flex flex-col w-full">
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
            <span
              className="hover:underline cursor-pointer hover:text-blue-600"
              onClick={() => setSelectedScenario(null)}
            >
              Scenario
            </span>
            <ChevronRight size={14} />
            <span className="text-gray-800 font-medium">
              {selectedScenario.title}
            </span>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {selectedScenario.title}
                </h2>
                <div className="flex gap-2">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                    No: {selectedScenario.id}
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {selectedScenario.category}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  View Edit History
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded text-sm hover:bg-red-100">
                  Delete
                </button>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 divide-x divide-gray-200 overflow-hidden">
              <div className="p-6 overflow-y-auto bg-gray-50">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <Settings size={18} /> 規則參數設定 (Parameters)
                </h3>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      統計期間 (天數)
                    </label>
                    <input
                      type="number"
                      value={sqlParams.lookbackDays}
                      onChange={(e) =>
                        setSqlParams({
                          ...sqlParams,
                          lookbackDays: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      現金存款累計門檻 (TWD)
                    </label>
                    <input
                      type="number"
                      value={sqlParams.depositThreshold}
                      onChange={(e) =>
                        setSqlParams({
                          ...sqlParams,
                          depositThreshold: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      現金提款累計門檻 (TWD)
                    </label>
                    <input
                      type="number"
                      value={sqlParams.withdrawalThreshold}
                      onChange={(e) =>
                        setSqlParams({
                          ...sqlParams,
                          withdrawalThreshold: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <button className="w-full py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 mt-2">
                    Save Parameters
                  </button>
                </div>
              </div>

              <div className="flex flex-col h-full bg-slate-900 text-slate-300">
                <div className="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                  <span className="text-xs font-mono">
                    GENERATED_SCRIPT.sql
                  </span>
                  <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-400">
                    Read Only
                  </span>
                </div>
                <div className="flex-1 p-4 font-mono text-sm overflow-auto whitespace-pre leading-relaxed">
                  {generatedSQL}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 3. List Mode
    return (
      <div className="p-6 space-y-6 w-full">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Scenario Management
          </h2>
          <button
            onClick={() => setIsCreatingScenario(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2"
          >
            + Create Scenario
          </button>
        </div>
        <div className="flex gap-2 pb-2">
          {['All', '存提匯款', 'OBU', '資恐', '跨境交易'].map((cat) => (
            <button
              key={cat}
              className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase">
              <tr>
                <th className="p-4 w-16">No.</th>
                <th className="p-4">Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Update</th>
                <th className="p-4">Schedule</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {MOCK_SCENARIOS.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => setSelectedScenario(item)}
                >
                  <td className="p-4 text-gray-500 font-mono">{item.id}</td>
                  <td className="p-4 font-medium text-gray-800 group-hover:text-blue-600">
                    {item.title}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{item.updateTime}</td>
                  <td className="p-4 text-gray-500">{item.schedule}</td>
                  <td className="p-4 text-gray-400 group-hover:text-blue-500">
                    <ArrowRight size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderVerify = () => {
    // 0. Create Verify Form Mode (New!)
    if (isCreatingVerify) {
      return (
        <div className="p-6 w-full max-w-6xl mx-auto animate-fade-in">
          {/* Header Actions */}
          <div className="flex justify-end gap-3 mb-6">
            <button
              onClick={() => setIsCreatingVerify(false)}
              className="px-6 py-2 border border-gray-300 rounded font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setIsCreatingVerify(false)}
              className="px-6 py-2 bg-black text-white rounded font-medium hover:bg-gray-800 transition-colors"
            >
              Save
            </button>
          </div>

          {/* Form Container */}
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 space-y-10">
            {/* Title Field */}
            <div className="grid grid-cols-12 gap-8 items-center">
              <label className="col-span-2 font-bold text-gray-800 text-sm">
                Title
              </label>
              <div className="col-span-10">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm"
                  placeholder="Title"
                />
              </div>
            </div>

            {/* Description Field */}
            <div className="grid grid-cols-12 gap-8 items-start">
              <label className="col-span-2 font-bold text-gray-800 text-sm pt-3">
                Description
              </label>
              <div className="col-span-10">
                <textarea
                  className="w-full border border-gray-300 rounded px-4 py-3 h-40 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm resize-none"
                  placeholder="Description"
                ></textarea>
              </div>
            </div>

            {/* Scenario Field */}
            <div className="grid grid-cols-12 gap-8 items-center">
              <label className="col-span-2 font-bold text-gray-800 text-sm">
                Scenario
              </label>
              <div className="col-span-10">
                <div className="relative">
                  <select className="w-full border border-gray-300 rounded px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm appearance-none bg-white text-gray-700 cursor-pointer">
                    <option>Choose scenario</option>
                    <option>1-1 單一帳戶大額現金頻繁存提</option>
                    <option>1-2 單一客戶多帳戶大額現金頻繁存提</option>
                  </select>
                  <ChevronRight
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90"
                    size={16}
                  />
                </div>
              </div>
            </div>

            {/* Data Source Period Field */}
            <div className="grid grid-cols-12 gap-8 items-center">
              <label className="col-span-2 font-bold text-gray-800 text-sm">
                Data Source Period
              </label>
              <div className="col-span-10 flex items-center gap-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm text-gray-600"
                    placeholder="YYYY-MM-DD hh:mm:ss"
                  />
                  <Calendar
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
                <span className="text-gray-400 font-medium">~</span>
                <div className="relative flex-1">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm text-gray-600"
                    placeholder="YYYY-MM-DD hh:mm:ss"
                  />
                  <Calendar
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 1. Verify Detail View
    if (selectedVerify) {
      return (
        <div className="p-6 h-full flex flex-col w-full">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setSelectedVerify(null)}
              className="p-2 hover:bg-gray-200 rounded-full"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedVerify.title}
              </h2>
              <div className="flex gap-3 text-sm text-gray-500 mt-1">
                <StatusBadge status={selectedVerify.status} />
                <span>Run ID: {selectedVerify.id}</span>
                <span>
                  {selectedVerify.startTime} ~ {selectedVerify.endTime}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setVerifySubTab('setting')}
              className={`px-6 py-3 text-sm font-medium ${
                verifySubTab === 'setting'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Setting & Config
            </button>
            <button
              onClick={() => setVerifySubTab('report')}
              className={`px-6 py-3 text-sm font-medium ${
                verifySubTab === 'report'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Report & Analysis
            </button>
          </div>

          {verifySubTab === 'setting' ? (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-4xl">
              <h3 className="font-bold text-gray-800 mb-4">Configuration</h3>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-xs text-gray-500 uppercase">
                    Scenario
                  </label>
                  <div className="font-medium">
                    1-1 單一帳戶大額現金頻繁存提
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">
                    Data Source Period
                  </label>
                  <div className="font-medium">2025-01-01 ~ 2025-03-31</div>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase mb-2 block">
                  Executed Script
                </label>
                <div className="bg-gray-50 p-4 rounded border border-gray-200 font-mono text-sm text-gray-600 h-48 overflow-y-auto">
                  {generatedSQL}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 text-center">
                  <div className="text-gray-500 text-xs uppercase mb-1">
                    Simulated Alerts
                  </div>
                  <div className="text-3xl font-bold text-gray-800">100</div>
                </div>
                <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 text-center">
                  <div className="text-gray-500 text-xs uppercase mb-1">
                    Actual Alerts
                  </div>
                  <div className="text-3xl font-bold text-blue-600">98</div>
                </div>
                <div className="p-6 bg-red-50 rounded-lg border border-red-100 text-center">
                  <div className="text-red-600 text-xs uppercase mb-1 font-bold">
                    Type 1 Error (誤報)
                  </div>
                  <div className="text-3xl font-bold text-red-700">1</div>
                </div>
                <div className="p-6 bg-orange-50 rounded-lg border border-orange-100 text-center">
                  <div className="text-orange-600 text-xs uppercase mb-1 font-bold">
                    Type 2 Error (漏報)
                  </div>
                  <div className="text-3xl font-bold text-orange-700">1</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-4">
                  Distribution Analysis
                </h4>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded text-gray-400">
                  Chart Placeholder (Distribution of Alerts)
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 2. Verify List View
    return (
      <div className="p-6 space-y-6 w-full">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Verify History</h2>
          <button
            onClick={() => setIsCreatingVerify(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2"
          >
            + Create Verify
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Alerts</th>
                <th className="p-4 text-right">Type 1</th>
                <th className="p-4 text-right">Type 2</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {MOCK_VERIFY_JOBS.map((job) => (
                <tr
                  key={job.id}
                  onClick={() => {
                    setSelectedVerify(job);
                    setVerifySubTab('setting');
                  }}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="p-4 font-medium text-gray-800">{job.title}</td>
                  <td className="p-4 text-gray-500">{job.date}</td>
                  <td className="p-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="p-4 text-right font-mono">{job.alerts}</td>
                  <td className="p-4 text-right font-mono text-red-500">
                    {job.type1}
                  </td>
                  <td className="p-4 text-right font-mono text-orange-500">
                    {job.type2}
                  </td>
                  <td className="p-4 text-right text-gray-400">
                    <ArrowRight size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // --- Main Render Decision ---

  if (!selectedResource) {
    return renderHomeResources();
  }

  return (
    <div className="flex h-screen w-full bg-gray-100 font-sans text-gray-800 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 flex flex-col shadow-xl z-20 flex-shrink-0">
        <div className="p-6 border-b border-gray-800">
          <div
            className="text-white font-bold text-xl tracking-wide flex items-center gap-2 cursor-pointer"
            onClick={() => setSelectedResource(null)}
          >
            <Activity className="text-blue-500" />
            XX Bank AML
          </div>
          <div className="text-gray-500 text-xs mt-1 uppercase tracking-wider">
            Accounting Engineer
          </div>
        </div>

        <nav className="flex-1 py-6 space-y-1">
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          />
          <SidebarItem
            icon={FileText}
            label="Scenario"
            active={activeTab === 'scenario'}
            onClick={() => {
              setActiveTab('scenario');
              setSelectedScenario(null);
              setIsCreatingScenario(false);
            }}
          />
          <SidebarItem
            icon={CheckCircle}
            label="Verify"
            active={activeTab === 'verify'}
            onClick={() => {
              setActiveTab('verify');
              setSelectedVerify(null);
              setIsCreatingVerify(false);
            }}
          />
          <SidebarItem
            icon={Database}
            label="Standard Fields"
            active={activeTab === 'fields'}
            onClick={() => {
              setActiveTab('fields');
              setEditingField(null);
            }}
          />
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div
            className="flex items-center gap-3 text-gray-400 group cursor-pointer"
            onClick={() => setSelectedResource(null)}
          >
            <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-blue-200 font-bold">
              U
            </div>
            <div className="text-sm">
              <div className="text-white">User001</div>
              <div className="text-xs flex items-center gap-1 group-hover:text-white">
                <LogOut size={10} /> Exit
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative w-full">
        <header className="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-6 shadow-sm z-10 flex-shrink-0 w-full">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span
              className="cursor-pointer hover:text-blue-600 hover:underline"
              onClick={() => setSelectedResource(null)}
            >
              Home
            </span>
            <ChevronRight size={14} />
            <span className="font-mono text-gray-600 truncate max-w-[150px]">
              {selectedResource.path.split('/').pop()}
            </span>
            <ChevronRight size={14} />
            <span className="capitalize text-blue-600 font-medium">
              {activeTab.replace('-', ' ')}
            </span>
            {isCreatingVerify && activeTab === 'verify' && (
              <>
                {' '}
                <ChevronRight size={14} /> Create Verify{' '}
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell
                size={20}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
            <Settings
              size={20}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            />
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gray-100 w-full">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'scenario' && renderScenario()}
          {activeTab === 'verify' && renderVerify()}
          {activeTab === 'fields' && renderStandardFields()}
        </main>
      </div>
    </div>
  );
}
