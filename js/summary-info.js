/**
 * 収支情報セクションの管理
 */
const SummaryInfoManager = {
  // Handsontableインスタンス
  hot: null,
  
  /**
   * 初期化
   */
  initialize: function() {
    const container = document.getElementById('summary-container');
    if (!container) {
      console.error('summary-containerが見つかりません');
      return;
    }
    
    // テンプレートデータを準備（ディープコピー）
    const data = JSON.parse(JSON.stringify(SUMMARY_TEMPLATE));
    
    // Handsontableの設定オプション
    const options = {
      data: data,
      ...APP_CONFIG.HOT_OPTIONS,
      colHeaders: false,
      colWidths: COLUMN_WIDTHS,
      mergeCells: SUMMARY_MERGED_CELLS,
      height: 'auto',        // 高さを自動調整
      autoRowSize: true,     // 行高さを自動調整
      stretchH: 'all',       // 横幅をコンテナに合わせる
      viewportRowRenderingOffset: 1000, // 十分な行を一度にレンダリング
      renderAllRows: true,   // すべての行を一度にレンダリング
      
      // セルのカスタマイズ
      cells: function(row, col) {
        const cellProperties = {};
        
        // ヘッダーセル
        const isHeaderCell = SUMMARY_CELL_TYPES.headerCells.some(cell => 
          cell.row === row && cell.col === col
        );
        if (isHeaderCell) {
          cellProperties.className = 'header-cell';
          cellProperties.readOnly = true;
        }
        
        // 数値入力セル
        const isNumericCell = SUMMARY_CELL_TYPES.numericCells.some(cell => 
          cell.row === row && cell.col === col
        );
        if (isNumericCell) {
          cellProperties.type = 'numeric';
          cellProperties.numericFormat = {
            pattern: '0,0',
            culture: 'ja-JP'
          };
          cellProperties.readOnly = true; // 計算値は編集不可
        }
        
        // パーセンテージセル
        const isPercentCell = SUMMARY_CELL_TYPES.percentageCells.some(cell => 
          cell.row === row && cell.col === col
        );
        if (isPercentCell) {
          cellProperties.type = 'text'; // パーセント記号を含むので文字列として扱う
          cellProperties.readOnly = true; // 計算値は編集不可
        }
        
        // 日付入力セル
        const isDateCell = SUMMARY_CELL_TYPES.dateCells.some(cell => 
          cell.row === row && cell.col === col
        );
        if (isDateCell) {
          cellProperties.type = 'date';
          cellProperties.dateFormat = 'YYYY/MM/DD';
        }
        
        return cellProperties;
      }
    };
    
    // Handsontableの初期化
    this.hot = new Handsontable(container, options);
    
    // グローバルインスタンスに保存
    KarteData.summaryHot = this.hot;
    
    // イベントリスナーの設定
    this.setupEventListeners();
    
    // レンダリング
    this.hot.render();
    
    // 初期値を設定（現在の日付を報告日に）
    const today = new Date();
    const formattedDate = today.getFullYear() + '/' + 
                          ('0' + (today.getMonth() + 1)).slice(-2) + '/' + 
                          ('0' + today.getDate()).slice(-2);
    this.hot.setDataAtCell(1, 0, formattedDate, 'internal');
  },
  
  /**
   * イベントリスナーの設定
   */
  setupEventListeners: function() {
    // 更新イベントのリスナーを登録
    KarteData.updateEvent.addListener('summary-info', (data) => {
      // 支払情報または入金情報が更新された場合は収支計算を更新
      if (data.type === 'payment-update' || data.type === 'expense-update' || data.type === 'basic-update') {
        this.updateSummary();
      }
      
      // データマネージャーからの更新を反映
      if (data.type === 'summary-update') {
        this.updateSummaryFromData(data.data);
      }
    });
  },
  
  /**
   * 収支情報を更新
   */
  updateSummary: function() {
    if (!this.hot) return;
    
    try {
      console.log('収支情報を更新します');
      
      // 共有データから値を取得
      const paymentTotal = KarteData.sharedData.paymentTotal || 0;
      const expenseTotal = KarteData.sharedData.expenseTotal || 0;
      const personCount = KarteData.sharedData.basicInfo.personCount || 0;
      
      // 利益額を計算
      const profit = paymentTotal - expenseTotal;
      
      // 利益率を計算
      let profitRate = 0;
      if (paymentTotal > 0) {
        profitRate = (profit / paymentTotal * 100).toFixed(1);
      }
      
      // 一人当たりの粗利を計算
      let profitPerPerson = 0;
      if (personCount > 0) {
        profitPerPerson = Math.round(profit / personCount);
      }
      
      console.log(`収支計算: 旅行総額=${paymentTotal}, 支払総額=${expenseTotal}, 利益額=${profit}, 利益率=${profitRate}%, 一人粗利=${profitPerPerson}`);
      
      // 収支情報を更新
      const changes = [
        [SUMMARY_MAPPING.profitRate.row, SUMMARY_MAPPING.profitRate.col, profitRate + '%'],
        [SUMMARY_MAPPING.profitAmount.row, SUMMARY_MAPPING.profitAmount.col, profit],
        [SUMMARY_MAPPING.profitPerPerson.row, SUMMARY_MAPPING.profitPerPerson.col, profitPerPerson],
        [SUMMARY_MAPPING.totalAmount.row, SUMMARY_MAPPING.totalAmount.col, paymentTotal],
        [SUMMARY_MAPPING.totalExpense.row, SUMMARY_MAPPING.totalExpense.col, expenseTotal],
        [SUMMARY_MAPPING.personCount.row, SUMMARY_MAPPING.personCount.col, personCount]
      ];
      
      // 値を更新
      this.hot.setDataAtCell(changes, 'internal');
    } catch (error) {
      console.error('収支情報の更新中にエラーが発生しました:', error);
    }
  },
  
  /**
   * データから収支情報を更新
   * @param {Object} data - 更新データ
   */
  updateSummaryFromData: function(data) {
    if (!this.hot || !data) return;
    
    try {
      // データマッピングを使用してセルを更新
      const changes = [];
      
      if (data.profitRate !== undefined) {
        changes.push([SUMMARY_MAPPING.profitRate.row, SUMMARY_MAPPING.profitRate.col, data.profitRate]);
      }
      
      if (data.profitAmount !== undefined) {
        changes.push([SUMMARY_MAPPING.profitAmount.row, SUMMARY_MAPPING.profitAmount.col, data.profitAmount]);
      }
      
      if (data.profitPerPerson !== undefined) {
        changes.push([SUMMARY_MAPPING.profitPerPerson.row, SUMMARY_MAPPING.profitPerPerson.col, data.profitPerPerson]);
      }
      
      if (data.totalAmount !== undefined) {
        changes.push([SUMMARY_MAPPING.totalAmount.row, SUMMARY_MAPPING.totalAmount.col, data.totalAmount]);
      }
      
      if (data.totalExpense !== undefined) {
        changes.push([SUMMARY_MAPPING.totalExpense.row, SUMMARY_MAPPING.totalExpense.col, data.totalExpense]);
      }
      
      if (data.personCount !== undefined) {
        changes.push([SUMMARY_MAPPING.personCount.row, SUMMARY_MAPPING.personCount.col, data.personCount]);
      }
      
      // 変更があれば更新
      if (changes.length > 0) {
        this.hot.setDataAtCell(changes, 'internal');
      }
    } catch (error) {
      console.error('データからの収支情報更新中にエラーが発生しました:', error);
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
