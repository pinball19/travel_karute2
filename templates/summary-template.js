/**
 * 収支情報セクションのテンプレート
 */
const SUMMARY_TEMPLATE = [
  ['報告日', '利益率', '利益額', '一人粗利', '旅行総額/A', '支払総額/B', '人数', '特補人数'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['上席チェック', '何月/何日に利益申請', '', '', '', '', '', '']
];

/**
 * 収支情報セクションのマージセル設定
 */
const SUMMARY_MERGED_CELLS = [
  {row: 3, col: 0, rowspan: 1, colspan: 2} // 上席チェック
];

/**
 * 収支情報セクションのセルタイプ情報
 */
const SUMMARY_CELL_TYPES = {
  // ヘッダーセル
  headerCells: [
    {row: 0, col: 0}, {row: 0, col: 1}, {row: 0, col: 2}, {row: 0, col: 3},
    {row: 0, col: 4}, {row: 0, col: 5}, {row: 0, col: 6}, {row: 0, col: 7},
    {row: 3, col: 0}
  ],
  
  // 数値入力セル
  numericCells: [
    {row: 1, col: 2}, // 利益額
    {row: 1, col: 3}, // 一人粗利
    {row: 1, col: 4}, // 旅行総額
    {row: 1, col: 5}, // 支払総額
    {row: 1, col: 6}, // 人数
    {row: 1, col: 7}  // 特補人数
  ],
  
  // パーセンテージセル
  percentageCells: [
    {row: 1, col: 1} // 利益率
  ],
  
  // 日付入力セル
  dateCells: [
    {row: 1, col: 0} // 報告日
  ]
};

/**
 * 収支情報と計算フィールドのマッピング
 */
const SUMMARY_MAPPING = {
  // 計算結果表示セル
  reportDate: {row: 1, col: 0},   // 報告日
  profitRate: {row: 1, col: 1},    // 利益率
  profitAmount: {row: 1, col: 2},  // 利益額
  profitPerPerson: {row: 1, col: 3}, // 一人粗利
  totalAmount: {row: 1, col: 4},   // 旅行総額/A
  totalExpense: {row: 1, col: 5},  // 支払総額/B
  personCount: {row: 1, col: 6},   // 人数
  specialCount: {row: 1, col: 7}   // 特補人数
};
