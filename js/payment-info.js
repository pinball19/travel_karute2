/**
 * 基本情報セクションの管理
 */
const BasicInfoManager = {
  // Handsontableインスタンス
  hot: null,
  
  /**
   * 初期化
   */
  initialize: function() {
    const container = document.getElementById('basic-container');
    if (!container) {
      console.error('basic-containerが見つかりません');
      return;
    }
    
    // テンプレートデータを準備（ディープコピー）
    const data = JSON.parse(JSON.stringify(BASIC_TEMPLATE));
    
    // Handsontableの設定オプション
    const options = {
      data: data,
      ...APP_CONFIG.HOT_OPTIONS,
      colHeaders: false,
      colWidths: COLUMN_WIDTHS,
      mergeCells: BASIC_MERGED_CELLS,
      // セルのカスタマイズ
      cells: function(row, col) {
        const cellProperties = {};
        
        // ヘッダーセル（ラベル）
        const isHeaderCell = BASIC_CELL_TYPES.headerCells.some(cell => 
          cell.row === row && cell.col === col
        );
        if (isHeaderCell) {
          cellProperties.className = 'header-cell';
          cellProperties.readOnly = true;
        }
        
        // 数値入力セル
        const isNumericCell = BASIC_CELL_TYPES.numericCells.some(cell => 
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
        const isDateCell = BASIC_CELL_TYPES.dateCells.some(cell => 
          cell.row === row && cell.col === col
        );
        if (isDateCell) {
          cellProperties.type = 'date';
          cellProperties.dateFormat = 'YYYY/MM/DD';
        }
        
        return cellProperties;
      },
      // データ変更後のフック
      afterChange: function(changes, source) {
        if (source === 'edit' || source === 'paste') {
          BasicInfoManager.handleDataChange(changes);
        }
      }
    };
    
    // Handsontableの初期化
    this.hot = new Handsontable(container, options);
    
    // グローバルインスタンスに保存
    KarteData.basicHot = this.hot;
    
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
    KarteData.updateEvent.addListener('basic-info', (data) => {
      // 他のセクションからの更新を処理
      if (data.type === 'summary-update') {
        // 必要に応じて処理を追加
      }
    });
  },
  
  /**
   * データ変更を処理
   * @param {Array} changes - 変更されたセルの情報
   */
  handleDataChange: function(changes) {
    if (!changes || !changes.length) return;
    
    let personCountChanged = false;
    
    // 変更を処理
    changes.forEach(([row, col, oldValue, newValue]) => {
      // マッピングから変更されたフィールドを特定
      for (const [field, cell] of Object.entries(BASIC_MAPPING)) {
        if (cell.row === row && cell.col === col) {
          // 人数フィールドの変更を検出
          if (field === 'personCount') {
            personCountChanged = true;
          }
          break;
        }
      }
    });
    
    // 人数が変更された場合、基本情報を更新して他のセクションに通知
    if (personCountChanged) {
      this.updateBasicInfo();
    }
  },
  
  /**
   * 基本情報を更新して他のセクションに通知
   */
  updateBasicInfo: function() {
    if (!this.hot) return;
    
    // 現在のデータを取得
    const data = this.hot.getData();
    
    // 基本情報を抽出
    const basicInfo = {};
    
    for (const [key, cell] of Object.entries(BASIC_MAPPING)) {
      if (data[cell.row] && data[cell.row][cell.col] !== undefined) {
        basicInfo[key] = data[cell.row][cell.col];
      }
    }
    
    // personCountは数値に変換
    if (basicInfo.personCount) {
      const count = parseFloat(String(basicInfo.personCount).replace(/,/g, ''));
      basicInfo.personCount = isNaN(count) ? 0 : count;
    }
    
    // 更新イベントを発行
    KarteData.updateEvent.emit('basic', {
      type: 'basic-update',
      personCount: basicInfo.personCount,
      basicInfo: basicInfo
    });
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
