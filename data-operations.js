/**
 * データ操作関連機能を管理するファイル
 * FirestoreへのデータCRUD操作や、Excelエクスポートなどの機能を提供します
 */

/**
 * 通知メッセージを表示する
 * @param {string} message - 表示するメッセージ
 * @param {string} type - 通知の種類（info, success, error, warning）
 */
function showNotification(message, type = 'info') {
  console.log("showNotification:", message, type);
  const notification = document.getElementById('notification');
  if (!notification) { 
    console.error("通知エレメントが見つかりません"); 
    return; 
  }
  
  notification.textContent = message;
  
  // 種類に応じた背景色を設定
  switch (type) {
    case 'success': notification.style.backgroundColor = '#4caf50'; break;
    case 'error': notification.style.backgroundColor = '#f44336'; break;
    case 'warning': notification.style.backgroundColor = '#ff9800'; break;
    default: notification.style.backgroundColor = '#2196F3';
  }
  
  // 通知を表示し、3秒後に非表示にする
  notification.style.display = 'block';
  setTimeout(() => { notification.style.display = 'none'; }, 3000);
}

/**
 * カルテデータを保存する
 * @param {Object} app - KarteAppオブジェクト
 */
function saveKarte(app) {
  console.log("saveKarte() called");
  
  // オフライン状態では保存できない
  if (!navigator.onLine) {
    showNotification('オフライン状態では保存できません', 'error');
    return;
  }
  
  document.getElementById('last-saved').textContent = '保存中...';
  
  try {
    // フォームからデータを取得
    const karteData = getFormData();
    
    // 配列データを追加
    karteData.payments = app.payments;
    karteData.expenses = app.expenses;
    karteData.comments = app.comments;
    
    // タイムスタンプを追加
    karteData.lastUpdated = firebase.firestore.FieldValue.serverTimestamp();
    
    // カルテ情報を抽出（一覧表示用）
    const karteInfo = {
      karteNo: document.getElementById('karte-no').value || '',
      tantosha: document.getElementById('company-person').value || '',
      dantaiName: document.getElementById('client-company').value || '',
      departureDate: document.getElementById('departure-date').value || '',
      personCount: document.getElementById('total-persons').value || '',
      destination: getDestinationValue()
    };
    karteData.karteInfo = karteInfo;
    
    let savePromise;
    
    // 新規作成か更新かを判定
    if (app.currentId) {
      console.log("Updating existing document, id =", app.currentId);
      savePromise = db.collection('karte').doc(app.currentId).update(karteData);
    } else {
      console.log("Creating new document");
      savePromise = db.collection('karte').add(karteData)
        .then(docRef => { 
          app.currentId = docRef.id; 
          return docRef; 
        });
    }
    
    savePromise.then(() => {
      const now = new Date();
      document.getElementById('last-saved').textContent = now.toLocaleString();
      document.getElementById('current-karte-id').textContent = karteInfo.karteNo || '新規カルテ';
      app.hasChanges = false;
      showNotification('カルテを保存しました', 'success');
      console.log("saveKarte: save succeeded");
    }).catch(error => {
      console.error('保存エラー:', error);
      document.getElementById('last-saved').textContent = '保存失敗';
      showNotification('保存に失敗しました: ' + error.message, 'error');
    });
  } catch (error) {
    console.error('データ準備エラー:', error);
    document.getElementById('last-saved').textContent = '保存失敗';
    showNotification('データの準備中にエラーが発生しました', 'error');
  }
}

/**
 * フォームからデータを取得する
 * @returns {Object} フォームデータオブジェクト
 */
function getFormData() {
  return {
    travelType: document.getElementById('travel-type').value,
    karteNo: document.getElementById('karte-no').value,
    companyPerson: document.getElementById('company-person').value,
    clientCompany: document.getElementById('client-company').value,
    clientPerson: document.getElementById('client-person').value,
    clientPhone: document.getElementById('client-phone').value,
    clientEmail: document.getElementById('client-email').value,
    departureDate: document.getElementById('departure-date').value,
    returnDate: document.getElementById('return-date').value,
    nights: document.getElementById('nights').value,
    departurePlace: document.getElementById('departure-place').value,
    destination: getDestinationValue(),
    travelContent: document.getElementById('travel-content').value,
    totalPersons: document.getElementById('total-persons').value,
    totalAmount: document.getElementById('total-amount').value,
    unitPrice: document.getElementById('unit-price').value,
    paymentTo: document.getElementById('payment-to').value,
    arrangementStatus: document.getElementById('arrangement-status').value,
    memo: document.getElementById('memo').value
  };
}

