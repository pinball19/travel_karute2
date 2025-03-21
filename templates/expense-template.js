/**
 * 支払情報セクションのテンプレート
 */
const EXPENSE_TEMPLATE = [
  ['利用日', '手配先名；該当に〇を付ける', '電話/FAX', '担当者', '支払予定日', '支払金額', 'チェック', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['B；支払合計', '', '', '', '', '', '', '']
];

/**
 * 支払情報セクションのマージセル設定
 */
const EXPENSE_MERGED_CELLS = [
  {row: 6, col: 0, rowspan: 1, colspan: 5} // B；支払合計
];

/**
 * 支払情報セクションのセルタイプ情報
 */
const EXPENSE_CELL_TYPES = {
  // ヘッダーセル
  headerCells: [
    {row: 0, col: 0}, {row: 0, col: 1}, {row: 0, col: 2}, {row: 0, col: 3},
    {row: 0, col: 4}, {row: 0, col: 5}, {row: 0, col: 6}, {row: 6, col: 0}
  ],
  
  // 数値入力セル（支払金額）
  numericCells: [
    {row: 1, col: 5}, {row: 2, col: 5}, {row: 3, col: 5},
    {row: 4, col: 5}, {row: 5, col: 5}
  ],
  
  // 日付入力セル（利用日、支払予定日）
  dateCells: [
    {row: 1, col: 0}, {row: 1, col: 4},
    {row: 2, col: 0}, {row: 2, col: 4},
    {row: 3, col: 0}, {row: 3, col: 4},
    {row: 4, col: 0}, {row: 4, col: 4},
    {row: 5, col: 0}, {row: 5, col: 4}
  ],
  
  // 合計セル
  totalCells: [
    {row: 6, col: 5} // 支払合計の金額セル
  ]
};

/**
 * 支払情報と計算フィールドのマッピング
 */
const EXPENSE_MAPPING = {
  // 支払金額セル
  expenseAmounts: [
    {row: 1, col: 5},
    {row: 2, col: 5},
    {row: 3, col: 5},
    {row: 4, col: 5},
    {row: 5, col: 5}
  ],
  
  // 支払合計セル
  expenseTotal: {row: 6, col: 5}
};
