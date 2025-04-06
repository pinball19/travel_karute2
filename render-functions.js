/**
 * 描画関連関数を管理するファイル
 * 画面上の各セクションのレンダリング処理を提供します
 */

/**
 * 入金情報を描画する
 * @param {Object} app - KarteAppオブジェクト
 */
function renderPayments(app) {
  const container = document.getElementById('payment-list');
  container.innerHTML = '';
  
  if (app.payments.length === 0) {
    container.innerHTML = '<p>入金情報がありません</p>';
    return;
  }
  
  app.payments.forEach(payment => {
    const card = document.createElement('div');
    card.className = 'info-card';
    card.innerHTML = `
      <div class="info-card-header">
        <span>${payment.date ? '入金済み' : '入金予定'}</span>
        <button class="remove-card-btn" data-id="${payment.id}">削除</button>
      </div>
      <div class="info-card-body">
        <div class="info-card-item">
          <div class="info-card-label">入金予定日</div>
          <div class="info-card-value">${payment.dueDate || '未設定'}</div>
        </div>
        <div class="info-card-item">
          <div class="info-card-label">入金日</div>
          <div class="info-card-value">${payment.date || '未入金'}</div>
        </div>
        <div class="info-card-item">
          <div class="info-card-label">入金額</div>
          <div class="info-card-value">${payment.amount.toLocaleString()}円</div>
        </div>
        <div class="info-card-item">
          <div class="info-card-label">入金場所</div>
          <div class="info-card-value">${payment.place || '-'}</div>
        </div>
      </div>
      ${payment.notes ? `<div class="info-card-notes">${payment.notes}</div>` : ''}
    `;
    container.appendChild(card);
  });
  
  // 削除ボタンにイベントリスナーを追加
  document.querySelectorAll('#payment-list .remove-card-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      app.payments = app.payments.filter(item => item.id !== id);
      renderPayments(app);
      updateSummary(app);
      app.markHasChanges();
    });
  });
}

/**
 * 支払情報を描画する
 * @param {Object} app - KarteAppオブジェクト
 */
function renderExpenses(app) {
  const container = document.getElementById('expense-list');
  container.innerHTML = '';
  
  if (app.expenses.length === 0) {
    container.innerHTML = '<p>支払情報がありません</p>';
    return;
  }
  
  app.expenses.forEach(expense => {
    const card = document.createElement('div');
    card.className = 'info-card';
    card.innerHTML = `
      <div class="info-card-header">
        <span>${expense.vendor} (${expense.status})</span>
        <button class="remove-card-btn" data-id="${expense.id}">削除</button>
      </div>
      <div class="info-card-body">
        <div class="info-card-item">
          <div class="info-card-label">利用日</div>
          <div class="info-card-value">${expense.date || '-'}</div>
        </div>
        <div class="info-card-item">
          <div class="info-card-label">担当者</div>
          <div class="info-card-value">${expense.person || '-'}</div>
        </div>
        <div class="info-card-item">
          <div class="info-card-label">支払予定日</div>
          <div class="info-card-value">${expense.dueDate || '-'}</div>
        </div>
        <div class="info-card-item">
          <div class="info-card-label">支払金額</div>
          <div class="info-card-value">${expense.amount.toLocaleString()}円</div>
        </div>
      </div>
      ${expense.notes ? `<div class="info-card-notes">${expense.notes}</div>` : ''}
    `;
    container.appendChild(card);
  });
  
  // 削除ボタンにイベントリスナーを追加
  document.querySelectorAll('#expense-list .remove-card-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      app.expenses = app.expenses.filter(item => item.id !== id);
      renderExpenses(app);
      updateSummary(app);
      app.markHasChanges();
    });
  });
}

/**
 * コメントを描画する
 * @param {Object} app - KarteAppオブジェクト
 */
function renderComments(app) {
  const container = document.getElementById('comment-thread');
  container.innerHTML = '';
  
  if (app.comments.length === 0) {
    container.innerHTML = '<p>コメントはありません</p>';
    return;
  }
  
  app.comments.forEach(comment => {
    const date = new Date(comment.date);
    const formattedDate = `${date.getFullYear()}/${(date.getMonth()+1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment-item';
    commentDiv.innerHTML = `
      <div class="comment-meta">
        <strong>${comment.author}</strong> - ${formattedDate}
      </div>
      <div class="comment-text">${comment.text}</div>
    `;
    container.appendChild(commentDiv);
  });
}

/**
 * 収支情報を更新する
 * @param {Object} app - KarteAppオブジェクト
 */
function updateSummary(app) {
  // 入金の合計を計算
  const totalPayment = app.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  document.getElementById('total-payment').value = totalPayment.toLocaleString() + '円';
  
  // 支払の合計を計算
  const totalExpense = app.expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  document.getElementById('total-expense').value = totalExpense.toLocaleString() + '円';
  
  // 利益額を計算
  const profit = totalPayment - totalExpense;
  document.getElementById('profit-amount').value = profit.toLocaleString() + '円';
  
  // 利益率を計算
  const profitRate = totalPayment > 0 ? (profit / totalPayment * 100).toFixed(1) : 0;
  document.getElementById('profit-rate').value = profitRate + '%';
  
  // 一人あたり利益を計算
  const persons = parseInt(document.getElementById('total-persons').value) || 0;
  const profitPerPerson = persons > 0 ? Math.round(profit / persons) : 0;
  document.getElementById('profit-per-person').value = profitPerPerson.toLocaleString() + '円';
  
  // 自動計算の表示更新も兼ねているので単価も再計算
  const totalAmount = parseFloat(document.getElementById('total-amount').value) || 0;
  if (totalAmount > 0 && persons > 0) {
    const unitPrice = Math.round(totalAmount / persons);
    document.getElementById('unit-price').value = unitPrice;
  }
}
