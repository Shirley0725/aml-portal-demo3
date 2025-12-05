import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Activity,
  CheckCircle,
  Database,
  Bell,
  Settings,
  ChevronRight,
  Folder,
  Clock,
  LogOut,
  ArrowRight,
  ArrowLeft,
  Save,
  Search,
  Play,
  Calendar,
  X,
  Server,
  RefreshCw,
  FileCode,
  AlertOctagon,
  History
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

// --- Types & Mock Data based on PDF ---

const SCENARIO_CATEGORIES = ['存提匯款', 'OBU', '資恐', '跨境交易', '已封存'];

const MOCK_SCENARIOS = [
  {
    id: '1-1',
    title: '單一帳戶大額現金頻繁存提',
    category: '存提匯款',
    desc: '同一帳戶在一定期間內之現金存、提款交易，分別累計達特定金額以上者。',
    updateTime: '2025-11-19 10:00:00',
    schedule: '月跑批',
    status: 'Active',
    params: {
        monitorDays: 30,
        txnType: ['Cash Deposit', 'Cash Withdrawal'],
        threshold: 1500000,
        thresholdType: 'Single/Daily'
    }
  },
  {
    id: '1-2',
    title: '單一客戶多帳戶大額現金頻繁存提',
    category: '存提匯款',
    desc: '同一客戶在一定期間內，於其帳戶辦理多筆現金存、提款交易，分別累計達特定金額以上者。',
    updateTime: '2025-11-19 10:00:00',
    schedule: '月跑批',
    status: 'Active',
    params: {
        monitorDays: 30,
        txnType: ['Cash Deposit', 'Cash Withdrawal'],
        threshold: 2000000,
        thresholdType: 'Cumulative'
    }
  },
  {
    id: '3-1',
    title: '多筆境內居民收款由單人集中操作',
    category: '跨境交易',
    desc: '多筆境內居民收款由單人或少數人集中操作。',
    updateTime: '2025-11-19 10:00:00',
    schedule: '日跑批',
    status: 'Active',
    params: {
        monitorDays: 5,
        personCount: 3,
        threshold: 500000,
    }
  },
  {
    id: '10-2',
    title: '年輕族群高頻轉出至高風險/NPO',
    category: '資恐',
    desc: '年輕族群、高頻轉出至高風險/NPO、立即結清。',
    updateTime: '2025-11-19 10:00:00',
    schedule: '月跑批',
    status: 'Active',
    params: {
        ageLimit: 25,
        monitorDays: 30,
        highRiskList: '2025_HighRisk_List.csv',
        npoKeywords: 'Foundation, Charity'
    }
  },
];

const MOCK_FIELDS = [
  { name: 'txn_time', type: 'timestamp', desc: '交易時間', status: 'Mapped' },
  { name: 'period_days', type: 'int', desc: '統計期間（天）', status: 'Mapped' },
  { name: 'party_id', type: 'string', desc: '客戶識別碼', status: 'Mapped' },
  { name: 'txn_amount', type: 'decimal', desc: '單筆金額', status: 'Mapped' },
  { name: 'txn_type', type: 'string', desc: '交易類別', status: 'Mapped' },
  { name: 'channel', type: 'string', desc: '交易渠道', status: 'Unmapped' },
];

