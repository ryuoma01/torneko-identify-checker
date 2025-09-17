// アプリケーションのメインクラス
class TornekoItemApp {
  constructor() {
    this.items = [];
    this.identifiedItems = new Set();
    this.currentFilter = '';
    this.currentSort = 'name';
    this.currentCategoryFilter = 'all'; // 'all'または特定のカテゴリ名
    this.init();
  }

  async init() {
    await this.loadItems();
    this.loadIdentifiedItems();
    this.setupEventListeners();
    this.renderItems();
    this.initializePriceTab();
  }

  // アイテムデータを読み込み
  async loadItems() {
    try {
      const response = await fetch('items.json');
      this.items = await response.json();
    } catch (error) {
      console.error('アイテムデータの読み込みに失敗しました:', error);
      this.items = [];
    }
  }

  // localStorage から識別済みアイテムを読み込み
  loadIdentifiedItems() {
    const saved = localStorage.getItem('torneko-identify-checker-items');
    if (saved) {
      try {
        const identifiedArray = JSON.parse(saved);
        this.identifiedItems = new Set(identifiedArray);
      } catch (error) {
        console.error('識別データの読み込みに失敗しました:', error);
        this.identifiedItems = new Set();
      }
    }
  }

  // localStorage に識別済みアイテムを保存
  saveIdentifiedItems() {
    const identifiedArray = Array.from(this.identifiedItems);
    localStorage.setItem('torneko-identify-checker-items', JSON.stringify(identifiedArray));
  }