/**
 * 行き先の値を取得する（通常の選択肢か、その他の入力値か）
 * @returns {string} 行き先の値
 */
function getDestinationValue() {
  const select = document.getElementById('destination');
  if (select.value === 'other') {
    return document.getElementById('destination-other').value;
  }
  return select.value;
}

/**
 * カルテ一覧を読み込む
 * @param {Object} app - KarteAppオブジェクト
 */
function loadKarteList(app) {
  console.log("loadKarteList() called");
  
  // 未保存の変更がある場合は確認
  if (app.hasChanges && !confirm('保存されていない変更があります。カルテ一覧を開きますか？')) { 
    return; 
  }
  
  const listBody = document.querySelector('#karte-list tbody');
  listBody.innerHTML = '<tr><td colspan="6">読み込み中...</td></tr>';
  document.getElementById('list-modal').style.display = 'block';
  document.getElementById('search').value = '';
  
  // 最新50件を取得
  db.collection('karte').orderBy('lastUpdated', 'desc').limit(50).get()
    .then(querySnapshot => {
      if (querySnapshot.empty) {
        listBody.innerHTML = '<tr><td colspan="6">カルテがありません</td></tr>';
        return;
      }
      
      let html = '';
      querySnapshot.forEach(doc => {
        const data = doc.data();
        const info = data.karteInfo || {};
        html += `
          <tr data-id="${doc.id}">
            <td>${info.karteNo || '-'}</td>
            <td>${info.tantosha || '-'}</td>
            <td>${info.dantaiName || '-'}</td>
            <td>${info.departureDate || '-'}</td>
            <td>${info.destination || '-'}</td>
            <td>
              <button class="edit-btn" data-id="${doc.id}">編集</button>
              <button class="delete-btn" data-id="${doc.id}">削除</button>
            </td>
          </tr>
        `;
      });
      
      listBody.innerHTML = html;
      
      // 編集ボタンのイベントリスナー
      document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          loadKarte(app, id);
          document.getElementById('list-modal').style.display = 'none';
        });
      });
      
      // 削除ボタンのイベントリスナー
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          if (confirm('本当に削除しますか？')) { 
            deleteKarte(app, id); 
          }
        });
      });
    })
    .catch(error => {
      console.error('カルテリスト取得エラー:', error);
      listBody.innerHTML = `<tr><td colspan="6">エラー: ${error.message}</td></tr>`;
      showNotification('カルテ一覧の取得に失敗しました', 'error');
    });
}

/**
 * 指定したIDのカルテを読み込む
 * @param {Object} app - KarteAppオブジェクト
 * @param {string} id - カルテのID
 */
function loadKarte(app, id) {
  console.log("loadKarte() called, id=", id);
  
  // 未保存の変更がある場合は確認
  if (app.hasChanges && !confirm('保存されていない変更があります。別のカルテを開きますか？')) { 
    return; 
  }
  
  document.getElementById('last-saved').textContent = '読み込み中...';
  
  db.collection('karte').doc(id).get()
    .then(doc => {
      if (!doc.exists) {
        showNotification('カルテが見つかりません', 'error');
        document.getElementById('last-saved').textContent = '-';
        return;
      }
      
      const data = doc.data();
      app.currentId = id;
      
      // 基本フォームデータをセット
      setFormData(data);
      
      // 配列データをセット
      app.payments = Array.isArray(data.payments) ? data.payments : [];
      app.expenses = Array.isArray(data.expenses) ? data.expenses : [];
      app.comments = Array.isArray(data.comments) ? data.comments : [];
      
      // 各セクションを再描画
      renderPayments(app);
      renderExpenses(app);
      renderComments(app);
      updateSummary(app);
      
      // カルテ番号と最終更新日を表示
      const karteInfo = data.karteInfo || {};
      document.getElementById('current-karte-id').textContent = karteInfo.karteNo || '新規カルテ';
      document.getElementById('last-saved').textContent = data.lastUpdated ? data.lastUpdated.toDate().toLocaleString() : '-';
      
      app.hasChanges = false;
      showNotification('カルテを読み込みました', 'success');
      console.log("loadKarte() succeeded");
    })
    .catch(error => {
      console.error('カルテ読み込みエラー:', error);
      document.getElementById('last-saved').textContent = '読み込み失敗';
      showNotification('カルテの読み込みに失敗しました', 'error');
    });
}

