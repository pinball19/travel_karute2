/**
 * 入金情報セクションの管理（行追加・削除対応版）
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
      height: 'auto',        // 高さを自動調整
      autoRowSize: true,     // 行高さを自動調整
      stretchH: 'all',       // 横幅をコンテナに合わせる
      viewportRowRenderingOffset: 1000, // 十分な行を一度にレンダリング
      renderAllRows: true,   // すべての行を一度にレンダリング
      
      // 行の追加操作後のフック
      afterCreateRow: function(index, amount) {
        console.log(`入金情報: ${amount}行が位置${index}に追加されました`);
        PaymentInfoManager.handleRowOperation(index, amount, 'add');
      },
      
      // 行の削除操作後のフック
      afterRemoveRow: function(index, amount) {
        console.log(`入金情報: ${amount}行が位置${index}から削除されました`);
        PaymentInfoManager.handleRowOperation(index, amount, 'remove');
      },
      
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
   * 行の追加・削除操作を処理
   * @param {number} index - 操作された行のインデックス
   * @param {number} amount - 操作された行数
   * @param {string} operation - 操作タイプ ('add'または'remove')
   */
  handleRowOperation: function(index, amount, operation) {
    // まず現在のマッピング情報を取得
    const currentData = this.hot.getData();
    const currentRowCount = currentData.length;
    
    // 合計行の位置を特定（データから動的に検索）
    let totalRowIndex = -1;
    for (let i = 0; i < currentRowCount; i++) {
      if (currentData[i][0] === 'A；入金合計') {
        totalRowIndex = i;
        break;
      }
    }
    
    // 合計行が見つからなかった場合は追加
    if (totalRowIndex === -1) {
      // データの最後に合計行を追加
      totalRowIndex = currentRowCount;
      const totalRow = Array(currentData[0].length).fill('');
      totalRow[0] = 'A；入金合計';
      this.hot.alter('insert_row', totalRowIndex);
      this.hot.setDataAtRow(totalRowIndex, totalRow);
    }
    
    // マージセル設定を更新
    this.updateMergeCells(totalRowIndex);
    
    // 入金額セルの計算対象を更新
    this.updatePaymentMapping(totalRowIndex);
    
    // 合計を再計算
    this.calculatePaymentTotal();
    
    // レンダリング
    this.hot.render();
  },
  
  /**
   * マージセル設定を更新
   * @param {number} totalRowIndex - 合計行のインデックス
   */
  updateMergeCells: function(totalRowIndex) {
    // 既存のマージセル設定を取得
    const mergeCells = this.hot.getSettings().mergeCells || [];
    
    // 合計行のマージセル情報を更新または追加
    let totalRowMergeUpdated = false;
    
    for (let i = 0; i < mergeCells.length; i++) {
      // 既存の合計行マージを探す（行の内容で判断）
      if (mergeCells[i].row === totalRowIndex || 
          (this.hot.getDataAtCell(mergeCells[i].row, 0) === 'A；入金合計')) {
        // 合計行のマージを更新
        mergeCells[i].row = totalRowIndex;
        totalRowMergeUpdated = true;
        break;
      }
    }
    
    // 合計行のマージが見つからなければ追加
    if (!totalRowMergeUpdated) {
      mergeCells.push({
        row: totalRowIndex,
        col: 0,
        rowspan: 1,
        colspan: 4
      });
    }
    
    // マージセル設定を更新
    this.hot.updateSettings({
      mergeCells: mergeCells
    });
  },
  
  /**
   * 入金額セルのマッピングを更新
   * @param {number} totalRowIndex - 合計行のインデックス
   */
  updatePaymentMapping: function(totalRowIndex) {
    // ヘッダー行（インデックス0）と合計行以外の全ての行を入金額セルとして設定
    const newPaymentAmounts = [];
    
    for (let i = 1; i < totalRowIndex; i++) {
      newPaymentAmounts.push({
        row: i,
        col: 4 // 入金額列（E列）
      });
    }
    
    // マッピングを更新
    PAYMENT_MAPPING.paymentAmounts = newPaymentAmounts;
    PAYMENT_MAPPING.paymentTotal = {
      row: totalRowIndex,
      col: 4 // 入金合計の金額セル
    };
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
      
      // 合計行の位置を特定（データから動的に検索）
      let totalRowIndex = -1;
      for (let i = 0; i < data.length; i++) {
        if (data[i][0] === 'A；入金合計') {
          totalRowIndex = i;
          break;
        }
      }
      
      // 合計行が見つからなかった場合は処理しない
      if (totalRowIndex === -1) {
        console.warn('入金合計行が見つかりません');
        return 0;
      }
      
      // マッピングを更新
      this.updatePaymentMapping(totalRowIndex);
      
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
      this.hot.setDataAtCell(totalRowIndex, 4, total, 'internal');
      
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
    
    try {
      // 再レンダリングして高さを更新
      this.hot.render();
      
      // テーブルの実際の高さを取得
      const table = this.hot.rootElement.querySelector('.htCore');
      if (table) {
        // コンテナの高さをテーブルの高さに合わせる
        const actualHeight = table.offsetHeight;
        this.hot.rootElement.style.height = actualHeight + 'px';
        
        // 親コンテナにも高さを設定
        const containerElement = this.hot.rootElement.closest('.hot-container');
        if (containerElement) {
          containerElement.style.height = actualHeight + 'px';
        }
      }
    } catch (error) {
      console.error('高さ調整中にエラーが発生しました:', error);
    }
  }
};