const MOCK_VERIFY_JOBS = [
  {
    id: 'V-2025Q4-001',
    title: '2025 Q4 分析 - 驗證 XXXX',
    date: '2025-11-19',
    startTime: '2025-11-20 10:00',
    endTime: '2025-11-21 10:00',
    status: 'Success',
    simulatedAlerts: 100,
    actualAlerts: 98,
    type1: 1, // False Positive
    type2: 1, // False Negative
  },
  {
    id: 'V-2025Q4-002',
    title: '2025 Q4 參數調整測試',
    date: '2025-11-20',
    startTime: '2025-11-20 14:00',
    endTime: '-',
    status: 'In Progress',
    simulatedAlerts: 0,
    actualAlerts: 0,
    type1: 0,
    type2: 0,
  },
  {
    id: 'V-2025Q4-003',
    title: '2025 Q3 回溯測試',
    date: '2025-11-18',
    startTime: '2025-11-18 09:00',
    endTime: '2025-11-18 11:00',
    status: 'Failed',
    simulatedAlerts: 0,
    actualAlerts: 0,
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
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-4 ${
      active
        ? 'bg-gray-800 text-white border-blue-500'
        : 'text-gray-400 border-transparent hover:bg-gray-800 hover:text-white'
    }`}
  >
    <Icon size={18} />
    {label}
  </button>
);

const StatusBadge = ({ status }) => {
  const styles = {
    Success: 'bg-green-100 text-green-700 border border-green-200',
    Failed: 'bg-red-100 text-red-700 border border-red-200',
    'In Progress': 'bg-blue-100 text-blue-700 border border-blue-200',
    'Not Started': 'bg-gray-100 text-gray-600 border border-gray-200',
    Mapped: 'bg-green-50 text-green-700 border border-green-200',
    Unmapped: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    Active: 'bg-green-50 text-green-700 border border-green-200',
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
        styles[status] || 'bg-gray-100'
      }`}
    >
      {status}
    </span>
  );
};

// --- Main Application ---