/**
 * フォームにデータをセットする
 * @param {Object} data - カルテデータ
 */
function setFormData(data) {
  // 基本フォームデータを設定
  if (data.travelType) document.getElementById('travel-type').value = data.travelType;
  if (data.karteNo) document.getElementById('karte-no').value = data.karteNo;
  if (data.companyPerson) document.getElementById('company-person').value = data.companyPerson;
  if (data.clientCompany) document.getElementById('client-company').value = data.clientCompany;
  if (data.clientPerson) document.getElementById('client-person').value = data.clientPerson;
  if (data.clientPhone) document.getElementById('client-phone').value = data.clientPhone;
  if (data.clientEmail) document.getElementById('client-email').value = data.clientEmail;
  if (data.departureDate) document.getElementById('departure-date').value = data.departureDate;
  if (data.returnDate) document.getElementById('return-date').value = data.returnDate;
  if (data.nights) document.getElementById('nights').value = data.nights;
  if (data.departurePlace) document.getElementById('departure-place').value = data.departurePlace;
  
  // 行き先の設定
  if (data.destination) {
    const destinationSelect = document.getElementById('destination');
    const destinationOther = document.getElementById('destination-other');
    
    // 都道府県リストにあるか確認
    const options = Array.from(destinationSelect.options).map(opt => opt.value);
    if (options.includes(data.destination)) {
      destinationSelect.value = data.destination;
      destinationOther.style.display = 'none';
    } else {
      destinationSelect.value = 'other';
      destinationOther.style.display = 'block';
      destinationOther.value = data.destination;
    }
  }
  
  if (data.travelContent) document.getElementById('travel-content').value = data.travelContent;
  if (data.totalPersons) document.getElementById('total-persons').value = data.totalPersons;
  if (data.totalAmount) document.getElementById('total-amount').value = data.totalAmount;
  if (data.unitPrice) document.getElementById('unit-price').value = data.unitPrice;
  if (data.paymentTo) document.getElementById('payment-to').value = data.paymentTo;
  if (data.arrangementStatus) document.getElementById('arrangement-status').value = data.arrangementStatus;
  if (data.memo) document.getElementById('memo').value = data.memo;
}

/**
 * カルテを削除する
 * @param {Object} app - KarteAppオブジェクト
 * @param {string} id - 削除するカルテのID
 */
function deleteKarte(app, id) {
  console.log("deleteKarte() called, id=", id);
  
  db.collection('karte').doc(id).delete()
    .then(() => {
      showNotification('カルテを削除しました', 'success');
      loadKarteList(app);
      if (app.currentId === id) { 
        app.createNew(); 
      }
    })
    .catch(error => {
      console.error('削除エラー:', error);
      showNotification('削除に失敗しました: ' + error.message, 'error');
    });
}

/**
 * カルテ一覧の検索結果をフィルタリング
 * @param {Object} app - KarteAppオブジェクト
 * @param {string} searchText - 検索テキスト
 */
function filterKarteList(app, searchText) {
  console.log("filterKarteList() called, searchText=", searchText);
  
  const rows = document.querySelectorAll('#karte-list tbody tr');
  searchText = searchText.toLowerCase();
  let foundCount = 0;
  
  rows.forEach(row => {
    if (row.querySelector('td[colspan]')) { return; }
    
    let found = false;
    const cells = row.querySelectorAll('td:not(:last-child)');
    cells.forEach(cell => { 
      if (cell.textContent.toLowerCase().includes(searchText)) { found = true; } 
    });
    
    row.style.display = found ? '' : 'none';
    if (found) { foundCount++; }
  });
  
  if (foundCount === 0 && searchText) {
    const listBody = document.querySelector('#karte-list tbody');
    const noResultRow = document.getElementById('no-results-row');
    
    if (noResultRow) { noResultRow.remove(); }
    
    if (rows.length > 0) {
      const message = document.createElement('tr');
      message.id = 'no-results-row';
      message.innerHTML = `<td colspan="6" style="text-align: center;">「${searchText}」に一致するカルテはありません</td>`;
      listBody.appendChild(message);
    }
  } else {
    const noResultRow = document.getElementById('no-results-row');
    if (noResultRow) { noResultRow.remove(); }
  }
}

