/**
 * アプリケーションのメインエントリーポイント
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded: アプリケーションを初期化します');
  
  // DOM要素
  const saveButton = document.getElementById('save-button');
  const newButton = document.getElementById('new-button');
  const openButton = document.getElementById('open-button');
  const exportButton = document.getElementById('export-button');
  const closeModal = document.querySelector('.close-modal');
  const karteListModal = document.getElementById('karte-list-modal');
  
  // アプリケーションの状態変数
  let isInitialized = false;
  
  // カルテ検索機能の設定
  function setupKarteSearch() {
    const searchInput = document.getElementById('karte-search');
    const clearButton = document.getElementById('clear-search');
    
    if (!searchInput || !clearButton) return;
    
    // 検索実行
    searchInput.addEventListener('input', function() {
      const searchText = this.value.toLowerCase();
      filterKarteList(searchText);
    });
    
    // 検索クリア
    clearButton.addEventListener('click', function() {
      searchInput.value = '';
      filterKarteList('');
      searchInput.focus();
    });
    
    // 検索結果のフィルタリング
    function filterKarteList(searchText) {
      const rows = document.querySelectorAll('#karte-list-body tr');
      
      rows.forEach(row => {
        if (!searchText) {
          row.style.display = '';
          return;
        }
        
        const cells = row.querySelectorAll('td');
        let found = false;
        
        cells.forEach(cell => {
          if (cell.textContent.toLowerCase().includes(searchText)) {
            found = true;
          }
        });
        
        row.style.display = found ? '' : 'none';
      });
      
      // 検索結果がない場合のメッセージ
      const tbody = document.getElementById('karte-list-body');
      const noResults = document.getElementById('no-results-message');
      
      // 表示されている行があるか確認
      const hasVisibleRows = Array.from(rows).some(row => row.style.display !== 'none');
      
      // 検索結果がない場合のメッセージを表示
      if (!hasVisibleRows && searchText) {
        if (!noResults) {
          const message = document.createElement('tr');
          message.id = 'no-results-message';
          message.innerHTML = `<td colspan="9" style="text-align: center; padding: 20px;">検索結果が見つかりません。検索条件「${searchText}」に一致するカルテはありません。</td>`;
          tbody.appendChild(message);
        }
      } else if (noResults) {
        noResults.remove();
      }
    }
  }
  
  // 初期化処理
  function initialize() {
    if (isInitialized) return;
    
    try {
      console.log('アプリケーションを初期化します');
      
      // データマネージャーの初期化
      DataManager.initialize();
      
      // 各セクションのスプレッドシートを初期化
      BasicInfoManager.initialize();
      PaymentInfoManager.initialize();
      ExpenseInfoManager.initialize();
      SummaryInfoManager.initialize();
      
      // 検索機能の設定
      setupKarteSearch();
      
      isInitialized = true;
      console.log('初期化完了');
    } catch (error) {
      console.error('初期化中にエラーが発生しました:', error);
      
      // 500ms後に再試行
      setTimeout(() => {
        if (!isInitialized) {
          console.log('初期化を再試行します');
          initialize();
        }
      }, 500);
    }
  }
  
  // 初期化を実行
  initialize();
  
  // 初期化が間違いなく実行されるようにする
  setTimeout(() => {
    if (!isInitialized) {
      console.log('初期化の再確認');
      initialize();
    }
  }, 1000);
  
  // ウィンドウサイズ変更時にセクションの高さを調整
  window.addEventListener('resize', () => {
    adjustSectionHeights();
  });
  
  // セクションの高さ調整
  function adjustSectionHeights() {
    BasicInfoManager.adjustHeight();
    PaymentInfoManager.adjustHeight();
    ExpenseInfoManager.adjustHeight();
    SummaryInfoManager.adjustHeight();
  }
  
  // 保存ボタンのイベント
  saveButton.addEventListener('click', () => {
    try {
      console.log('カルテを保存します');
      DataManager.saveKarte();
    } catch (error) {
      console.error('保存中にエラーが発生しました:', error);
      alert(`保存中にエラーが発生しました: ${error.message}`);
    }
  });
  
  // 新規ボタンのイベント
  newButton.addEventListener('click', () => {
    try {
      console.log('新規カルテを作成します');
      DataManager.createNewKarte();
    } catch (error) {
      console.error('新規作成中にエラーが発生しました:', error);
      alert(`新規作成中にエラーが発生しました: ${error.message}`);
    }
  });
  
  // 開くボタンのイベント
  openButton.addEventListener('click', () => {
    try {
      console.log('カルテ一覧を表示します');
      DataManager.loadKarteList();
      karteListModal.style.display = 'block';
    } catch (error) {
      console.error('カルテ一覧の読み込み中にエラーが発生しました:', error);
      alert(`カルテ一覧の読み込み中にエラーが発生しました: ${error.message}`);
    }
  });
  
  // 出力ボタンのイベント
  exportButton.addEventListener('click', () => {
    try {
      console.log('カルテをエクスポートします');
      const result = DataManager.exportToExcel();
      
      if (result) {
        console.log('エクスポートが完了しました');
      } else {
        console.error('エクスポート中にエラーが発生しました');
        alert('エクスポート中にエラーが発生しました');
      }
    } catch (error) {
      console.error('エクスポート中にエラーが発生しました:', error);
      alert(`エクスポート中にエラーが発生しました: ${error.message}`);
    }
  });
  
  // モーダルを閉じるボタンのイベント
  closeModal.addEventListener('click', () => {
    karteListModal.style.display = 'none';
  });
  
  // モーダル外をクリックした時にも閉じる
  window.addEventListener('click', (event) => {
    if (event.target === karteListModal) {
      karteListModal.style.display = 'none';
    }
  });
  
  // ESCキーでモーダルを閉じる
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && karteListModal.style.display === 'block') {
      karteListModal.style.display = 'none';
    }
  });
  
  // オフライン状態の検出
  window.addEventListener('offline', () => {
    document.getElementById('connection-status').textContent = 'オフライン';
    document.getElementById('connection-status').style.color = 'red';
    console.warn('ネットワーク接続がオフラインになりました');
  });
  
  // オンライン状態の検出
  window.addEventListener('online', () => {
    document.getElementById('connection-status').textContent = 'オンライン';
    document.getElementById('connection-status').style.color = '';
    console.log('ネットワーク接続が復旧しました');
  });
  
  // アプリケーション終了前の保存確認
  window.addEventListener('beforeunload', (event) => {
    // 未保存の変更がある場合
    if (DataManager.currentKarteId && document.getElementById('last-saved').textContent === '保存されていません') {
      const message = '変更が保存されていない可能性があります。ページを離れますか？';
      event.returnValue = message;
      return message;
    }
  });
  
  // コンテナの初期セットアップ
  setTimeout(() => {
    // 各セクションの高さを調整
    adjustSectionHeights();
    
    // セクション間の間隔を調整
    const containers = document.querySelectorAll('.section-container');
    containers.forEach(container => {
      container.style.marginBottom = '20px';
    });
    
    // スクロールバーをトップに
    const scrollContainer = document.querySelector('.spreadsheet-container');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }, 1000);
});
