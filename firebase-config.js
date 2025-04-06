/**
 * Firebase設定と初期化ファイル
 * このファイルではFirebaseの設定と初期化を行います
 */

// Firebase設定オブジェクト - 実際のプロジェクト設定に置き換えてください
const firebaseConfig = {
  apiKey: "AIzaSyExample",
  authDomain: "travelkarute.firebaseapp.com",
  projectId: "travelkarute",
  storageBucket: "travelkarute.appspot.com",
  messagingSenderId: "635350270309",
  appId: "1:635350270309:web:2498d21f9f134defeda18c"
};

// グローバル変数
let db; 

/**
 * Firebase初期化
 */
function initializeFirebase() {
  try {
    // Firebaseアプリの初期化
    firebase.initializeApp(firebaseConfig);
    
    // Firestoreインスタンスを取得
    db = firebase.firestore();
    
    // オフライン対応のためのデータ永続化を有効化
    db.enablePersistence({ synchronizeTabs: true })
      .catch(err => { 
        console.warn("Firebase永続化エラー:", err);
        // エラーが発生してもアプリは動作し続けます
      });
      
    console.log("Firebase初期化完了");
    
    // オンライン状態のチェック
    if (!navigator.onLine) {
      document.getElementById('connection-status').textContent = 'オフライン';
      document.getElementById('connection-status').style.color = 'red';
    }
    
  } catch (error) {
    console.error("Firebase初期化エラー:", error);
    // 致命的なエラーが発生した場合はユーザーに通知
    setTimeout(() => { 
      alert("サーバー接続に問題が発生しました。ページをリロードしてください。"); 
    }, 1000);
  }
}

// ページ読み込み時にFirebaseを初期化
document.addEventListener('DOMContentLoaded', initializeFirebase);
