/**
 * Firebase設定
 * 実際のプロジェクト情報に置き換えてください
 */
const firebaseConfig = {
  apiKey: "AIzaSyBJmvoumJa1zcNBMNcJt4LP2Zjd2LbzEG0",
  authDomain: "travelkarute.firebaseapp.com",
  projectId: "travelkarute",
  storageBucket: "travelkarute.firebasestorage.app",
  messagingSenderId: "635350270309",
  appId: "1:635350270309:web:2498d21f9f134defeda18c",
  measurementId: "G-REHJZHXSR9"
};
// Firebaseの初期化
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/**
 * アプリケーション設定
 */
const APP_CONFIG = {
  // Firestoreのコレクション名
  KARTE_COLLECTION: 'karte',
  
  // カルテデータのフィールド名
  BASIC_DATA_FIELD: 'basicData',
  PAYMENT_DATA_FIELD: 'paymentData',
  EXPENSE_DATA_FIELD: 'expenseData',
  SUMMARY_DATA_FIELD: 'summaryData',
  
  // Handsontableの共通設定
  HOT_OPTIONS: {
    rowHeaders: true,
    colHeaders: false, // 列ヘッダーはカスタムヘッダー行に置き換え
    contextMenu: true,
    manualColumnResize: true,
    manualRowResize: true,
    fixedRowsTop: 0,
    fixedColumnsLeft: 0,
    licenseKey: 'non-commercial-and-evaluation',
    stretchH: 'all',           // カラムを幅いっぱいに伸ばす
    autoColumnSize: false,     // パフォーマンス向上のため無効化
    autoRowSize: true,         // 行の高さを自動調整
    renderAllRows: true,       // すべての行をレンダリング
    outsideClickDeselects: false, // 外部クリックによる選択解除を防止
    comments: true,            // セルコメントを有効化
    wordWrap: true,            // セル内テキストの折り返し
    allowEmpty: true,          // 空のセルを許可
    trimWhitespace: true,      // 空白を自動削除
    enterBeginsEditing: true,  // Enterでセル編集開始
    fillHandle: true,          // フィルハンドルによるドラッグを有効化
    height: 'auto',            // 高さを自動調整
    // スクロールバーの無効化
    overflow: 'visible'        // スクロールバーを表示しない
    // カスタムレンダラーは各コンポーネントで設定
  }
};

/**
 * 共通のカラム幅
 */
const COLUMN_WIDTHS = [
  140, // 1列目：項目名（幅広め）
  120, // 2列目
  120, // 3列目
  120, // 4列目
  120, // 5列目
  120, // 6列目
  120, // 7列目
  120  // 8列目
];

/**
 * グローバルデータステート（セクション間で共有するデータ）
 */
const KarteData = {
  // 現在のカルテID
  currentKarteId: null,
  
  // 各セクションのHandsontableインスタンス
  basicHot: null,
  paymentHot: null,
  expenseHot: null,
  summaryHot: null,
  
  // 共有データ
  sharedData: {
    basicInfo: {
      karteNo: '',
      departureDate: '',
      nights: 0,
      personCount: 0,
      destination: '',
      tantosha: '',
      dantaiName: ''
    },
    paymentTotal: 0,
    expenseTotal: 0,
    profit: 0,
    profitRate: 0
  },
  
  // データ更新イベント（各セクションに通知）
  updateEvent: {
    listeners: [],
    emit: function(source, data) {
      this.listeners.forEach(listener => {
        if (listener.source !== source) {
          listener.callback(data);
        }
      });
    },
    addListener: function(source, callback) {
      this.listeners.push({ source, callback });
    }
  }
};