export default function AMLPortal() {
  // Global State
  const [appState, setAppState] = useState('connect'); // 'connect' | 'processing' | 'portal'
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'fields' | 'rules' | 'verify' | 'history'
  
  // Data Processing State
  const [processingStep, setProcessingStep] = useState(0);
  
  // Scenarios State
  const [selectedCategory, setSelectedCategory] = useState('存提匯款');
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isCreatingScenario, setIsCreatingScenario] = useState(false);
  const [sqlParams, setSqlParams] = useState({
    lookbackDays: 30,
    depositThreshold: 1500000,
    withdrawalThreshold: 1500000,
    schedule: 'monthly'
  });

  // Fields State
  const [editingField, setEditingField] = useState(null);

  // Verification State
  const [selectedVerify, setSelectedVerify] = useState(null);
  const [isCreatingVerify, setIsCreatingVerify] = useState(false);
  const [verifySubTab, setVerifySubTab] = useState('setting'); // 'setting' | 'report'

  // --- Helpers for Data Processing Simulation ---
  useEffect(() => {
    if (appState === 'processing') {
      const timer = setInterval(() => {
        setProcessingStep(prev => {
          if (prev >= 3) {
            clearInterval(timer);
            return 3;
          }
          return prev + 1;
        });
      }, 1500);
      return () => clearInterval(timer);
    }
  }, [appState]);

  const generatedSQL = `-- 自動生成的 SQL 邏輯 (Based on Scenario 1-1)
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
   SUM(CASE WHEN t1.TXN_TYPE = 'CASH_DEP' THEN t1.AMOUNT ELSE 0 END) AS Total_Cash_Deposit,
   SUM(CASE WHEN t1.TXN_TYPE = 'CASH_WITH' THEN t1.AMOUNT ELSE 0 END) AS Total_Cash_Withdrawal
 FROM STANDARD_TRANSACTION t1
 WHERE t1.TXN_DATE >= DATE_SUB(CURRENT_DATE(), INTERVAL ${sqlParams.lookbackDays} DAY)
 GROUP BY t1.ACCOUNT_ID
)
SELECT * FROM Account_Aggregates
WHERE Total_Cash_Deposit >= ${sqlParams.depositThreshold} 
   OR Total_Cash_Withdrawal >= ${sqlParams.withdrawalThreshold};`;

  // --- Views ---

  // 1. Data Connection View (Initial State)
  const renderConnect = () => (
    <div className="flex flex-col h-screen w-full bg-gray-50 items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-blue-50 rounded-full">
            <Server className="text-blue-600" size={32} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">連接資料源</h2>
        <p className="text-center text-gray-500 mb-8 text-sm">請輸入資料夾路徑以讀取驗證資料 (CSV/Parquet)</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">資料夾路徑</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                defaultValue="/XX/XXXXX/2025Q3_Trade_Data"
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded border border-gray-300">
                <Folder size={18} />
              </button>
            </div>
          </div>
          <button 
            onClick={() => setAppState('processing')}
            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 rounded transition-colors flex items-center justify-center gap-2"
          >
            連接資料庫 <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  // 2. Data Processing View (Loader)
  const renderProcessing = () => (
    <div className="flex flex-col h-screen w-full bg-gray-50 items-center justify-center">
      <div className="bg-white p-10 rounded-xl shadow-lg border border-gray-200 w-full max-w-2xl">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <RefreshCw className={`text-blue-600 ${processingStep < 3 ? 'animate-spin' : ''}`} /> 
          {processingStep < 3 ? '資料處理中...' : '資料處理完成'}
        </h2>
        
        <div className="space-y-8">
          {/* Step 1 */}
          <div className="relative">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className={processingStep >= 1 ? 'text-gray-800' : 'text-gray-400'}>1. 資料擷取 (Extract)</span>
              {processingStep >= 1 && <span className="text-green-600">Done (12.5M records)</span>}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${processingStep >= 1 ? 'bg-green-500 w-full' : processingStep === 0 ? 'bg-blue-500 w-1/2' : 'w-0'}`}
              ></div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative">
             <div className="flex justify-between text-sm font-medium mb-2">
              <span className={processingStep >= 2 ? 'text-gray-800' : 'text-gray-400'}>2. 欄位標準化 (Transform)</span>
              {processingStep >= 2 && <span className="text-green-600">46/49 Mapped</span>}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                 className={`h-2 rounded-full transition-all duration-500 ${processingStep >= 2 ? 'bg-green-500 w-full' : processingStep === 1 ? 'bg-blue-500 w-2/3' : 'w-0'}`}
              ></div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative">
             <div className="flex justify-between text-sm font-medium mb-2">
              <span className={processingStep >= 3 ? 'text-gray-800' : 'text-gray-400'}>3. 資料載入 (Load)</span>
              {processingStep >= 3 && <span className="text-green-600">Ready for Analysis</span>}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
               <div 
                 className={`h-2 rounded-full transition-all duration-500 ${processingStep >= 3 ? 'bg-green-500 w-full' : processingStep === 2 ? 'bg-blue-500 w-3/4' : 'w-0'}`}
              ></div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-end">
          <button 
            disabled={processingStep < 3}
            onClick={() => setAppState('portal')}
            className={`px-6 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
              processingStep < 3 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            進入系統 (Enter Portal) <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  // 3. Main Portal Views
  const renderOverview = () => (
    <div className="p-8 space-y-8 animate-fade-in w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">總覽 (Overview)</h2>
          <p className="text-gray-500 mt-1">資料源: 2025Q3_Trade_Data (已連線)</p>
        </div>
        <div className="text-sm text-gray-500">Last updated: 2025-11-21 14:30</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertOctagon size={80} className="text-red-500" />
          </div>
          <div>
            <div className="text-gray-500 text-sm font-medium uppercase tracking-wider">發生錯誤 (Last 7 days)</div>
            <div className="text-4xl font-bold text-gray-800 mt-2">12 <span className="text-lg font-normal text-gray-400">件</span></div>
          </div>
          <div className="mt-4 flex gap-2">
            <span className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded font-medium">Type 1: 8</span>
            <span className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded font-medium">Type 2: 4</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={80} className="text-blue-500" />
          </div>
          <div>
             <div className="text-gray-500 text-sm font-medium uppercase tracking-wider">正在進行中</div>
             <div className="text-4xl font-bold text-gray-800 mt-2">5 <span className="text-lg font-normal text-gray-400">件</span></div>
          </div>
          <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5">
             <div className="bg-blue-500 h-1.5 rounded-full w-2/3"></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle size={80} className="text-green-500" />
          </div>
          <div>
            <div className="text-gray-500 text-sm font-medium uppercase tracking-wider">已完成驗證 (Last 7 days)</div>
            <div className="text-4xl font-bold text-gray-800 mt-2">128 <span className="text-lg font-normal text-gray-400">件</span></div>
          </div>
          <div className="mt-4 text-green-600 text-sm font-medium flex items-center gap-1">
            <CheckCircle size={14} /> 98% Pass Rate
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-6">驗證概況趨勢</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
              <Tooltip 
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                cursor={{fill: '#F3F4F6'}}
              />
              <Legend iconType="circle" />
              <Bar dataKey="error" fill="#EF4444" name="發生錯誤" stackId="a" radius={[0, 0, 0, 0]} barSize={40} />
              <Bar dataKey="processing" fill="#3B82F6" name="進行中" stackId="a" radius={[0, 0, 0, 0]} barSize={40} />
              <Bar dataKey="verified" fill="#10B981" name="已完成" stackId="a" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderFields = () => (
    <div className="flex h-full w-full">
      {editingField ? (
        // Field Editor Mode (Split Pane)
        <div className="flex flex-col w-full h-full bg-gray-50">
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setEditingField(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{editingField.name}</h3>
                <p className="text-xs text-gray-500">{editingField.desc}</p>
              </div>
              <StatusBadge status={editingField.status} />
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">重置</button>
              <button onClick={() => setEditingField(null)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">儲存邏輯</button>
            </div>
          </div>
          
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Source Browser */}
            <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                  <input type="text" placeholder="Search Source Tables..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-2">
                <div className="mb-4">
                  <div className="px-2 py-1 text-xs font-bold text-gray-500 uppercase">TXN_DETAIL (交易明細)</div>
                  {['TXN_ID', 'TXN_DT', 'AMT', 'CURRENCY', 'CHANNEL_ID', 'CUST_ID'].map(col => (
                    <div key={col} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded cursor-pointer group">
                      <Database size={12} className="text-gray-400 group-hover:text-blue-400" />
                      {col}
                    </div>
                  ))}
                </div>
                <div>
                   <div className="px-2 py-1 text-xs font-bold text-gray-500 uppercase">CUST_MASTER (客戶主檔)</div>
                    {['CUST_ID', 'ID_NUMBER', 'RISK_LEVEL', 'NATIONALITY'].map(col => (
                    <div key={col} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded cursor-pointer group">
                      <Database size={12} className="text-gray-400 group-hover:text-blue-400" />
                      {col}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Logic Editor & Preview */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 p-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">轉換規則 (SQL Expression)</label>
                <textarea 
                  className="w-full h-64 border border-gray-300 rounded font-mono text-sm p-4 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                  defaultValue={`-- Map source AMT to txn_amount\nCASE \n  WHEN CURRENCY = 'TWD' THEN AMT\n  ELSE AMT * ExchangeRate\nEND`}
                ></textarea>
                
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                     <label className="block text-sm font-bold text-gray-700">轉換預覽 (Preview)</label>
                     <button className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800"><Play size={12}/> Run Test</button>
                  </div>
                  <div className="bg-slate-900 rounded text-slate-300 font-mono text-xs p-4 h-32 overflow-auto">
                    &gt; Running transformation on sample data...<br/>
                    &gt; Input: AMT=1000, CURRENCY='USD'<br/>
                    &gt; <span className="text-green-400">Output: 32000.00</span><br/>
                    &gt; Status: OK
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Field List Mode
        <div className="p-8 w-full max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">標準欄位對映 (Field Mapping)</h2>
            <div className="flex gap-2">
               <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">46 Mapped</span>
               <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm font-medium">3 Pending</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="p-5">標準化欄位名稱</th>
                  <th className="p-5">資料型態</th>
                  <th className="p-5">欄位簡述</th>
                  <th className="p-5">對映狀態</th>
                  <th className="p-5 text-right">動作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {MOCK_FIELDS.map((field, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="p-5 font-mono font-medium text-blue-700">{field.name}</td>
                    <td className="p-5 text-gray-500 font-mono text-xs">{field.type}</td>
                    <td className="p-5 text-gray-700">{field.desc}</td>
                    <td className="p-5"><StatusBadge status={field.status} /></td>
                    <td className="p-5 text-right">
                      <button 
                        onClick={() => setEditingField(field)}
                        className="text-gray-500 hover:text-blue-600 font-medium text-xs border border-gray-200 px-3 py-1.5 rounded bg-white hover:bg-blue-50 transition-colors"
                      >
                        編輯規則
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderScenarioRules = () => {
    if (selectedScenario) {
      // Scenario Detail / Edit Mode
      return (
        <div className="flex flex-col h-full w-full bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
            <div className="flex items-center gap-4">
               <button onClick={() => setSelectedScenario(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {selectedScenario.title}
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-normal border border-gray-200">
                    {selectedScenario.id}
                  </span>
                </h2>
                <div className="flex gap-4 text-xs text-gray-500 mt-1">
                  <span>類別: {selectedScenario.category}</span>
                  <span>排程: {selectedScenario.schedule}</span>
                  <span>更新: {selectedScenario.updateTime}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 text-gray-700">
                <History size={16} /> 變更紀錄
              </button>
              <button onClick={() => setSelectedScenario(null)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 shadow-sm">
                <Save size={16} /> 儲存設定
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex">
            {/* Left: Parameters Form */}
            <div className="w-1/2 p-8 overflow-y-auto border-r border-gray-200 bg-white">
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-blue-600"/> 規則描述
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded border border-gray-200">
                  {selectedScenario.desc}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Settings size={16} className="text-blue-600"/> 參數設定 (Parameters)
                </h3>
                <div className="space-y-6">
                  {/* Parameter Inputs */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">監控期間 (Lookback Days)</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={sqlParams.lookbackDays}
                          onChange={(e) => setSqlParams({...sqlParams, lookbackDays: e.target.value})}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                        <span className="absolute right-3 top-2 text-xs text-gray-400">天</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">排程規則</label>
                      <select 
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        defaultValue="monthly"
                      >
                        <option value="daily">日跑批</option>
                        <option value="monthly">月跑批</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">交易類型 (Transaction Types)</label>
                    <div className="flex gap-3">
                      {['現金存 (Cash Dep)', '現金提 (Cash Wth)'].map(type => (
                        <label key={type} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded border border-gray-200 cursor-pointer hover:bg-gray-100 w-full">
                          <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                          {type}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded border border-blue-100">
                    <div className="grid grid-cols-2 gap-6">
                       <div>
                        <label className="block text-xs font-bold text-blue-800 mb-1.5">現金存款累計門檻 (TWD)</label>
                        <input 
                          type="number" 
                          value={sqlParams.depositThreshold}
                          onChange={(e) => setSqlParams({...sqlParams, depositThreshold: e.target.value})}
                          className="w-full border border-blue-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-blue-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-blue-800 mb-1.5">現金提款累計門檻 (TWD)</label>
                        <input 
                          type="number" 
                          value={sqlParams.withdrawalThreshold}
                          onChange={(e) => setSqlParams({...sqlParams, withdrawalThreshold: e.target.value})}
                          className="w-full border border-blue-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-blue-900 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* More Params based on category (Example) */}
                  {selectedScenario.category === '資恐' && (
                     <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">高風險國家清單</label>
                        <div className="flex gap-2">
                           <input type="text" disabled value="2025_HighRisk_List.csv" className="flex-1 bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm text-gray-500" />
                           <button className="px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 text-sm">Upload</button>
                        </div>
                     </div>
                  )}

                </div>
              </div>
            </div>

            {/* Right: SQL Preview */}
            <div className="w-1/2 bg-slate-900 flex flex-col">
              <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-2">
                  <FileCode size={12} /> GENERATED_SCRIPT.sql
                </span>
                <span className="text-[10px] text-slate-500 uppercase">Read Only</span>
              </div>
              <div className="flex-1 p-6 overflow-auto">
                 <pre className="font-mono text-sm text-green-400 leading-relaxed whitespace-pre-wrap">
                   {generatedSQL}
                 </pre>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // List Mode
    return (
      <div className="p-8 w-full max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">態樣規則 (Scenario Rules)</h2>
          <button 
             onClick={() => setIsCreatingScenario(true)}
             className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 shadow-sm flex items-center gap-2"
          >
            + 新增規則
          </button>
        </div>

        {/* Categories */}
        <div className="border-b border-gray-200">
           <nav className="-mb-px flex space-x-8">
             {SCENARIO_CATEGORIES.map(cat => (
               <button
                 key={cat}
                 onClick={() => setSelectedCategory(cat)}
                 className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                   selectedCategory === cat
                     ? 'border-blue-500 text-blue-600'
                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                 }`}
               >
                 {cat}
               </button>
             ))}
           </nav>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="p-5 w-20">編號</th>
                  <th className="p-5">態樣標題</th>
                  <th className="p-5 w-32">更新時間</th>
                  <th className="p-5 w-24">排程</th>
                  <th className="p-5 w-20">狀態</th>
                  <th className="p-5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {MOCK_SCENARIOS
                  .filter(s => s.category === selectedCategory || selectedCategory === '已封存')
                  .map(scenario => (
                  <tr 
                    key={scenario.id} 
                    onClick={() => setSelectedScenario(scenario)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors group"
                  >
                    <td className="p-5 font-mono text-gray-500">{scenario.id}</td>
                    <td className="p-5">
                      <div className="font-medium text-gray-900 group-hover:text-blue-700">{scenario.title}</div>
                      <div className="text-xs text-gray-500 mt-1 truncate max-w-md">{scenario.desc}</div>
                    </td>
                    <td className="p-5 text-gray-500 text-xs">{scenario.updateTime.split(' ')[0]}</td>
                    <td className="p-5 text-gray-500">{scenario.schedule}</td>
                    <td className="p-5"><StatusBadge status={scenario.status} /></td>
                    <td className="p-5 text-gray-400 group-hover:text-blue-500"><ChevronRight size={18}/></td>
                  </tr>
                ))}
                {MOCK_SCENARIOS.filter(s => s.category === selectedCategory).length === 0 && (
                   <tr>
                     <td colSpan="6" className="p-10 text-center text-gray-400">
                        此類別尚無態樣規則
                     </td>
                   </tr>
                )}
              </tbody>
           </table>
        </div>
      </div>
    );
  };

  const renderVerification = () => {
    // 1. Create Verification Modal/Page
    if (isCreatingVerify) {
      return (
        <div className="flex flex-col h-full w-full bg-gray-50 items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-2xl overflow-hidden animate-fade-in">
             <div className="px-8 py-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
               <h2 className="text-xl font-bold text-gray-900">新增態樣驗證 (Create Verification)</h2>
               <button onClick={() => setIsCreatingVerify(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
             </div>
             
             <div className="p-8 space-y-6">
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">驗證標題 (Title)</label>
                 <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., 2025 Q4 Analysis - Scenario 1-1" />
               </div>
               
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">選擇態樣規則 (Scenario)</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option>請選擇態樣...</option>
                    {MOCK_SCENARIOS.map(s => (
                      <option key={s.id} value={s.id}>{s.id} {s.title}</option>
                    ))}
                  </select>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">資料區間 (Start)</label>
                    <div className="relative">
                      <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">資料區間 (End)</label>
                    <div className="relative">
                      <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                    </div>
                  </div>
               </div>
               
               <div className="bg-blue-50 p-4 rounded text-sm text-blue-800 flex gap-2 items-start">
                 <AlertOctagon size={16} className="mt-0.5 flex-shrink-0" />
                 此操作將會啟動後端運算腳本，預計耗時 10-15 分鐘。
               </div>
             </div>

             <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
               <button onClick={() => setIsCreatingVerify(false)} className="px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-200 rounded">取消</button>
               <button onClick={() => setIsCreatingVerify(false)} className="px-4 py-2 text-sm text-white font-medium bg-black hover:bg-gray-800 rounded flex items-center gap-2">
                 <Play size={14} /> 儲存並開始驗證
               </button>
             </div>
          </div>
        </div>
      );
    }

    // 2. Verification Detail (Report)
    if (selectedVerify) {
      return (
        <div className="flex flex-col h-full w-full bg-gray-50">
           {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-4">
               <button onClick={() => setSelectedVerify(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedVerify.title}</h2>
                <div className="flex gap-3 text-xs text-gray-500 mt-1 items-center">
                  <StatusBadge status={selectedVerify.status} />
                  <span className="font-mono">{selectedVerify.id}</span>
                  <span className="flex items-center gap-1"><Clock size={12}/> {selectedVerify.startTime} ~ {selectedVerify.endTime}</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons based on status */}
            <div className="flex gap-2">
               {selectedVerify.status === 'In Progress' ? (
                 <button className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded text-sm hover:bg-red-100 font-medium">
                   <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div> 停止驗證
                 </button>
               ) : (
                 <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 text-gray-700 bg-white">
                   <RefreshCw size={16} /> 重新執行
                 </button>
               )}
            </div>
          </div>

          {/* Report Content */}
          <div className="flex-1 overflow-y-auto p-8">
             <div className="max-w-5xl mx-auto space-y-8">
               
               {/* KPI Cards */}
               <div className="grid grid-cols-4 gap-6">
                 <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                   <div className="text-xs text-gray-500 uppercase font-bold mb-1">Simulated Alerts (模擬)</div>
                   <div className="text-3xl font-bold text-gray-900">{selectedVerify.simulatedAlerts}</div>
                 </div>
                 <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                   <div className="text-xs text-gray-500 uppercase font-bold mb-1">Actual Alerts (實際)</div>
                   <div className="text-3xl font-bold text-blue-600">{selectedVerify.actualAlerts}</div>
                 </div>
                 {/* Type 1 Error */}
                 <div className="bg-red-50 p-5 rounded-lg border border-red-100 relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="text-xs text-red-600 uppercase font-bold mb-1">Type 1 Error (誤報)</div>
                      <div className="text-3xl font-bold text-red-700">{selectedVerify.type1}</div>
                      <div className="text-xs text-red-400 mt-1">False Positive</div>
                    </div>
                    <AlertOctagon className="absolute -right-2 -bottom-2 text-red-100" size={64} />
                 </div>
                 {/* Type 2 Error */}
                 <div className="bg-orange-50 p-5 rounded-lg border border-orange-100 relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="text-xs text-orange-600 uppercase font-bold mb-1">Type 2 Error (漏報)</div>
                      <div className="text-3xl font-bold text-orange-700">{selectedVerify.type2}</div>
                      <div className="text-xs text-orange-400 mt-1">False Negative</div>
                    </div>
                     <AlertOctagon className="absolute -right-2 -bottom-2 text-orange-100" size={64} />
                 </div>
               </div>

               {/* Comparison Table / Details */}
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-bold text-gray-800">驗證詳細比對結果</h3>
                 </div>
                 <table className="w-full text-left text-sm">
                   <thead className="bg-white border-b border-gray-100 text-gray-500">
                     <tr>
                       <th className="p-4">Alert ID</th>
                       <th className="p-4">Customer</th>
                       <th className="p-4 text-right">Amount</th>
                       <th className="p-4">Simulation Result</th>
                       <th className="p-4">Actual System</th>
                       <th className="p-4">Discrepancy</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {[1,2,3,4,5].map(i => (
                       <tr key={i} className="hover:bg-gray-50">
                         <td className="p-4 font-mono text-gray-600">ALT-2025-{1000+i}</td>
                         <td className="p-4">CUST-{900+i}</td>
                         <td className="p-4 text-right font-mono">1,500,000</td>
                         <td className="p-4"><span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Hit</span></td>
                         <td className="p-4"><span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Hit</span></td>
                         <td className="p-4 text-gray-400">-</td>
                       </tr>
                     ))}
                     {/* Error Example Row */}
                     <tr className="bg-red-50 hover:bg-red-100">
                         <td className="p-4 font-mono text-red-800 font-bold">ALT-2025-1099</td>
                         <td className="p-4">CUST-999</td>
                         <td className="p-4 text-right font-mono">1,499,999</td>
                         <td className="p-4"><span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-bold">No Hit</span></td>
                         <td className="p-4"><span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Hit</span></td>
                         <td className="p-4"><span className="text-red-600 font-bold text-xs">Type 1 Error</span></td>
                     </tr>
                   </tbody>
                 </table>
               </div>

             </div>
          </div>
        </div>
      );
    }

    // 3. List Mode
    return (
      <div className="p-8 w-full max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">態樣驗證 (Verification)</h2>
          <button 
             onClick={() => setIsCreatingVerify(true)}
             className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 shadow-sm flex items-center gap-2"
          >
            + 新增驗證 (Create Job)
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
           {['All', 'Completed', 'In Progress', 'Failed'].map(f => (
             <button key={f} className="px-4 py-1.5 rounded-full text-sm border border-gray-200 bg-white hover:bg-gray-50 text-gray-600">{f}</button>
           ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="p-5">驗證標題</th>
                  <th className="p-5">執行時間</th>
                  <th className="p-5">狀態</th>
                  <th className="p-5 text-right">Simulated</th>
                  <th className="p-5 text-right">Type 1 Err</th>
                  <th className="p-5 text-right">Type 2 Err</th>
                  <th className="p-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {MOCK_VERIFY_JOBS.map(job => (
                  <tr 
                    key={job.id} 
                    onClick={() => setSelectedVerify(job)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="p-5 font-medium text-gray-900">
                      {job.title}
                      <div className="text-xs text-gray-400 mt-1 font-mono">{job.id}</div>
                    </td>
                    <td className="p-5 text-gray-500 text-xs">
                      <div>Start: {job.startTime}</div>
                      <div>End: {job.endTime}</div>
                    </td>
                    <td className="p-5"><StatusBadge status={job.status} /></td>
                    <td className="p-5 text-right font-mono font-bold">{job.simulatedAlerts}</td>
                    <td className="p-5 text-right font-mono text-red-600">{job.type1 > 0 ? job.type1 : '-'}</td>
                    <td className="p-5 text-right font-mono text-orange-600">{job.type2 > 0 ? job.type2 : '-'}</td>
                    <td className="p-5 text-gray-400 text-right"><ChevronRight size={18}/></td>
                  </tr>
                ))}
              </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="p-8 w-full max-w-7xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">歷史紀錄 (History)</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center text-gray-400">
         <History size={48} className="mx-auto mb-4 text-gray-300" />
         <p>Audit logs and system history will be displayed here.</p>
      </div>
    </div>
  );

  // --- Main Layout ---

  if (appState === 'connect') return renderConnect();
  if (appState === 'processing') return renderProcessing();

  return (
    <div className="flex h-screen w-full bg-gray-100 font-sans text-gray-800 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 flex flex-col shadow-xl z-20 flex-shrink-0">
        <div className="p-6 border-b border-gray-800">
          <div className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
            <Activity className="text-blue-500" />
            AML Portal
          </div>
          <div className="text-gray-500 text-xs mt-1 uppercase tracking-wider">Internal Verification</div>
        </div>

        <nav className="flex-1 py-6 space-y-1">
          <SidebarItem 
            icon={LayoutDashboard} label="總覽 (Overview)" 
            active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} 
          />
          <SidebarItem 
            icon={Database} label="標準欄位 (Mapping)" 
            active={activeTab === 'fields'} onClick={() => { setActiveTab('fields'); setEditingField(null); }} 
          />
          <SidebarItem 
            icon={FileText} label="態樣規則 (Rules)" 
            active={activeTab === 'rules'} onClick={() => { setActiveTab('rules'); setSelectedScenario(null); }} 
          />
          <SidebarItem 
            icon={CheckCircle} label="態樣驗證 (Verify)" 
            active={activeTab === 'verify'} onClick={() => { setActiveTab('verify'); setSelectedVerify(null); setIsCreatingVerify(false); }} 
          />
           <SidebarItem 
            icon={History} label="歷史紀錄 (History)" 
            active={activeTab === 'history'} onClick={() => setActiveTab('history')} 
          />
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 text-gray-400 group cursor-pointer hover:text-white transition-colors" onClick={() => setAppState('connect')}>
             <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-blue-200 font-bold text-xs">
              U1
            </div>
            <div className="text-sm overflow-hidden">
              <div className="text-gray-300 font-medium truncate">User001</div>
              <div className="text-xs flex items-center gap-1 group-hover:text-red-400">
                <LogOut size={10} /> 登出 / Change Source
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative w-full">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-6 shadow-sm z-10 flex-shrink-0">
           <div className="text-sm flex items-center gap-2 text-gray-500">
             <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">2025Q3_Trade_Data</span>
             <ChevronRight size={14} />
             <span className="capitalize font-medium text-blue-600">{activeTab}</span>
           </div>
           <div className="flex items-center gap-4">
             <div className="relative cursor-pointer hover:bg-gray-100 p-2 rounded-full transition-colors">
               <Bell size={20} className="text-gray-500" />
               <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
             </div>
           </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-gray-100 w-full relative">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'fields' && renderFields()}
          {activeTab === 'rules' && renderScenarioRules()}
          {activeTab === 'verify' && renderVerification()}
          {activeTab === 'history' && renderHistory()}
        </main>
      </div>
    </div>
  );
}