/**
 * Excel形式でエクスポート
 * @param {Object} app - KarteAppオブジェクト
 */
function exportToExcel(app) {
  console.log("exportToExcel() called");
  
  try {
    const wb = XLSX.utils.book_new();
    
    // 基本情報シート
    const basicData = [
      ['◆ 基本情報', ''],
      ['国内/海外', document.getElementById('travel-type').value === 'domestic' ? '国内' : '海外'],
      ['カルテ番号', document.getElementById('karte-no').value],
      ['自社担当者', document.getElementById('company-person').value],
      ['クライアント会社名', document.getElementById('client-company').value],
      ['クライアント担当者', document.getElementById('client-person').value],
      ['電話番号', document.getElementById('client-phone').value],
      ['メールアドレス', document.getElementById('client-email').value],
      ['出発日', document.getElementById('departure-date').value],
      ['帰着日', document.getElementById('return-date').value],
      ['泊数', document.getElementById('nights').value],
      ['出発地', document.getElementById('departure-place').value],
      ['行き先', getDestinationValue()],
      ['旅行内容', document.getElementById('travel-content').value],
      ['合計人数', document.getElementById('total-persons').value],
      ['金額', document.getElementById('total-amount').value],
      ['単価', document.getElementById('unit-price').value],
      ['支払い先', document.getElementById('payment-to').value],
      ['手配状況', document.getElementById('arrangement-status').value]
    ];
    
    // 入金情報シート
    const paymentData = [['◆ 入金情報', '', '', '', '']];
    paymentData.push(['入金予定日', '入金日', '入金額', '入金場所', '備考']);
    app.payments.forEach(payment => {
      paymentData.push([
        payment.dueDate || '',
        payment.date || '',
        payment.amount,
        payment.place || '',
        payment.notes || ''
      ]);
    });
    
    // 支払情報シート
    const expenseData = [['◆ 支払情報', '', '', '', '', '', '']];
    expenseData.push(['利用日', '手配先名', '電話/FAX', '担当者', '支払予定日', '支払金額', '手配状況']);
    app.expenses.forEach(expense => {
      expenseData.push([
        expense.date || '',
        expense.vendor || '',
        expense.phone || '',
        expense.person || '',
        expense.dueDate || '',
        expense.amount,
        expense.status || ''
      ]);
    });
    
    // 収支情報シート
    const summaryData = [
      ['◆ 収支情報', ''],
      ['総入金額', document.getElementById('total-payment').value],
      ['総支払額', document.getElementById('total-expense').value],
      ['利益額', document.getElementById('profit-amount').value],
      ['利益率', document.getElementById('profit-rate').value],
      ['一人あたり利益', document.getElementById('profit-per-person').value]
    ];
    
    // メモ欄シート
    const memoData = [
      ['◆ メモ欄', ''],
      [document.getElementById('memo').value, '']
    ];
    
    // コメントシート
    const commentData = [['◆ コメント欄', '', '']];
    commentData.push(['投稿者', '日時', 'コメント']);
    app.comments.forEach(comment => {
      const date = new Date(comment.date);
      const formattedDate = date.toLocaleString();
      commentData.push([comment.author, formattedDate, comment.text]);
    });
    
    // シートを追加
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(basicData), '基本情報');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(paymentData), '入金情報');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(expenseData), '支払情報');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), '収支情報');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(memoData), 'メモ');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(commentData), 'コメント');
    
    // ファイル名を設定して出力
    const karteNo = document.getElementById('karte-no').value || '';
    const now = new Date();
    const y = now.getFullYear();
    const m = ('0' + (now.getMonth() + 1)).slice(-2);
    const d = ('0' + now.getDate()).slice(-2);
    const filename = `${karteNo || 'カルテ'}_${y}${m}${d}.xlsx`;
    
    XLSX.writeFile(wb, filename);
    showNotification('Excelファイルを出力しました', 'success');
    console.log("exportToExcel() succeeded");
  } catch (error) {
    console.error('エクスポートエラー:', error);
    showNotification('エクスポートに失敗しました: ' + error.message, 'error');
  }
}
