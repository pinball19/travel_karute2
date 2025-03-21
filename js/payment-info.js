/**
 * 入金情報セクションの管理
 */
const PaymentInfoManager = {
  // Handsontableインスタンス
  hot: null,
  
  /**
   * 初期化
   */
  initialize: function() {
    const container = document.getElementById('payment-container');
    if (!container) {
      console.error('payment-containerが見つかりません');
      return;
    }
    
    // テンプレートデータを準備（ディープコピー）
    const data = JSON.parse(JSON.stringify(PAYMENT_TEMPLATE));
    
    // Handsontableの設定オプション
    const options = {
      data: data,
      ...APP_CONFIG.HOT_OPTIONS,
      colHeaders: false,
      colWidths: COLUMN_WIDTHS,
      mergeCells: PAYMENT_MERGED_CELLS,
      // セルのカスタマイズ
      cells: function(row, col) {
        const cellProperties = {};
        
        // ヘッダーセル
        const isHeaderCell = PAYMENT_CELL_TYPES.headerCells.some(cell => 
          cell.row === row && cell.col === col
        );
        if (isHeaderCell) {
          cellProperties.className = 'header-cell';
          cellProperties.readOnly = true;
        }
        
        // 数値入力セル（入金予定額、入金額）
        const isNumericCell = PAYMENT_CELL_TYPES.numericCells.some(cell => 
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
        const isDateCell = PAYMENT_CELL_TYPES.dateCells.some(cell => 
          cell.row === row && cell.col === col
        );
        if (isDateCell) {
          cellProperties.type = 'date';
          cellProperties.dateFormat = 'YYYY/MM/DD';
        }
        
        // 合計セル
        const isTotalCell = PAYMENT_CELL_TYPES.totalCells.some(cell => 
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
          PaymentInfoManager.calculatePaymentTotal();
        }
      }
    };
    
    // Handsontableの初期化
    this.hot = new Handsontable(container, options);
    
    // グローバルインスタンスに保存
    KarteData.paymentHot = this.hot;
    
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
    KarteData.updateEvent.addListener('payment-info', (data) => {
      // 他のセクションからの更新を処理
      if (data.type === 'summary-update') {
        // 必要に応じて処理を追加
      }
    });
  },
  
  /**
   * 入金合計を計算
   */
  calculatePaymentTotal: function() {
    if (!this.hot) return;
    
    try {
      console.log('入金合計を計算します');
      
      // 現在のデータを取得
      const data = this.hot.getData();
      
      // 入金額セル（指定された行のE列＝インデックス4）の値を合計
      let total = 0;
      
      PAYMENT_MAPPING.paymentAmounts.forEach(cell => {
        if (data[cell.row] && data[cell.row][cell.col] !== undefined && data[cell.row][cell.col] !== null && data[cell.row][cell.col] !== '') {
          const value = parseFloat(String(data[cell.row][cell.col]).replace(/,/g, ''));
          if (!isNaN(value)) {
            total += value;
            console.log(`入金額 (${cell.row+1},${cell.col+1}): ${value}`);
          }
        }
      });
      
      console.log('入金合計:', total);
      
      // 合計を表示するセル（A；入金合計）を更新
      const totalCell = PAYMENT_MAPPING.paymentTotal;
      this.hot.setDataAtCell(totalCell.row, totalCell.col, total, 'internal');
      
      // 共有データを更新して他のセクションに通知
      KarteData.sharedData.paymentTotal = total;
      
      // 更新イベントを発行
      KarteData.updateEvent.emit('payment', {
        type: 'payment-update',
        paymentTotal: total
      });
      
      return total;
    } catch (error) {
      console.error('入金合計の計算中にエラーが発生しました:', error);
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
