/**
 * データ管理モジュール
 * セクション間のデータ連携やFirebaseとの通信を担当
 */
const DataManager = {
  // 現在のカルテID
  currentKarteId: null,
  
  // リアルタイムリスナー
  realtimeListener: null,
  
  // 最後のローカル更新タイムスタンプ
  lastLocalUpdate: 0,
  
  // 更新中フラグ（リアルタイム更新のループ防止用）
  isUpdating: false,
  
  /**
   * 初期化
   */
  initialize: function() {
    // データ更新イベントのリスナーを登録
    // 各セクションからの更新を他のセクションに伝播
    this.setupUpdateListeners();
    
    // オフライン/オンライン検出
    this.setupConnectionListeners();
  },
  
  /**
   * 更新リスナーの設定
   */
  setupUpdateListeners: function() {
    // 各セクションからのデータ更新イベントを処理
    KarteData.updateEvent.addListener('basic', (data) => {
      // 基本情報が更新された場合の処理
      if (data.personCount) {
        // 人数情報を収支情報に反映
        KarteData.sharedData.basicInfo.personCount = data.personCount;
        this.updateSummarySection();
      }
    });
    
    KarteData.updateEvent.addListener('payment', (data) => {
      // 入金情報が更新された場合の処理
      if (data.paymentTotal !== undefined) {
        KarteData.sharedData.paymentTotal = data.paymentTotal;
        this.updateSummarySection();
      }
    });
    
    KarteData.updateEvent.addListener('expense', (data) => {
      // 支払情報が更新された場合の処理
      if (data.expenseTotal !== undefined) {
        KarteData.sharedData.expenseTotal = data.expenseTotal;
        this.updateSummarySection();
      }
    });
  },
  
  /**
   * 接続状態リスナーの設定
   */
  setupConnectionListeners: function() {
    window.addEventListener('offline', () => {
      document.getElementById('connection-status').textContent = 'オフライン';
      document.getElementById('connection-status').style.color = 'red';
    });
    
    window.addEventListener('online', () => {
      document.getElementById('connection-status').textContent = 'オンライン';
      document.getElementById('connection-status').style.color = '';
      
      // 現在開いているカルテがあれば、リアルタイムリスナーを再設定
      if (this.currentKarteId) {
        this.attachRealtimeListener(this.currentKarteId);
      }
    });
  },
  
  /**
   * 収支情報の更新
   */
  updateSummarySection: function() {
    // 基本データの取得
    const personCount = KarteData.sharedData.basicInfo.personCount || 0;
    
    // 入金合計と支払合計の取得
    const paymentTotal = KarteData.sharedData.paymentTotal || 0;
    const expenseTotal = KarteData.sharedData.expenseTotal || 0;
    
    // 利益額の計算
    const profit = paymentTotal - expenseTotal;
    
    // 利益率の計算
    let profitRate = 0;
    if (paymentTotal > 0) {
      profitRate = (profit / paymentTotal * 100).toFixed(1);
    }
    
    // 一人当たり粗利の計算
    let profitPerPerson = 0;
    if (personCount > 0) {
      profitPerPerson = Math.round(profit / personCount);
    }
    
    // 収支情報のデータを更新
    const summaryData = {
      profitRate: profitRate + '%',
      profitAmount: profit,
      profitPerPerson: profitPerPerson,
      totalAmount: paymentTotal,
      totalExpense: expenseTotal,
      personCount: personCount
    };
    
    // 収支情報セクションに通知
    KarteData.updateEvent.emit('data-manager', {
      type: 'summary-update',
      data: summaryData
    });
  },
  
  /**
   * カルテデータを読み込む
   * @param {string} karteId - カルテID
   */
  loadKarteData: function(karteId) {
    this.currentKarteId = karteId;
    
    // 既存のリアルタイムリスナーがあれば削除
    this.detachRealtimeListener();
    
    db.collection(APP_CONFIG.KARTE_COLLECTION).doc(karteId).get()
      .then(doc => {
        if (doc.exists) {
          const data = doc.data();
          
          // 各セクションのデータを取得
          const basicData = data[APP_CONFIG.BASIC_DATA_FIELD] || BASIC_TEMPLATE;
          const paymentData = data[APP_CONFIG.PAYMENT_DATA_FIELD] || PAYMENT_TEMPLATE;
          const expenseData = data[APP_CONFIG.EXPENSE_DATA_FIELD] || EXPENSE_TEMPLATE;
          const summaryData = data[APP_CONFIG.SUMMARY_DATA_FIELD] || SUMMARY_TEMPLATE;
          
          // 基本情報を抽出してsharedDataに保存
          this.extractBasicInfo(basicData);
          
          // 各セクションのデータをロード
          if (KarteData.basicHot) KarteData.basicHot.loadData(basicData);
          if (KarteData.paymentHot) KarteData.paymentHot.loadData(paymentData);
          if (KarteData.expenseHot) KarteData.expenseHot.loadData(expenseData);
          if (KarteData.summaryHot) KarteData.summaryHot.loadData(summaryData);
          
          // カルテIDの表示を更新
          document.getElementById('current-karte-id').textContent = `カルテNo: ${this.getKarteNoFromData(basicData) || karteId}`;
          
          // 最終更新日時の表示を更新
          if (data.lastUpdated) {
            const lastUpdated = data.lastUpdated.toDate();
            document.getElementById('last-saved').textContent = lastUpdated.toLocaleString();
          }
          
          // リアルタイムリスナーを設定
          this.attachRealtimeListener(karteId);
          
          // 編集者情報を表示
          if (data.currentEditors) {
            this.updateEditorsList(data.currentEditors);
          }
          
          // 現在の編集者として自分を追加
          this.registerCurrentEditor();
        } else {
          alert('カルテが見つかりません');
        }
      })
      .catch(error => {
        console.error('Error loading karte data:', error);
        alert(`読み込みエラー: ${error.message}`);
      });
  },
  
  /**
   * 基本情報からカルテNoを取得
   * @param {Array} basicData - 基本情報データ
   * @return {string} カルテNo
   */
  getKarteNoFromData: function(basicData) {
    try {
      // 基本情報のマッピングからカルテNoのセル位置を取得
      const karteNoCell = BASIC_MAPPING.karteNo;
      return basicData[karteNoCell.row][karteNoCell.col];
    } catch (e) {
      console.error('カルテNo取得エラー:', e);
      return '';
    }
  },
  
  /**
   * 基本情報を抽出してsharedDataに保存
   * @param {Array} basicData - 基本情報データ
   */
  extractBasicInfo: function(basicData) {
    try {
      // 各フィールドを抽出
      const basicInfo = {};
      
      for (const [key, cell] of Object.entries(BASIC_MAPPING)) {
        if (basicData[cell.row] && basicData[cell.row][cell.col] !== undefined) {
          basicInfo[key] = basicData[cell.row][cell.col];
        }
      }
      
      // personCountは数値に変換
      if (basicInfo.personCount) {
        const count = parseFloat(String(basicInfo.personCount).replace(/,/g, ''));
        basicInfo.personCount = isNaN(count) ? 0 : count;
      }
      
      // sharedDataに保存
      KarteData.sharedData.basicInfo = basicInfo;
    } catch (e) {
      console.error('基本情報抽出エラー:', e);
    }
  },
  
  /**
   * リアルタイム同期のリスナーを設定
   * @param {string} karteId - カルテID
   */
  attachRealtimeListener: function(karteId) {
    // 既存のリスナーがあれば削除
    this.detachRealtimeListener();
    
    // 新しいリスナーを設定
    this.realtimeListener = db.collection(APP_CONFIG.KARTE_COLLECTION).doc(karteId)
      .onSnapshot(docSnapshot => {
        // 自分自身の更新によるイベントは無視
        if (this.isUpdating) {
          return;
        }
        
        const data = docSnapshot.data();
        if (!data) return;
        
        // リモートの更新が最近のローカル更新より新しい場合のみ反映
        const remoteTimestamp = data.lastUpdated ? data.lastUpdated.toMillis() : 0;
        if (remoteTimestamp > this.lastLocalUpdate) {
          console.log('リモートから更新を受信しました');
          
          // 各セクションのデータを取得
          const basicData = data[APP_CONFIG.BASIC_DATA_FIELD];
          const paymentData = data[APP_CONFIG.PAYMENT_DATA_FIELD];
          const expenseData = data[APP_CONFIG.EXPENSE_DATA_FIELD];
          const summaryData = data[APP_CONFIG.SUMMARY_DATA_FIELD];
          
          // 各セクションのデータをロード（データがある場合のみ）
          if (basicData && KarteData.basicHot) KarteData.basicHot.loadData(basicData);
          if (paymentData && KarteData.paymentHot) KarteData.paymentHot.loadData(paymentData);
          if (expenseData && KarteData.expenseHot) KarteData.expenseHot.loadData(expenseData);
          if (summaryData && KarteData.summaryHot) KarteData.summaryHot.loadData(summaryData);
          
          // 基本情報を抽出してsharedDataに保存（データがある場合のみ）
          if (basicData) this.extractBasicInfo(basicData);
          
          // 最終更新日時の表示を更新
          if (data.lastUpdated) {
            const lastUpdated = data.lastUpdated.toDate();
            document.getElementById('last-saved').textContent = lastUpdated.toLocaleString();
            
            // 更新通知を表示
            this.showUpdateNotification();
          }
          
          // 編集者情報を更新
          if (data.currentEditors) {
            this.updateEditorsList(data.currentEditors);
          }
        }
      }, error => {
        console.error('リアルタイム同期エラー:', error);
      });
  },
  
  /**
   * リアルタイムリスナーを削除
   */
  detachRealtimeListener: function() {
    if (this.realtimeListener) {
      this.realtimeListener();
      this.realtimeListener = null;
    }
    
    // カルテを閉じる場合は編集者リストから自分を削除
    if (this.currentKarteId) {
      this.unregisterCurrentEditor();
    }
  },
  
  /**
   * 更新通知を表示
   */
  showUpdateNotification: function() {
    // 既存の通知があれば削除
    const existingNotification = document.getElementById('update-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // 通知要素を作成
    const notification = document.createElement('div');
    notification.id = 'update-notification';
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '20px';
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notification.style.zIndex = '9999';
    notification.style.transition = 'opacity 0.5s';
    notification.innerHTML = '<i class="fas fa-sync-alt"></i> 他のユーザーによる変更が反映されました';
    
    // 通知を表示
    document.body.appendChild(notification);
    
    // 5秒後に通知を消す
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 5000);
  },
  
  /**
   * 現在の編集者として登録
   */
  registerCurrentEditor: function() {
    if (!this.currentKarteId) return;
    
    // ユーザー識別子を取得（実際のアプリではログインユーザー情報を使用）
    const editorId = this.getEditorId();
    const editorName = this.getEditorName();
    
    // Firestoreの編集者リストに追加
    const karteRef = db.collection(APP_CONFIG.KARTE_COLLECTION).doc(this.currentKarteId);
    
    karteRef.get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        const currentEditors = data.currentEditors || {};
        
        // 自分の情報を追加
        currentEditors[editorId] = {
          name: editorName,
          lastActive: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // 5分以上更新のない編集者を削除
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
        
        Object.keys(currentEditors).forEach(id => {
          const editor = currentEditors[id];
          if (editor.lastActive && editor.lastActive.toDate && editor.lastActive.toDate() < fiveMinutesAgo) {
            delete currentEditors[id];
          }
        });
        
        // 更新
        karteRef.update({
          currentEditors: currentEditors
        }).catch(error => {
          console.error('編集者情報の更新エラー:', error);
        });
      }
    }).catch(error => {
      console.error('編集者情報の取得エラー:', error);
    });
    
    // 定期的に自分のアクティブ状態を更新
    this.startActiveStatusUpdater();
  },
  
  /**
   * 編集者リストから自分を削除
   */
  unregisterCurrentEditor: function() {
    if (!this.currentKarteId) return;
    
    // アクティブ状態の更新を停止
    this.stopActiveStatusUpdater();
    
    // ユーザー識別子を取得
    const editorId = this.getEditorId();
    
    // Firestoreの編集者リストから削除
    const karteRef = db.collection(APP_CONFIG.KARTE_COLLECTION).doc(this.currentKarteId);
    
    karteRef.get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        const currentEditors = data.currentEditors || {};
        
        // 自分の情報を削除
        if (currentEditors[editorId]) {
          delete currentEditors[editorId];
          
          // 更新
          karteRef.update({
            currentEditors: currentEditors
          }).catch(error => {
            console.error('編集者情報の更新エラー:', error);
          });
        }
      }
    }).catch(error => {
      console.error('編集者情報の取得エラー:', error);
    });
  },
  
  // アクティブ状態更新タイマー
  activeStatusTimer: null,
  
  /**
   * 定期的にアクティブ状態を更新
   */
  startActiveStatusUpdater: function() {
    // 既存のタイマーがあれば停止
    this.stopActiveStatusUpdater();
    
    // 1分ごとにアクティブ状態を更新
    this.activeStatusTimer = setInterval(() => {
      if (!this.currentKarteId) {
        this.stopActiveStatusUpdater();
        return;
      }
      
      const editorId = this.getEditorId();
      const karteRef = db.collection(APP_CONFIG.KARTE_COLLECTION).doc(this.currentKarteId);
      
      karteRef.get().then(doc => {
        if (doc.exists) {
          const data = doc.data();
          const currentEditors = data.currentEditors || {};
          
          if (currentEditors[editorId]) {
            // 最終アクティブ時間を更新
            currentEditors[editorId].lastActive = firebase.firestore.FieldValue.serverTimestamp();
            
            // 更新
            karteRef.update({
              currentEditors: currentEditors
            }).catch(error => {
              console.error('アクティブ状態の更新エラー:', error);
            });
          }
        }
      }).catch(error => {
        console.error('アクティブ状態の更新エラー:', error);
      });
    }, 60000); // 1分ごと
  },
  
  /**
   * アクティブ状態の更新を停止
   */
  stopActiveStatusUpdater: function() {
    if (this.activeStatusTimer) {
      clearInterval(this.activeStatusTimer);
      this.activeStatusTimer = null;
    }
  },
