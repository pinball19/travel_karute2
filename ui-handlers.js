/**
 * UIイベントハンドラーを管理するファイル
 * ユーザーインターフェースの各要素に対するイベントリスナーを設定します
 */

/**
 * メインボタンのイベントリスナーをセットアップ
 * @param {Object} app - KarteAppオブジェクト
 */
function setupMainButtonListeners(app) {
  // 保存ボタン
  document.getElementById('save-btn').addEventListener('click', () => { 
    saveKarte(app); 
  });
  
  // 新規ボタン
  document.getElementById('new-btn').addEventListener('click', () => {
    if (app.hasChanges && !confirm('保存されていない変更があります。新規カルテを作成しますか？')) { 
      return; 
    }
    app.createNew();
  });
  
  // 開くボタン
  document.getElementById('open-btn').addEventListener('click', () => { 
    loadKarteList(app); 
  });
  
  // エクスポートボタン
  document.getElementById('export-btn').addEventListener('click', () => { 
    exportToExcel(app); 
  });
}

/**
 * フォームフィールドのイベントリスナーをセットアップ
 * @param {Object} app - KarteAppオブジェクト
 */
function setupFormFieldListeners(app) {
  // 自動計算フィールド
  document.getElementById('departure-date').addEventListener('change', () => app.calculateNights());
  document.getElementById('return-date').addEventListener('change', () => app.calculateNights());
  document.getElementById('total-amount').addEventListener('input', () => app.calculateUnitPrice());
  document.getElementById('total-persons').addEventListener('input', () => app.calculateUnitPrice());
  
  // 国内/海外選択時のカルテ番号プレフィックス設定
  document.getElementById('travel-type').addEventListener('change', (e) => {
    const prefix = e.target.value === 'domestic' ? 'D' : 'I';
    const karteNoInput = document.getElementById('karte-no');
    const currentValue = karteNoInput.value;
    // 既存のD/Iプレフィックスを取り除く
    let numericPart = currentValue.replace(/^[DI]-/, '');
    karteNoInput.value = `${prefix}-${numericPart}`;
    app.markHasChanges();
  });
  
  // 行き先が「その他」の場合にテキスト入力を表示
  document.getElementById('destination').addEventListener('change', (e) => {
    const otherInput = document.getElementById('destination-other');
    if (e.target.value === 'other') {
      otherInput.style.display = 'block';
    } else {
      otherInput.style.display = 'none';
    }
    app.markHasChanges();
  });
  
  // その他の入力フィールドに変更を監視
  const allInputs = document.querySelectorAll('input, select, textarea');
  allInputs.forEach(input => {
    if (input.id !== 'search' && input.id !== 'comment-text') {
      input.addEventListener('change', () => app.markHasChanges());
      if (input.tagName === 'TEXTAREA' || input.type === 'text' || input.type === 'number') {
        input.addEventListener('input', () => app.markHasChanges());
      }
    }
  });
}

/**
 * 入金情報関連のイベントリスナーをセットアップ
 * @param {Object} app - KarteAppオブジェクト
 */
function setupPaymentListeners(app) {
  // 入金情報の追加ボタン
  document.getElementById('add-payment').addEventListener('click', () => {
    // モーダルを初期化して表示
    document.getElementById('payment-due-date').value = '';
    document.getElementById('payment-date').value = '';
    document.getElementById('payment-amount').value = '';
    document.getElementById('payment-place').value = '';
    document.getElementById('payment-notes').value = '';
    document.getElementById('payment-modal').style.display = 'block';
  });
  
  // 入金情報の保存ボタン
  document.getElementById('save-payment').addEventListener('click', () => {
    const payment = {
      id: Date.now().toString(), // ユニークID
      dueDate: document.getElementById('payment-due-date').value,
      date: document.getElementById('payment-date').value,
      amount: parseFloat(document.getElementById('payment-amount').value) || 0,
      place: document.getElementById('payment-place').value,
      notes: document.getElementById('payment-notes').value
    };
    app.payments.push(payment);
    renderPayments(app);
    updateSummary(app);
    document.getElementById('payment-modal').style.display = 'none';
    app.markHasChanges();
  });
}