  // イベントリスナーを設定
  setupEventListeners() {
    // タブ切り替え
    document.getElementById('tab-items').addEventListener('click', () => this.switchTab('items'));
    document.getElementById('tab-price').addEventListener('click', () => this.switchTab('price'));

    // 検索機能
    document.getElementById('search-input').addEventListener('input', (e) => {
      this.currentFilter = e.target.value.toLowerCase();
      this.renderItems();
      this.toggleClearButton('search-clear-btn', e.target.value);
    });

    // 検索クリアボタン
    document.getElementById('search-clear-btn').addEventListener('click', () => {
      const searchInput = document.getElementById('search-input');
      searchInput.value = '';
      this.currentFilter = '';
      this.renderItems();
      this.toggleClearButton('search-clear-btn', '');
      searchInput.focus();
    });

    // ソート機能
    document.getElementById('sort-select').addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      this.renderItems();
    });

    // リセット機能
    document.getElementById('reset-button').addEventListener('click', () => this.showResetModal());

    // 値段検索 - 動的検索
    document.getElementById('price-input').addEventListener('input', (e) => {
      this.searchByPrice();
      this.toggleClearButton('price-clear-btn', e.target.value);
    });

    // 値段検索クリアボタン
    document.getElementById('price-clear-btn').addEventListener('click', () => {
      const priceInput = document.getElementById('price-input');
      priceInput.value = '';
      this.searchByPrice();
      this.toggleClearButton('price-clear-btn', '');
      priceInput.focus();
    });
    
    // 価格フィルターチェックボックス - 動的更新
    document.getElementById('filter-buy').addEventListener('change', () => this.searchByPrice());
    document.getElementById('filter-sell').addEventListener('change', () => this.searchByPrice());

    // カテゴリフィルターボタン
    document.querySelectorAll('.category-jump-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const category = e.target.dataset.category;
        this.filterByCategory(category);
      });
    });
    
    // 全表示ボタンを追加
    const allButton = document.createElement('button');
    allButton.className = 'category-jump-btn active';
    allButton.textContent = '全て';
    allButton.addEventListener('click', () => {
      this.filterByCategory('all');
    });
    const categoryButtons = document.querySelector('.category-jump-buttons');
    categoryButtons.insertBefore(allButton, categoryButtons.firstChild);

    // アイテム詳細モーダル関連
    const itemModal = document.getElementById('item-modal');
    const closeItemModal = document.querySelector('.close');
    
    closeItemModal.addEventListener('click', () => this.closeModal());
    itemModal.addEventListener('click', (e) => {
      if (e.target === itemModal) {
        this.closeModal();
      }
    });

    // リセット確認モーダル関連
    const resetModal = document.getElementById('reset-modal');
    const closeResetModal = document.querySelector('.reset-close');
    const resetCancel = document.getElementById('reset-cancel');
    const resetConfirm = document.getElementById('reset-confirm');
    
    closeResetModal.addEventListener('click', () => this.closeResetModal());
    resetCancel.addEventListener('click', () => this.closeResetModal());
    resetConfirm.addEventListener('click', () => this.executeReset());
    resetModal.addEventListener('click', (e) => {
      if (e.target === resetModal) {
        this.closeResetModal();
      }
    });

    // 先頭に戻るボタン
    document.getElementById('scroll-to-top-items').addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    document.getElementById('scroll-to-top-price').addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
        this.closeResetModal();
      }
    });
  }

  // タブ切り替え
  switchTab(tab) {
    // タブボタンの状態を更新
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    if (tab === 'items') {
      document.getElementById('tab-items').classList.add('active');
      document.getElementById('items-tab').classList.add('active');
    } else if (tab === 'price') {
      document.getElementById('tab-price').classList.add('active');
      document.getElementById('price-tab').classList.add('active');
      // 値段検索タブに切り替わった時に入力フィールドにフォーカス
      setTimeout(() => {
        document.getElementById('price-input').focus();
      }, 100);
      
      // 値段検索結果が表示されている場合は状態を同期
      const priceInput = document.getElementById('price-input');
      if (priceInput.value.trim() !== '') {
        this.updatePriceSearchResults();
      }
    }
  }

  // アイテム一覧を描画
  renderItems() {
    const itemsList = document.getElementById('items-list');
    
    // フィルタリング（アイテム名と読み仮名のみ）
    let filteredItems = this.items.filter(item => {
      if (!this.currentFilter) return true;
      return item.name.toLowerCase().includes(this.currentFilter) ||
             item.reading.toLowerCase().includes(this.currentFilter);
    });
    
    // カテゴリフィルタリング
    if (this.currentCategoryFilter !== 'all') {
      filteredItems = filteredItems.filter(item => 
        item.category === this.currentCategoryFilter
      );
    }

    // ソート処理
    const sortedItems = this.sortItems(filteredItems);

    if (sortedItems.length === 0) {
      itemsList.innerHTML = `
        <div class="empty-state">
          <p>該当するアイテムが見つかりません</p>
          <p>検索条件を変更してみてください</p>
        </div>
      `;
      return;
    }

    itemsList.innerHTML = '';

    // 常にカテゴリ別にグループ化して表示
    const groupedItems = this.groupItemsByCategory(sortedItems);
    const categoryOrder = ['草', '杖', '剣', '盾', '巻物', '指輪', '壺'];
    
    categoryOrder.forEach(category => {
      if (groupedItems[category]) {
        // カテゴリ内でソート
        const sortedCategoryItems = this.sortItemsInCategory(groupedItems[category]);
        const categorySection = this.createCategorySection(category, sortedCategoryItems);
        itemsList.appendChild(categorySection);
      }
    });

    // その他のカテゴリ
    Object.keys(groupedItems).forEach(category => {
      if (!categoryOrder.includes(category)) {
        const sortedCategoryItems = this.sortItemsInCategory(groupedItems[category]);
        const categorySection = this.createCategorySection(category, sortedCategoryItems);
        itemsList.appendChild(categorySection);
      }
    });
  }

  // アイテムをソート（フィルタリング用）
  sortItems(items) {
    // フィルタリング後のアイテムをそのまま返す（カテゴリ内ソートは別で行う）
    return [...items];
  }

  // カテゴリ内でアイテムをソート
  sortItemsInCategory(items) {
    const sortedItems = [...items];
    
    switch (this.currentSort) {
      case 'name':
        return sortedItems.sort((a, b) => a.reading.localeCompare(b.reading, 'ja'));
      case 'price':
        return sortedItems.sort((a, b) => a.price - b.price);
      case 'identified':
        return sortedItems.sort((a, b) => {
          const aIdentified = this.identifiedItems.has(a.name);
          const bIdentified = this.identifiedItems.has(b.name);
          if (aIdentified && !bIdentified) return -1;
          if (!aIdentified && bIdentified) return 1;
          return a.reading.localeCompare(b.reading, 'ja');
        });
      default:
        return sortedItems;
    }
  }

  // カテゴリ別にアイテムをグループ化
  groupItemsByCategory(items) {
    return items.reduce((groups, item) => {
      const category = item.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {});
  }

  // カテゴリセクションを作成
  createCategorySection(category, items) {
    const section = document.createElement('div');
    section.className = 'category-section';
    section.id = `category-${category}`;
    
    const header = document.createElement('h3');
    header.textContent = `${category} (${items.length})`;
    header.style.cssText = `
      color: var(--main-color);
      font-size: 16px;
      font-weight: bold;
      margin: 20px 0 12px 0;
      padding: 8px 12px;
      background-color: #f8f9fa;
      border-left: 4px solid var(--accent-color);
      border-radius: 4px;
    `;
    
    section.appendChild(header);

    items.forEach(item => {
      const itemElement = this.createItemElement(item);
      section.appendChild(itemElement);
    });

    return section;
  }

  // アイテム要素を作成
  createItemElement(item) {
    const itemDiv = document.createElement('div');
    itemDiv.className = `item ${this.identifiedItems.has(item.name) ? 'identified' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'item-checkbox';
    checkbox.checked = this.identifiedItems.has(item.name);
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      this.toggleIdentified(item.name);
    });

    const content = document.createElement('div');
    content.className = 'item-content';

    const name = document.createElement('div');
    name.className = 'item-name';
    name.textContent = item.name;

    const category = document.createElement('span');
    category.className = 'item-category';
    category.textContent = item.category;

    const priceContainer = document.createElement('div');
    priceContainer.className = 'item-price-container';
    
    const buyPrice = document.createElement('div');
    buyPrice.className = 'item-price buy-price';
    const buyValue = this.getCurrentPrice(item, 'buy', '0');
    buyPrice.textContent = `買:${buyValue}G`;
    
    const sellPrice = document.createElement('div');
    sellPrice.className = 'item-price sell-price';
    const sellValue = this.getCurrentPrice(item, 'sell', '0');
    sellPrice.textContent = `売:${sellValue}G`;
    
    priceContainer.appendChild(buyPrice);
    priceContainer.appendChild(sellPrice);
    
    const detailButton = document.createElement('button');
    detailButton.className = 'detail-button';
    detailButton.textContent = '詳細';
    detailButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showItemDetails(item);
    });

    content.appendChild(name);
    content.appendChild(category);

    itemDiv.appendChild(checkbox);
    itemDiv.appendChild(content);
    itemDiv.appendChild(priceContainer);
    itemDiv.appendChild(detailButton);

    // アイテム全体をクリックしてチェックボックスを切り替え
    itemDiv.addEventListener('click', (e) => {
      if (e.target !== checkbox && e.target !== detailButton) {
        this.toggleIdentified(item.name);
      }
    });

    return itemDiv;
  }

  // アイテムの識別状態を切り替え
  toggleIdentified(itemName) {
    if (this.identifiedItems.has(itemName)) {
      this.identifiedItems.delete(itemName);
    } else {
      this.identifiedItems.add(itemName);
    }
    this.saveIdentifiedItems();
    this.renderItems();
    
    // 値段検索結果が表示されている場合は、検索結果も更新
    const priceInput = document.getElementById('price-input');
    if (priceInput.value.trim() !== '') {
      this.updatePriceSearchResults();
    }
    
    // カテゴリフィルターが変更された場合は検索状態をクリア
    if (this.currentCategoryFilter !== 'all') {
      const searchInput = document.getElementById('search-input');
      if (searchInput.value.trim() !== '') {
        searchInput.value = '';
        this.currentFilter = '';
        this.toggleClearButton('search-clear-btn', '');
      }
    }
  }

  // 値段検索結果での識別状態切り替え（再描画を避ける）
  toggleIdentifiedForPriceSearch(itemName, checkbox, resultDiv) {
    if (this.identifiedItems.has(itemName)) {
      this.identifiedItems.delete(itemName);
    } else {
      this.identifiedItems.add(itemName);
    }
    this.saveIdentifiedItems();
    
    // チェックボックスとクラス名を即座に更新
    checkbox.checked = this.identifiedItems.has(itemName);
    resultDiv.className = `price-result-item ${this.identifiedItems.has(itemName) ? 'identified' : ''}`;
    
    // アイテム一覧も更新（但し値段検索結果は再描画しない）
    this.renderItems();
  }

  // 値段検索結果のチェック状態を更新（再描画せずに）
  updatePriceSearchResults() {
    const resultsDiv = document.getElementById('price-results');
    const priceResultItems = resultsDiv.querySelectorAll('.price-result-item');
    
    priceResultItems.forEach(resultDiv => {
      const checkbox = resultDiv.querySelector('.item-checkbox');
      const itemName = resultDiv.querySelector('.price-result-name').textContent;
      
      if (checkbox && itemName) {
        checkbox.checked = this.identifiedItems.has(itemName);
        resultDiv.className = `price-result-item ${this.identifiedItems.has(itemName) ? 'identified' : ''}`;
      }
    });
  }

  // 値段で検索
  searchByPrice() {
    const priceInput = document.getElementById('price-input');
    const priceValue = priceInput.value.trim();
    const resultsDiv = document.getElementById('price-results');

    // 空の入力の場合は結果をクリア
    if (priceValue === '') {
      resultsDiv.innerHTML = `
        <div class="empty-state">
          <p>値段を入力すると検索結果が表示されます</p>
        </div>
      `;
      return;
    }

    const price = parseInt(priceValue);
    if (isNaN(price) || price <= 0) {
      resultsDiv.innerHTML = `
        <div class="empty-state">
          <p>有効な値段を入力してください</p>
        </div>
      `;
      return;
    }

    // 買値・売値両方で検索（全ての補正値・残回数で検索）
    const matchingItems = this.items.filter(item => {
      return this.itemMatchesPrice(item, price);
    });

    if (matchingItems.length === 0) {
      resultsDiv.innerHTML = `
        <div class="empty-state">
          <p>${price}Gのアイテムは見つかりませんでした</p>
        </div>
      `;
      return;
    }

    resultsDiv.innerHTML = '';
    
    // カテゴリ別にグループ化して表示
    const groupedItems = this.groupItemsByCategory(matchingItems);
    const categoryOrder = ['草', '杖', '剣', '盾', '巻物', '指輪', '壺'];
    
    categoryOrder.forEach(category => {
      if (groupedItems[category]) {
        const categorySection = this.createPriceCategorySection(category, groupedItems[category]);
        resultsDiv.appendChild(categorySection);
      }
    });

    // その他のカテゴリ
    Object.keys(groupedItems).forEach(category => {
      if (!categoryOrder.includes(category)) {
        const categorySection = this.createPriceCategorySection(category, groupedItems[category]);
        resultsDiv.appendChild(categorySection);
      }
    });
  }

  // 値段検索結果のカテゴリセクションを作成
  createPriceCategorySection(category, items) {
    const section = document.createElement('div');
    section.className = 'price-category-section';
    
    const header = document.createElement('h3');
    header.textContent = `${category} (${items.length})`;
    header.style.cssText = `
      color: var(--main-color);
      font-size: 16px;
      font-weight: bold;
      margin: 20px 0 12px 0;
      padding: 8px 12px;
      background-color: #f8f9fa;
      border-left: 4px solid var(--accent-color);
      border-radius: 4px;
    `;
    
    section.appendChild(header);

    items.forEach(item => {
      const itemElement = this.createPriceResultElement(item);
      section.appendChild(itemElement);
    });

    return section;
  }

  // 値段検索結果の要素を作成
  createPriceResultElement(item) {
    const resultDiv = document.createElement('div');
    resultDiv.className = `price-result-item ${this.identifiedItems.has(item.name) ? 'identified' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'item-checkbox';
    checkbox.checked = this.identifiedItems.has(item.name);
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      this.toggleIdentifiedForPriceSearch(item.name, checkbox, resultDiv);
    });

    const content = document.createElement('div');
    content.className = 'price-result-content';

    const name = document.createElement('div');
    name.className = 'price-result-name';
    name.textContent = item.name;

    const effect = document.createElement('div');
    effect.className = 'price-result-effect';
    effect.textContent = item.effect;

    const priceContainer = document.createElement('div');
    priceContainer.className = 'price-result-price-container';
    
    const buyPrice = document.createElement('div');
    buyPrice.className = 'price-result-price buy-price';
    const buyValue = this.getCurrentPrice(item, 'buy', '0');
    buyPrice.textContent = `買値: ${buyValue}G`;
    
    const sellPrice = document.createElement('div');
    sellPrice.className = 'price-result-price sell-price';
    const sellValue = this.getCurrentPrice(item, 'sell', '0');
    sellPrice.textContent = `売値: ${sellValue}G`;
    
    priceContainer.appendChild(buyPrice);
    priceContainer.appendChild(sellPrice);
    
    const detailButton = document.createElement('button');
    detailButton.className = 'detail-button';
    detailButton.textContent = '詳細';
    detailButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showItemDetails(item);
    });

    content.appendChild(name);
    content.appendChild(effect);
    content.appendChild(priceContainer);

    resultDiv.appendChild(checkbox);
    resultDiv.appendChild(content);
    resultDiv.appendChild(detailButton);

    resultDiv.addEventListener('click', (e) => {
      if (e.target !== checkbox && e.target !== detailButton && !detailButton.contains(e.target)) {
        this.toggleIdentifiedForPriceSearch(item.name, checkbox, resultDiv);
      }
    });

    return resultDiv;
  }

  // アイテム詳細をモーダルで表示
  showItemDetails(item) {
    const modal = document.getElementById('item-modal');
    const itemName = document.getElementById('modal-item-name');
    const itemEffect = document.getElementById('modal-item-effect');
    const itemPrice = document.getElementById('modal-item-price');

    itemName.textContent = item.name;
    itemEffect.textContent = item.effect;
    // モーダルでは買値・売値両方を表示
    const buyPrice = this.getCurrentPrice(item, 'buy', '0');
    const sellPrice = this.getCurrentPrice(item, 'sell', '0');
    itemPrice.innerHTML = `
      <div class="modal-price-item buy-price">買値: ${buyPrice}G</div>
      <div class="modal-price-item sell-price">売値: ${sellPrice}G</div>
    `;

    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // スクロールを防ぐ
  }

  // アイテム詳細モーダルを閉じる
  closeModal() {
    const modal = document.getElementById('item-modal');
    modal.classList.remove('show');
    document.body.style.overflow = ''; // スクロールを復元
  }

  // リセット確認モーダルを表示
  showResetModal() {
    const modal = document.getElementById('reset-modal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // スクロールを防ぐ
  }

  // リセット確認モーダルを閉じる
  closeResetModal() {
    const modal = document.getElementById('reset-modal');
    modal.classList.remove('show');
    document.body.style.overflow = ''; // スクロールを復元
  }

  // リセットを実行
  executeReset() {
    // 識別状態をクリア
    this.identifiedItems.clear();
    
    // localStorageからも削除
    localStorage.removeItem('torneko-identify-checker-items');
    
    // 画面を更新
    this.renderItems();
    
    // モーダルを閉じる
    this.closeResetModal();
    
    // 値段検索結果も再描画（もし表示中なら）
    const priceInput = document.getElementById('price-input');
    if (priceInput.value) {
      this.searchByPrice();
    }
  }

  // 現在の価格を取得する（新しいデータ構造対応）
  getCurrentPrice(item, priceType = 'buy', modifier = '0') {
    if (!item.prices || !item.prices[priceType]) {
      return 0;
    }
    
    // 指定された修正値の価格を取得、なければ基本価格(0)を取得
    return item.prices[priceType][modifier] || item.prices[priceType]['0'] || 0;
  }

  // アイテムが指定価格にマッチするかチェック（フィルター対応）
  itemMatchesPrice(item, targetPrice) {
    if (!item.prices) return false;
    
    const filterBuy = document.getElementById('filter-buy').checked;
    const filterSell = document.getElementById('filter-sell').checked;
    
    // 両方チェックなしの場合はマッチしない
    if (!filterBuy && !filterSell) return false;
    
    const buyPrices = item.prices.buy || {};
    const sellPrices = item.prices.sell || {};
    
    // 買値でマッチするかチェック
    if (filterBuy) {
      for (const price of Object.values(buyPrices)) {
        if (price === targetPrice) return true;
      }
    }
    
    // 売値でマッチするかチェック
    if (filterSell) {
      for (const price of Object.values(sellPrices)) {
        if (price === targetPrice) return true;
      }
    }
    
    return false;
  }

  // 値段検索タブの初期化
  initializePriceTab() {
    const resultsDiv = document.getElementById('price-results');
    resultsDiv.innerHTML = `
      <div class="empty-state">
        <p>値段を入力すると検索結果が表示されます</p>
      </div>
    `;
    
    // クリアボタンの初期状態を設定
    this.toggleClearButton('search-clear-btn', document.getElementById('search-input').value);
    this.toggleClearButton('price-clear-btn', document.getElementById('price-input').value);
  }

  // クリアボタンの表示/非表示を切り替え
  toggleClearButton(buttonId, inputValue) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.style.display = inputValue.trim() !== '' ? 'block' : 'none';
    }
  }

  // カテゴリでフィルタリング
  filterByCategory(category) {
    this.currentCategoryFilter = category;
    
    // ボタンのactive状態を更新
    document.querySelectorAll('.category-jump-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // クリックされたボタンをactiveに
    const clickedButton = category === 'all' 
      ? document.querySelector('.category-jump-btn') // 初回は全てボタン
      : document.querySelector(`[data-category="${category}"]`);
    
    if (clickedButton) {
      clickedButton.classList.add('active');
    }
    
    // アイテム一覧を再描画
    this.renderItems();
  }
}

// アプリケーションを起動
document.addEventListener('DOMContentLoaded', () => {
  new TornekoItemApp();
});