/**
   * 編集者一覧を更新
   */
  updateEditorsList: function(editors) {
    // 編集者情報を表示するUI要素
    let editorsContainer = document.getElementById('current-editors');
    
    // まだ存在しない場合は作成
    if (!editorsContainer) {
      editorsContainer = document.createElement('div');
      editorsContainer.id = 'current-editors';
      editorsContainer.className = 'current-editors-container';
      
      // ヘッダー情報の隣に配置
      const infoElement = document.querySelector('.excel-header .info');
      if (infoElement) {
        infoElement.appendChild(editorsContainer);
      }
    }
    
    // 編集者リストを生成
    const editorsList = Object.keys(editors).map(id => {
      const editor = editors[id];
      return `<span class="editor-badge">${editor.name}</span>`;
    });
    
    // UI更新
    if (editorsList.length > 0) {
      editorsContainer.innerHTML = '編集中: ' + editorsList.join(' ');
      editorsContainer.style.display = 'block';
    } else {
      editorsContainer.style.display = 'none';
    }
  },
  
  /**
   * 編集者IDを取得
   * 実際のアプリではユーザー認証情報を使用する
   */
  getEditorId: function() {
    // ローカルストレージから取得、なければ新規生成
    let editorId = localStorage.getItem('editorId');
    if (!editorId) {
      editorId = 'editor_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('editorId', editorId);
    }
    return editorId;
  },
  
  /**
   * 編集者名を取得
   * 実際のアプリではユーザー認証情報を使用する
   */
  getEditorName: function() {
    // ローカルストレージから取得、なければ新規生成
    let editorName = localStorage.getItem('editorName');
    if (!editorName) {
      // ランダムな名前を生成（実際のアプリではユーザー名を使用）
      const names = ['鈴木', '田中', '佐藤', '高橋', '渡辺'];
      editorName = names[Math.floor(Math.random() * names.length)] + ' ' + 
                   Math.floor(Math.random() * 100);
      localStorage.setItem('editorName', editorName);
    }
    return editorName;
  },
  
  /**
   * 新規カルテを作成する
   */
  createNewKarte: function() {
    // 現在のカルテから編集者を削除
    this.detachRealtimeListener();
    
    // 現在のカルテIDをクリア
    this.currentKarteId = null;
    
    // 各セクションにテンプレートをロード
    if (KarteData.basicHot) KarteData.basicHot.loadData(JSON.parse(JSON.stringify(BASIC_TEMPLATE)));
    if (KarteData.paymentHot) KarteData.paymentHot.loadData(JSON.parse(JSON.stringify(PAYMENT_TEMPLATE)));
    if (KarteData.expenseHot) KarteData.expenseHot.loadData(JSON.parse(JSON.stringify(EXPENSE_TEMPLATE)));
    if (KarteData.summaryHot) KarteData.summaryHot.loadData(JSON.parse(JSON.stringify(SUMMARY_TEMPLATE)));
    
    // 共有データをリセット
    KarteData.sharedData = {
      basicInfo: {
        karteNo: '',
        departureDate: '',
        nights: 0,
        personCount: 0,
        destination: '',
        tantosha: '',
        dantaiName: ''
      },
      paymentTotal: 0,
      expenseTotal: 0,
      profit: 0,
      profitRate: 0
    };
    
    // カルテIDの表示を更新
    document.getElementById('current-karte-id').textContent = '新規カルテ';
    
    // 最終更新日時の表示をリセット
    document.getElementById('last-saved').textContent = '保存されていません';
    
    // 編集者リストをクリア
    const editorsContainer = document.getElementById('current-editors');
    if (editorsContainer) {
      editorsContainer.style.display = 'none';
    }
  },
  
  /**
   * 現在のカルテを保存する
   */
  saveKarte: function() {
    // 保存中インジケーターを表示
    document.getElementById('saving-indicator').style.display = 'block';
    
    // 更新中フラグをセット（自分の更新によるイベントを無視するため）
    this.isUpdating = true;
    
    // 各セクションのデータを取得
    const basicData = KarteData.basicHot ? KarteData.basicHot.getData() : BASIC_TEMPLATE;
    const paymentData = KarteData.paymentHot ? KarteData.paymentHot.getData() : PAYMENT_TEMPLATE;
    const expenseData = KarteData.expenseHot ? KarteData.expenseHot.getData() : EXPENSE_TEMPLATE;
    const summaryData = KarteData.summaryHot ? KarteData.summaryHot.getData() : SUMMARY_TEMPLATE;
    
    // 基本情報（カルテNo、団体名など）を抽出
    this.extractBasicInfo(basicData);
    const karteInfo = KarteData.sharedData.basicInfo;
    
    // 保存するデータを準備
    const karteData = {
      [APP_CONFIG.BASIC_DATA_FIELD]: basicData,
      [APP_CONFIG.PAYMENT_DATA_FIELD]: paymentData,
      [APP_CONFIG.EXPENSE_DATA_FIELD]: expenseData,
      [APP_CONFIG.SUMMARY_DATA_FIELD]: summaryData,
      karteInfo: karteInfo,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // 現在の編集者情報を保持
    if (this.currentKarteId) {
      // 既存のカルテの場合、編集者情報を取得して保持
      db.collection(APP_CONFIG.KARTE_COLLECTION).doc(this.currentKarteId).get()
        .then(doc => {
          if (doc.exists) {
            const data = doc.data();
            if (data.currentEditors) {
              karteData.currentEditors = data.currentEditors;
            }
          }
          this.performSave(karteData);
        })
        .catch(error => {
          console.error('編集者情報の取得エラー:', error);
          this.performSave(karteData);
        });
    } else {
      // 新規カルテの場合
      const editorId = this.getEditorId();
      const editorName = this.getEditorName();
      
      karteData.currentEditors = {
        [editorId]: {
          name: editorName,
          lastActive: firebase.firestore.FieldValue.serverTimestamp()
        }
      };
      
      this.performSave(karteData);
    }
  },
  
  /**
   * 実際の保存処理を実行
   * @param {Object} karteData - 保存するカルテデータ
   */
  performSave: function(karteData) {
    // 保存先を決定（既存のカルテなら更新、新規なら作成）
    let savePromise;
    
    if (this.currentKarteId) {
      // 既存のカルテを更新
      savePromise = db.collection(APP_CONFIG.KARTE_COLLECTION)
        .doc(this.currentKarteId)
        .update(karteData);
    } else {
      // 新規カルテを作成
      savePromise = db.collection(APP_CONFIG.KARTE_COLLECTION)
        .add(karteData)
        .then(docRef => {
          this.currentKarteId = docRef.id;
          
          // リアルタイムリスナーを設定
          this.attachRealtimeListener(docRef.id);
          
          return docRef;
        });
    }
    
    // 保存処理
    savePromise
      .then(() => {
        console.log('カルテを保存しました');
        
        // 最終ローカル更新タイムスタンプを更新
        this.lastLocalUpdate = Date.now();
        
        // カルテIDの表示を更新
        const displayId = karteData.karteInfo.karteNo || this.currentKarteId;
        document.getElementById('current-karte-id').textContent = `カルテNo: ${displayId}`;
        
        // 最終更新日時の表示を更新
        const now = new Date();
        document.getElementById('last-saved').textContent = now.toLocaleString();
        
        // 保存中インジケーターを非表示
        document.getElementById('saving-indicator').style.display = 'none';
        
        // 更新中フラグを解除
        setTimeout(() => {
          this.isUpdating = false;
        }, 1000);
      })
      .catch(error => {
        console.error('保存中にエラーが発生しました:', error);
        
        // 保存中インジケーターを非表示
        document.getElementById('saving-indicator').style.display = 'none';
        
        // 更新中フラグを解除
        this.isUpdating = false;
        
        alert(`保存中にエラーが発生しました: ${error.message}`);
      });
  },
  
  /**
   * カルテ一覧を読み込む
   */
  loadKarteList: function() {
    const karteListBody = document.getElementById('karte-list-body');
    
    // 一覧をクリア
    karteListBody.innerHTML = '';
    
    // カルテ一覧を取得
    db.collection(APP_CONFIG.KARTE_COLLECTION)
      .orderBy('lastUpdated', 'desc')
      .limit(50) // 最大50件まで表示
      .get()
      .then(querySnapshot => {
        if (querySnapshot.empty) {
          karteListBody.innerHTML = '<tr><td colspan="9">カルテがありません</td></tr>';
          return;
        }
        
        // 各カルテのデータを一覧に追加
        querySnapshot.forEach(doc => {
          const data = doc.data();
          const karteInfo = data.karteInfo || {};
          
          // 行要素を作成
          const row = document.createElement('tr');
          
          // カルテNo
          const cellKarteNo = document.createElement('td');
          cellKarteNo.textContent = karteInfo.karteNo || doc.id;
          cellKarteNo.setAttribute('data-title', 'カルテNo');
          row.appendChild(cellKarteNo);
          
          // 担当者
          const cellTantosha = document.createElement('td');
          cellTantosha.textContent = karteInfo.tantosha || '-';
          cellTantosha.setAttribute('data-title', '担当者');
          row.appendChild(cellTantosha);
          
          // 名前
          const cellName = document.createElement('td');
          cellName.textContent = karteInfo.name || '-';
          cellName.setAttribute('data-title', '名前');
          row.appendChild(cellName);
          
          // 団体名
          const cellDantai = document.createElement('td');
          cellDantai.textContent = karteInfo.dantaiName || '-';
          cellDantai.setAttribute('data-title', '団体名');
          row.appendChild(cellDantai);
          
          // 宿泊日
          const cellStayDate = document.createElement('td');
          cellStayDate.textContent = karteInfo.stayDate || '-';
          cellStayDate.setAttribute('data-title', '宿泊日');
          row.appendChild(cellStayDate);
          
          // 行先
          const cellDestination = document.createElement('td');
          cellDestination.textContent = karteInfo.destination || '-';
          cellDestination.setAttribute('data-title', '行先');
          row.appendChild(cellDestination);
          
          // 人数
          const cellPersonCount = document.createElement('td');
          cellPersonCount.textContent = karteInfo.personCount || '-';
          cellPersonCount.setAttribute('data-title', '人数');
          row.appendChild(cellPersonCount);
          
          // 編集者
          const cellEditors = document.createElement('td');
          cellEditors.setAttribute('data-title', '編集者');
          if (data.currentEditors && Object.keys(data.currentEditors).length > 0) {
            const editorNames = Object.values(data.currentEditors).map(editor => editor.name);
            cellEditors.textContent = editorNames.join(', ');
            cellEditors.style.color = '#e53935'; // 赤色で表示
          } else {
            cellEditors.textContent = '-';
          }
          row.appendChild(cellEditors);
          
          // 操作ボタン
          const cellActions = document.createElement('td');
          cellActions.setAttribute('data-title', '操作');
          
          // 編集ボタン
          const editBtn = document.createElement('button');
          editBtn.className = 'action-btn edit-btn';
          editBtn.textContent = '編集';
          editBtn.onclick = () => {
            this.loadKarteData(doc.id);
            document.getElementById('karte-list-modal').style.display = 'none';
          };
          cellActions.appendChild(editBtn);
          
          // 削除ボタン
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'action-btn delete-btn';
          deleteBtn.textContent = '削除';
          deleteBtn.onclick = () => {
            if (confirm('このカルテを削除してもよろしいですか？')) {
              this.deleteKarte(doc.id);
            }
          };
          cellActions.appendChild(deleteBtn);
          
          row.appendChild(cellActions);
          
          // 行を一覧に追加
          karteListBody.appendChild(row);
        });
      })
      .catch(error => {
        console.error('カルテ一覧の読み込み中にエラーが発生しました:', error);
        karteListBody.innerHTML = `<tr><td colspan="9">読み込みエラー: ${error.message}</td></tr>`;
      });
  },
  
  /**
   * カルテを削除する
   * @param {string} karteId - 削除するカルテのID
   */
  deleteKarte: function(karteId) {
    db.collection(APP_CONFIG.KARTE_COLLECTION).doc(karteId).delete()
      .then(() => {
        console.log('カルテを削除しました');
        
        // 一覧を再読み込み
        this.loadKarteList();
        
        // 現在表示中のカルテが削除されたカルテの場合、新規カルテを作成
        if (this.currentKarteId === karteId) {
          this.createNewKarte();
        }
      })
      .catch(error => {
        console.error('削除中にエラーが発生しました:', error);
        alert(`削除中にエラーが発生しました: ${error.message}`);
      });
  },
  
  /**
   * ページ離脱時の処理
   */
  handleBeforeUnload: function() {
    // 編集者リストから自分を削除
    this.unregisterCurrentEditor();
    
    // リアルタイムリスナーを削除
    this.detachRealtimeListener();
  },
  
  /**
   * 現在のカルテデータをExcelとしてエクスポート
   */
  exportToExcel: function() {
    try {
      // カルテNoまたは現在の日時をファイル名に使用
      let filename = 'カルテ';
      
      // カルテNoが設定されている場合はそれを使用
      if (KarteData.sharedData.basicInfo.karteNo) {
        filename = KarteData.sharedData.basicInfo.karteNo;
      } else if (this.currentKarteId) {
        filename = this.currentKarteId;
      }
      
      // 現在の日時を追加
      const now = new Date();
      const dateStr = now.getFullYear() + 
                      ('0' + (now.getMonth() + 1)).slice(-2) + 
                      ('0' + now.getDate()).slice(-2) + '_' +
                      ('0' + now.getHours()).slice(-2) + 
                      ('0' + now.getMinutes()).slice(-2);
      
      // ファイル名を生成
      filename = `${filename}_${dateStr}.xlsx`;
      
      // ワークブックを作成
      const wb = XLSX.utils.book_new();
      
      // 各セクションのデータをワークシートに追加
      if (KarteData.basicHot) {
        const basicWs = XLSX.utils.aoa_to_sheet(KarteData.basicHot.getData());
        XLSX.utils.book_append_sheet(wb, basicWs, '基本情報');
      }
      
      if (KarteData.paymentHot) {
        const paymentWs = XLSX.utils.aoa_to_sheet(KarteData.paymentHot.getData());
        XLSX.utils.book_append_sheet(wb, paymentWs, '入金情報');
      }
      
      if (KarteData.expenseHot) {
        const expenseWs = XLSX.utils.aoa_to_sheet(KarteData.expenseHot.getData());
        XLSX.utils.book_append_sheet(wb, expenseWs, '支払情報');
      }
      
      if (KarteData.summaryHot) {
        const summaryWs = XLSX.utils.aoa_to_sheet(KarteData.summaryHot.getData());
        XLSX.utils.book_append_sheet(wb, summaryWs, '収支情報');
      }
      
      // Excelファイルとして出力
      XLSX.writeFile(wb, filename);
      
      return true;
    } catch (error) {
      console.error('エクスポート中にエラーが発生しました:', error);
      alert(`エクスポート中にエラーが発生しました: ${error.message}`);
      return false;
    }
  }
};

// ページ離脱時の処理を設定
window.addEventListener('beforeunload', function() {
  DataManager.handleBeforeUnload();
});
