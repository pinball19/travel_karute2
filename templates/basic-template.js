/**
 * 基本情報セクションのテンプレート
 */
const BASIC_TEMPLATE = [
  ['【団体ナビ成約カルテ】', '', '担当；', '', '記入日;', '', '個人通N0;', ''],
  ['カルテNo', '', '名前', '', '団体名', '', '電話', ''],
  ['宿泊日', '', '泊数', '', '合計\n人数', '', '成約日', ''],
  ['出発地', '', '⇒', '行先', '', '', '', '']
];

/**
 * 基本情報セクションのマージセル設定
 */
const BASIC_MERGED_CELLS = [
  {row: 0, col: 0, rowspan: 1, colspan: 2} // 【団体ナビ成約カルテ】
];

/**
 * 基本情報セクションのセルタイプ情報
 */
const BASIC_CELL_TYPES = {
  // ヘッダーセル（ラベル）
  headerCells: [
    {row: 0, col: 0}, {row: 0, col: 2}, {row: 0, col: 4}, {row: 0, col: 6},
    {row: 1, col: 0}, {row: 1, col: 2}, {row: 1, col: 4}, {row: 1, col: 6},
    {row: 2, col: 0}, {row: 2, col: 2}, {row: 2, col: 4}, {row: 2, col: 6},
    {row: 3, col: 0}, {row: 3, col: 2}, {row: 3, col: 3}
  ],
  
  // 数値入力セル（人数、泊数）
  numericCells: [
    {row: 2, col: 3}, {row: 2, col: 5}
  ],
  
  // 日付入力セル（宿泊日、成約日）
  dateCells: [
    {row: 2, col: 1}, {row: 2, col: 7}
  ]
};

/**
 * 基本情報とマッピングの定義
 */
const BASIC_MAPPING = {
  karteNo: {row: 1, col: 1},
  tantosha: {row: 0, col: 3},
  name: {row: 1, col: 3},
  dantaiName: {row: 1, col: 5},
  phone: {row: 1, col: 7},
  stayDate: {row: 2, col: 1},
  nights: {row: 2, col: 3},
  personCount: {row: 2, col: 5},
  contractDate: {row: 2, col: 7},
  departure: {row: 3, col: 1},
  destination: {row: 3, col: 4}
};
