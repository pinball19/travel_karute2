/**
 * 入金情報セクションのテンプレート（行数を増やした版）
 */
const PAYMENT_TEMPLATE = [
  ['入金予定日', '入金場所', '入金予定額', '入金日', '入金額', '備考', 'チェック', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['A；入金合計', '', '', '', '', '', '', '']
];

/**
 * 入金情報セクションのマージセル設定
 */
const PAYMENT_MERGED_CELLS = [
  {row: 8, col: 0, rowspan: 1, colspan: 4} // A；入金合計
];

/**
 * 入金情報セクションのセルタイプ情報
 */
const PAYMENT_CELL_TYPES = {
  // ヘッダーセル
  headerCells: [
    {row: 0, col: 0}, {row: 0, col: 1}, {row: 0, col: 2}, {row: 0, col: 3},
    {row: 0, col: 4}, {row: 0, col: 5}, {row: 0, col: 6}, {row: 8, col: 0}
  ],
  
  // 数値入力セル（入金予定額、入金額）
  numericCells: [
    {row: 1, col: 2}, {row: 1, col: 4},
    {row: 2, col: 2}, {row: 2, col: 4},
    {row: 3, col: 2}, {row: 3, col: 4},
    {row: 4, col: 2}, {row: 4, col: 4},
    {row: 5, col: 2}, {row: 5, col: 4},
    {row: 6, col: 2}, {row: 6, col: 4},
    {row: 7, col: 2}, {row: 7, col: 4}
  ],
  
  // 日付入力セル（入金予定日、入金日）
  dateCells: [
    {row: 1, col: 0}, {row: 1, col: 3},
    {row: 2, col: 0}, {row: 2, col: 3},
    {row: 3, col: 0}, {row: 3, col: 3},
    {row: 4, col: 0}, {row: 4, col: 3},
    {row: 5, col: 0}, {row: 5, col: 3},
    {row: 6, col: 0}, {row: 6, col: 3},
    {row: 7, col: 0}, {row: 7, col: 3}
  ],
  
  // 合計セル
  totalCells: [
    {row: 8, col: 4} // 入金合計の金額セル
  ]
};

/**
 * 入金情報と計算フィールドのマッピング
 */
const PAYMENT_MAPPING = {
  // 入金額セル
  paymentAmounts: [
    {row: 1, col: 4},
    {row: 2, col: 4},
    {row: 3, col: 4},
    {row: 4, col: 4},
    {row: 5, col: 4},
    {row: 6, col: 4},
    {row: 7, col: 4}
  ],
  
  // 入金合計セル
  paymentTotal: {row: 8, col: 4}
};