/**
 * 支払情報関連のイベントリスナーをセットアップ
 * @param {Object} app - KarteAppオブジェクト
 */
function setupExpenseListeners(app) {
  // 支払情報の追加ボタン
  document.getElementById('add-expense').addEventListener('click', () => {
    // モーダルを初期化して表示
    document.getElementById('expense-date').value = '';
    document.getElementById('expense-vendor').value = '';
    document.getElementById('expense-phone').value = '';
    document.getElementById('expense-person').value = '';
    document.getElementById('expense-due-date').value = '';
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-status').value = '未手配';
    document.getElementById('expense-notes').value = '';
    document.getElementById('expense-modal').style.display = 'block';
  });
  
  // 支払情報の保存ボタン
  document.getElementById('save-expense').addEventListener('click', () => {
    const expense = {
      id: Date.now().toString(), // ユニークID
      date: document.getElementById('expense-date').value,
      vendor: document.getElementById('expense-vendor').value,
      phone: document.getElementById('expense-phone').value,
      person: document.getElementById('expense-person').value,
      dueDate: document.getElementById('expense-due-date').value,
      amount: parseFloat(document.getElementById('expense-amount').value) || 0,
      status: document.getElementById('expense-status').value,
      notes: document.getElementById('expense-notes').value
    };
    app.expenses.push(expense);
    renderExpenses(app);
    updateSummary(app);
    document.getElementById('expense-modal').style.display = 'none';
    app.markHasChanges();
  });
}

/**
 * コメント関連のイベントリスナーをセットアップ
 * @param {Object} app - KarteAppオブジェクト
 */
function setupCommentListeners(app) {
  // コメント投稿ボタン
  document.getElementById('post-comment').addEventListener('click', () => {
    const commentText = document.getElementById('comment-text').value.trim();
    if (commentText) {
      const comment = {
        id: Date.now().toString(),
        text: commentText,
        date: new Date().toISOString(),
        author: document.getElementById('company-person').value || '担当者'
      };
      app.comments.unshift(comment); // 新しいコメントを先頭に追加
      renderComments(app);
      document.getElementById('comment-text').value = '';
      app.markHasChanges();
    }
  });
  
  // Enter キーでもコメント投稿可能に
  document.getElementById('comment-text').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      document.getElementById('post-comment').click();
    }
  });
}

/**
 * モーダル関連のイベントリスナーをセットアップ
 * @param {Object} app - KarteAppオブジェクト
 */
function setupModalListeners(app) {
  // 閉じるボタン
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
      });
    });
  });
  
  // 検索機能
  document.getElementById('search').addEventListener('input', (e) => { 
    filterKarteList(app, e.target.value); 
  });
  
  // モーダル背景クリックで閉じる
  window.addEventListener('click', (event) => { 
    document.querySelectorAll('.modal').forEach(modal => {
      if (event.target === modal) { 
        modal.style.display = 'none'; 
      }
    });
  });
}

/**
 * 接続状態監視のイベントリスナーをセットアップ
 * @param {Object} app - KarteAppオブジェクト
 */
function setupConnectionListeners(app) {
  // オンラインになった時
  window.addEventListener('online', () => {
    document.getElementById('connection-status').textContent = 'オンライン';
    document.getElementById('connection-status').style.color = '';
    showNotification('ネットワーク接続が復旧しました', 'success');
  });
  
  // オフラインになった時
  window.addEventListener('offline', () => {
    document.getElementById('connection-status').textContent = 'オフライン';
    document.getElementById('connection-status').style.color = 'red';
    showNotification('オフライン状態になりました', 'warning');
  });
}
