/**
 * 支払情報セクションの管理
 */
const ExpenseInfoManager = {
  // Handsontableインスタンス
  hot: null,
  
  /**
   * 初期化
   */
  initialize: function() {
    const container = document.getElementById('expense-container');
    if (!container) {
      console.error('expense-containerが見つかりません');
      return;
    }
    
    // テンプレートデータを準備（ディープコピー）
    const data = JSON.parse(JSON.stringify(EXPENSE_TEMPLATE));
    
    // Handsontableの設定オプション
    const options = {
      data: data,
      ...APP_CONFIG.HOT_OPTIONS,
      colHeaders: false,
      colWidths: COLUMN_WIDTHS,
      mergeCells: EXPENSE_MERGED_CELLS,
      // セルのカスタマイズ
      cells: function(row, col) {
        const cellProperties = {};
        
        // ヘッダーセル
        const isHeaderCell = EXPENSE_CELL_TYPES.headerCells.some(cell => 
          cell.row === row && cell.col === col
        );
        if (isHeaderCell) {
          cellProperties.className = 'header-cell';
          cellProperties.readOnly = true;
        }
        
        // 数値入力セル（支払金額）
        const isNumericCell = EXPENSE_CELL_TYPES.numericCells.some(cell => 
          cell.row === row && cell.col === col
        );
        if (isNumericCell) {
          cellProperties.type = 'numeric';
          cellProperties.numericFormat = {
            pattern: '0,0',
            culture: 'ja-JP'
          };
        }
        
        // 日付入力セル
        const isDateCell = EXPENSE_CELL_TYPES.dateCells.some(cell => 
          cell.row === row && cell.col === col
        );
        if (isDateCell) {
          cellProperties.type = 'date';
          cellProperties.dateFormat = 'YYYY/MM/DD';
        }
        
        // 合計セル
        const isTotalCell = EXPENSE_CELL_TYPES.totalCells.some(cell => 
          cell.row === row && cell.col === col
        );
        if (isTotalCell) {
          cellProperties.className = 'total-cell';
          cellProperties.readOnly = true;
        }
        
        return cellProperties;
      },
      // データ変更後のフック
      afterChange: function(changes, source) {
        if (source === 'edit' || source === 'paste') {
          ExpenseInfoManager.calculateExpenseTotal();
        }
      }
    };
    
    // Handsontableの初期化
    this.hot = new Handsontable(container, options);
    
    // グローバルインスタンスに保存
    KarteData.expenseHot = this.hot;
    
    // イベントリスナーの設定
    this.setupEventListeners();
    
    // レンダリング
    this.hot.render();
  },
  
  /**
   * イベントリスナーの設定
   */
  setupEventListeners: function() {
    // 更新イベントのリスナーを登録
    KarteData.updateEvent.addListener('expense-info', (data) => {
      // 他のセクションからの更新を処理
      if (data.type === 'summary-update') {
        // 必要に応じて処理を追加
      }
    });
  },
  
  /**
   * 支払合計を計算
   */
  calculateExpenseTotal: function() {
    if (!this.hot) return;
    
    try {
      console.log('支払合計を計算します');
      
      // 現在のデータを取得
      const data = this.hot.getData();
      
      // 支払金額セル（指定された行のF列＝インデックス5）の値を合計
      let total = 0;
      
      EXPENSE_MAPPING.expenseAmounts.forEach(cell => {
        if (data[cell.row] && data[cell.row][cell.col] !== undefined && data[cell.row][cell.col] !== null && data[cell.row][cell.col] !== '') {
          const value = parseFloat(String(data[cell.row][cell.col]).replace(/,/g, ''));
          if (!isNaN(value)) {
            total += value;
            console.log(`支払金額 (${cell.row+1},${cell.col+1}): ${value}`);
          }
        }
      });
      
      console.log('支払合計:', total);
      
      // 合計を表示するセル（B；支払合計）を更新
      const totalCell = EXPENSE_MAPPING.expenseTotal;
      this.hot.setDataAtCell(totalCell.row, totalCell.col, total, 'internal');
      
      // 共有データを更新して他のセクションに通知
      KarteData.sharedData.expenseTotal = total;
      
      // 更新イベントを発行
      KarteData.updateEvent.emit('expense', {
        type: 'expense-update',
        expenseTotal: total
      });
      
      return total;
    } catch (error) {
      console.error('支払合計の計算中にエラーが発生しました:', error);
      return 0;
    }
  },
  
  /**
   * セクションの高さを調整
   */
  adjustHeight: function() {
    if (!this.hot) return;
    
    // コンテナの高さをテーブルサイズに合わせて調整
    const container = this.hot.rootElement;
    if (container) {
      const table = container.querySelector('.handsontable');
      if (table) {
        container.style.height = table.offsetHeight + 'px';
      }
    }
  }
};
