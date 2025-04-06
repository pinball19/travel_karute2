/**
 * カルテアプリケーションのメインファイル
 * 他のモジュールを統合し、アプリケーションを初期化します
 */

// カルテアプリケーションのメインオブジェクト
const KarteApp = {
  // アプリケーション内で使用する状態変数
  currentId: null,     // 現在開いているカルテのID
  hasChanges: false,   // 未保存の変更があるかどうか
  payments: [],        // 入金情報の配列
  expenses: [],        // 支払情報の配列
  comments: [],        // コメントの配列
  debounceTimer: null, // debounce用タイマー
  
  /**
   * アプリケーションの初期化
   */
  init: function() {
    console.log("KarteApp.init() start");
    
    // イベントリスナーのセットアップ
    this.setupEventListeners();
    
    // 新規カルテを作成
    this.createNew();
    
    // スマホの場合はカルテ一覧モーダルを自動表示
    if (/Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent)) {
      document.getElementById('list-modal').style.display = 'block';
    }
    
    console.log("KarteApp.init() end");
  },
  
  /**
   * イベントリスナーのセットアップ
   */
  setupEventListeners: function() {
    // メインボタン
    setupMainButtonListeners(this);
    
    // フォーム入力フィールド
    setupFormFieldListeners(this);
    
    // 入金情報関連
    setupPaymentListeners(this);
    
    // 支払情報関連
    setupExpenseListeners(this);
    
    // コメント関連
    setupCommentListeners(this);
    
    // モーダル関連
    setupModalListeners(this);
    
    // オンライン・オフライン監視
    setupConnectionListeners(this);
    
    // ページ離脱前の確認
    window.addEventListener('beforeunload', (e) => {
      if (this.hasChanges) {
        e.preventDefault();
        e.returnValue = '保存されていない変更があります。ページを離れますか？';
        return e.returnValue;
      }
    });
  },
  
  /**
   * 新規カルテの作成
   */
  createNew: function() {
    console.log("createNew() called");
    
    // 状態の初期化
    this.currentId = null;
    document.getElementById('current-karte-id').textContent = '新規カルテ';
    document.getElementById('last-saved').textContent = '-';
    
    // 全フォームフィールドをクリア
    clearAllFormFields();
    
    // カルテ番号の初期値設定
    initializeKarteNumber();
    
    // データ配列の初期化
    this.payments = [];
    this.expenses = [];
    this.comments = [];
    
    // 各セクションを再描画
    renderPayments(this);
    renderExpenses(this);
    renderComments(this);
    updateSummary(this);
    
    // 変更フラグをリセット
    this.hasChanges = false;
  },
  
  /**
   * 泊数の自動計算
   */
  calculateNights: function() {
    const departureDate = document.getElementById('departure-date').value;
    const returnDate = document.getElementById('return-date').value;
    
    if (departureDate && returnDate) {
      const start = new Date(departureDate);
      const end = new Date(returnDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      document.getElementById('nights').value = diffDays;
      this.markHasChanges();
    }
  },
  
  /**
   * 単価の自動計算
   */
  calculateUnitPrice: function() {
    const amount = parseFloat(document.getElementById('total-amount').value) || 0;
    const persons = parseInt(document.getElementById('total-persons').value) || 0;
    
    if (amount > 0 && persons > 0) {
      const unitPrice = Math.round(amount / persons);
      document.getElementById('unit-price').value = unitPrice;
      this.markHasChanges();
    } else {
      document.getElementById('unit-price').value = '';
    }
  },
  
  /**
   * 変更があったことをマーク
   */
  markHasChanges: function() { 
    this.hasChanges = true; 
  }
};

/**
 * カルテ番号の初期値を設定
 */
function initializeKarteNumber() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  document.getElementById('karte-no').value = `D-${yyyy}${mm}${dd}-`;
  document.getElementById('travel-type').value = 'domestic';
}

/**
 * 全フォームフィールドをクリア
 */
function clearAllFormFields() {
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    if (input.type === 'checkbox' || input.type === 'radio') {
      input.checked = false;
    } else {
      input.value = '';
    }
  });
  
  // 「その他」の行き先入力欄を非表示
  document.getElementById('destination-other').style.display = 'none';
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => { 
  KarteApp.init(); 
});
