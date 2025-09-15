// アプリケーションのメインクラス
class TornekoItemApp {
  constructor() {
    this.items = [];
    this.identifiedItems = new Set();
    this.currentFilter = '';
    this.currentSort = 'name';
    this.init();
  }

  async init() {
    await this.loadItems();
    this.loadIdentifiedItems();
    this.setupEventListeners();
    this.renderItems();
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
    });

    // ソート機能
    document.getElementById('sort-select').addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      this.renderItems();
    });

    // リセット機能
    document.getElementById('reset-button').addEventListener('click', () => this.showResetModal());

    // 値段検索
    document.getElementById('price-search-btn').addEventListener('click', () => this.searchByPrice());
    document.getElementById('price-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.searchByPrice();
      }
    });

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
    }
  }

  // アイテム一覧を描画
  renderItems() {
    const itemsList = document.getElementById('items-list');
    
    // フィルタリング（読み仮名検索も含む）
    const filteredItems = this.items.filter(item => {
      if (!this.currentFilter) return true;
      return item.name.toLowerCase().includes(this.currentFilter) ||
             item.reading.toLowerCase().includes(this.currentFilter) ||
             item.category.toLowerCase().includes(this.currentFilter) ||
             item.effect.toLowerCase().includes(this.currentFilter);
    });

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
    const categoryOrder = ['草', '種', '杖', '剣', '盾', '食べ物', '巻物', '腕輪'];
    
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

    const price = document.createElement('div');
    price.className = 'item-price';
    price.textContent = `${item.price}G`;
    
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
    itemDiv.appendChild(price);
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
  }

  // 値段で検索
  searchByPrice() {
    const priceInput = document.getElementById('price-input');
    const price = parseInt(priceInput.value);
    const resultsDiv = document.getElementById('price-results');

    if (isNaN(price) || price <= 0) {
      resultsDiv.innerHTML = `
        <div class="empty-state">
          <p>有効な値段を入力してください</p>
        </div>
      `;
      return;
    }

    const matchingItems = this.items.filter(item => item.price === price);

    if (matchingItems.length === 0) {
      resultsDiv.innerHTML = `
        <div class="empty-state">
          <p>${price}Gのアイテムは見つかりませんでした</p>
        </div>
      `;
      return;
    }

    resultsDiv.innerHTML = '';
    matchingItems.forEach(item => {
      const resultElement = this.createPriceResultElement(item);
      resultsDiv.appendChild(resultElement);
    });
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
      this.toggleIdentified(item.name);
      // 値段検索結果も更新
      resultDiv.className = `price-result-item ${this.identifiedItems.has(item.name) ? 'identified' : ''}`;
    });

    const content = document.createElement('div');
    content.className = 'price-result-content';

    const name = document.createElement('div');
    name.className = 'price-result-name';
    name.textContent = item.name;

    const effect = document.createElement('div');
    effect.className = 'price-result-effect';
    effect.textContent = item.effect;

    const price = document.createElement('div');
    price.className = 'price-result-price';
    price.textContent = `${item.price}G`;
    
    const detailButton = document.createElement('button');
    detailButton.className = 'detail-button';
    detailButton.textContent = '詳細';
    detailButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showItemDetails(item);
    });

    content.appendChild(name);
    content.appendChild(effect);
    content.appendChild(price);

    resultDiv.appendChild(checkbox);
    resultDiv.appendChild(content);
    resultDiv.appendChild(detailButton);

    resultDiv.addEventListener('click', (e) => {
      if (e.target !== checkbox && e.target !== detailButton) {
        this.toggleIdentified(item.name);
        // 値段検索結果も更新
        resultDiv.className = `price-result-item ${this.identifiedItems.has(item.name) ? 'identified' : ''}`;
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
    itemPrice.textContent = item.price;

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
}

// アプリケーションを起動
document.addEventListener('DOMContentLoaded', () => {
  new TornekoItemApp();
});