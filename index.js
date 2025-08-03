addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  if (url.pathname === '/') {
    return serveHomePage()
  }
  
  if (url.pathname === '/api/images') {
    return serveImageData(request)
  }
  
  if (url.pathname.startsWith('/admin')) {
    return handleAdminRoutes(request)
  }
  
  return new Response('Not Found', { status: 404 })
}

// 首页HTML - 带大图预览的瀑布流布局
const homePageHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>瀑布流图片画廊</title>
  <style>
    :root {
      --primary: #4361ee;
      --primary-dark: #3a56d4;
      --light-bg: #f8fafc;
      --text: #1e293b;
      --text-light: #64748b;
      --modal-bg: rgba(0, 0, 0, 0.85);
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--light-bg);
      color: var(--text);
      line-height: 1.6;
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
      overflow-x: hidden;
    }
    
    header {
      text-align: center;
      margin-bottom: 40px;
      padding-top: 20px;
    }
    
    h1 {
      font-size: 2.2rem;
      margin-bottom: 8px;
      color: var(--text);
      font-weight: 700;
    }
    
    .subtitle {
      color: var(--text-light);
      font-size: 1.1rem;
      margin-bottom: 20px;
    }
    
    /* Masonry瀑布流布局 */
    .masonry {
      column-count: 3;
      column-gap: 20px;
      margin-bottom: 40px;
    }
    
    .masonry-item {
      break-inside: avoid;
      margin-bottom: 20px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      background: white;
      cursor: pointer;
    }
    
    .masonry-item:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    }
    
    .masonry-item img {
      width: 100%;
      display: block;
      transition: opacity 0.3s ease;
    }
    
    .load-more-container {
      text-align: center;
      margin: 40px 0;
    }
    
    .btn {
      padding: 12px 28px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    
    .btn:hover {
      background: var(--primary-dark);
      transform: translateY(-2px);
    }
    
    .btn:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
      transform: none;
    }
    
    .admin-link {
      position: absolute;
      top: 20px;
      right: 20px;
      color: var(--primary);
      text-decoration: none;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 6px;
      transition: background 0.2s;
    }
    
    .admin-link:hover {
      background: rgba(67, 97, 238, 0.1);
      text-decoration: none;
    }
    
    footer {
      text-align: center;
      margin-top: 50px;
      padding: 20px 0;
      color: var(--text-light);
      font-size: 0.9rem;
    }
    
    .no-images {
      text-align: center;
      column-span: all;
      padding: 40px 20px;
      color: var(--text-light);
    }
    
    /* 大图预览模态框 */
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--modal-bg);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    
    .modal.open {
      opacity: 1;
      visibility: visible;
    }
    
    .modal-content {
      position: relative;
      max-width: 90%;
      max-height: 90%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .modal-image {
      max-width: 100%;
      max-height: 80vh;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    
    .modal-close {
      position: absolute;
      top: -40px;
      right: 0;
      background: none;
      border: none;
      color: white;
      font-size: 2rem;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s;
    }
    
    .modal-close:hover {
      opacity: 1;
    }
    
    .modal-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      font-size: 1.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.5;
      transition: opacity 0.2s, background 0.2s;
    }
    
    .modal-nav:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.3);
    }
    
    .modal-prev {
      left: 20px;
    }
    
    .modal-next {
      right: 20px;
    }
    
    .modal-info {
      color: white;
      text-align: center;
      margin-top: 15px;
      font-size: 1.1rem;
      max-width: 80%;
    }
    
    /* 响应式调整列数 */
    @media (max-width: 1024px) {
      .masonry {
        column-count: 2;
      }
    }
    
    @media (max-width: 768px) {
      .masonry {
        column-count: 1;
      }
      
      header {
        margin-bottom: 30px;
      }
      
      .modal-nav {
        width: 40px;
        height: 40px;
        font-size: 1.2rem;
      }
    }
    
    @media (max-width: 480px) {
      .admin-link {
        position: relative;
        top: 0;
        right: 0;
        display: block;
        margin: 15px auto;
        text-align: center;
        width: fit-content;
      }
      
      .modal-image {
        max-width: 95%;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>瀑布流图片画廊</h1>
    <p class="subtitle">点击图片查看大图</p>
    <a href="/admin" class="admin-link">管理后台</a>
  </header>
  
  <div class="masonry" id="gallery"></div>
  
  <div class="load-more-container">
    <button class="btn" id="loadMore">加载更多</button>
  </div>
  
  <footer>
    <p>© ${new Date().getFullYear()} 瀑布流图片画廊 | 基于 Cloudflare Worker</p>
  </footer>
  
  <!-- 大图预览模态框 -->
  <div class="modal" id="imageModal">
    <button class="modal-nav modal-prev" id="modalPrev">❮</button>
    <div class="modal-content">
      <button class="modal-close" id="modalClose">×</button>
      <img class="modal-image" id="modalImage" src="" alt="大图预览">
      <div class="modal-info" id="modalInfo"></div>
    </div>
    <button class="modal-nav modal-next" id="modalNext">❯</button>
  </div>
  
  <script>
    let currentPage = 0;
    const gallery = document.getElementById('gallery');
    const loadBtn = document.getElementById('loadMore');
    let allImages = []; // 存储所有图片URL
    
    // 大图预览相关元素
    const imageModal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalInfo = document.getElementById('modalInfo');
    const modalClose = document.getElementById('modalClose');
    const modalPrev = document.getElementById('modalPrev');
    const modalNext = document.getElementById('modalNext');
    
    // 当前查看的图片索引
    let currentImageIndex = -1;
    
    async function loadImages(page) {
      loadBtn.disabled = true;
      loadBtn.textContent = '加载中...';
      
      try {
        const res = await fetch('/api/images?page=' + page);
        const { images, hasMore } = await res.json();
        
        if (images.length === 0 && page === 0) {
          gallery.innerHTML = '<div class="no-images"><p>暂无图片，请前往管理后台添加</p></div>';
          loadBtn.style.display = 'none';
          return;
        }
        
        // 添加到全局图片列表
        allImages = [...allImages, ...images];
        
        images.forEach((img, index) => {
          const globalIndex = allImages.length - images.length + index;
          const item = document.createElement('div');
          item.className = 'masonry-item';
          item.innerHTML = \`
            <img 
              src="\${img}" 
              alt="画廊图片"
              loading="lazy"
              data-index="\${globalIndex}"
            >
          \`;
          gallery.appendChild(item);
          
          // 添加点击事件
          item.addEventListener('click', () => openModal(globalIndex));
        });
        
        currentPage = page;
        loadBtn.disabled = !hasMore;
        loadBtn.textContent = hasMore ? '加载更多' : '已加载全部';
      } catch (e) {
        console.error('加载失败:', e);
        loadBtn.textContent = '加载失败，点击重试';
        loadBtn.disabled = false;
      }
    }
    
    // 打开大图预览
    function openModal(index) {
      currentImageIndex = index;
      modalImage.src = allImages[index];
      modalInfo.textContent = \`图片 \${index + 1} / \${allImages.length}\`;
      imageModal.classList.add('open');
      document.body.style.overflow = 'hidden'; // 禁止背景滚动
    }
    
    // 关闭大图预览
    function closeModal() {
      imageModal.classList.remove('open');
      document.body.style.overflow = 'auto'; // 恢复背景滚动
    }
    
    // 导航到上一张
    function prevImage() {
      if (currentImageIndex > 0) {
        currentImageIndex--;
        modalImage.src = allImages[currentImageIndex];
        modalInfo.textContent = \`图片 \${currentImageIndex + 1} / \${allImages.length}\`;
      }
    }
    
    // 导航到下一张
    function nextImage() {
      if (currentImageIndex < allImages.length - 1) {
        currentImageIndex++;
        modalImage.src = allImages[currentImageIndex];
        modalInfo.textContent = \`图片 \${currentImageIndex + 1} / \${allImages.length}\`;
      }
    }
    
    // 添加事件监听器
    modalClose.addEventListener('click', closeModal);
    modalPrev.addEventListener('click', prevImage);
    modalNext.addEventListener('click', nextImage);
    
    // 点击模态框背景关闭
    imageModal.addEventListener('click', (e) => {
      if (e.target === imageModal) {
        closeModal();
      }
    });
    
    // 键盘导航
    document.addEventListener('keydown', (e) => {
      if (!imageModal.classList.contains('open')) return;
      
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    });
    
    loadBtn.addEventListener('click', () => loadImages(currentPage + 1));
    loadImages(0);
  </script>
</body>
</html>`;

// 管理后台HTML - 网格布局
const adminPageHTML = (images, message = '', isError = false) => `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理后台</title>
  <style>
    :root {
      --primary: #4361ee;
      --primary-dark: #3a56d4;
      --light-bg: #f8fafc;
      --text: #1e293b;
      --text-light: #64748b;
      --success: #10b981;
      --error: #ef4444;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--light-bg);
      color: var(--text);
      line-height: 1.6;
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    header {
      text-align: center;
      margin-bottom: 30px;
      padding-top: 20px;
    }
    
    h1 {
      font-size: 2rem;
      margin-bottom: 5px;
      font-weight: 700;
    }
    
    .back-link {
      display: inline-flex;
      align-items: center;
      margin-top: 15px;
      color: var(--primary);
      text-decoration: none;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 6px;
      transition: background 0.2s;
    }
    
    .back-link:hover {
      background: rgba(67, 97, 238, 0.1);
      text-decoration: none;
    }
    
    .admin-container {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 30px;
      margin-bottom: 40px;
    }
    
    .panel {
      background: white;
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    
    .panel-title {
      font-size: 1.4rem;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e2e8f0;
      font-weight: 600;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--text);
    }
    
    input[type="text"] {
      width: 100%;
      padding: 12px 15px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s;
    }
    
    input[type="text"]:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15);
    }
    
    .btn {
      padding: 12px 25px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      transition: all 0.2s;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .btn:hover {
      background: var(--primary-dark);
      transform: translateY(-2px);
    }
    
    .image-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
      margin-top: 15px;
    }
    
    .image-item {
      position: relative;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
      background: #f1f5f9;
      cursor: pointer;
    }
    
    .image-item img {
      width: 100%;
      height: 180px;
      object-fit: contain;
      display: block;
    }
    
    .delete-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(239, 68, 68, 0.9);
      color: white;
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      z-index: 10;
    }
    
    .delete-btn:hover {
      background: #dc2626;
      transform: scale(1.1);
    }
    
    .message {
      padding: 12px 20px;
      margin: 0 0 20px 0;
      border-radius: 8px;
      text-align: center;
      font-weight: 500;
    }
    
    .success {
      background: rgba(16, 185, 129, 0.1);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    
    .error {
      background: rgba(239, 68, 68, 0.1);
      color: var(--error);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-light);
      grid-column: 1 / -1;
    }
    
    @media (max-width: 900px) {
      .admin-container {
        grid-template-columns: 1fr;
      }
    }
    
    @media (max-width: 480px) {
      .image-list {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>图片管理后台</h1>
    <a href="/" class="back-link">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right:8px">
        <path d="M19 12H5M12 19l-7-7 7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      返回首页
    </a>
  </header>
  
  ${message ? `<div class="message ${isError ? 'error' : 'success'}">${message}</div>` : ''}
  
  <div class="admin-container">
    <div class="panel">
      <h2 class="panel-title">添加新图片</h2>
      <form id="addForm" method="POST" action="/admin/add">
        <div class="form-group">
          <label for="imageUrl">图片URL</label>
          <input 
            type="text" 
            id="imageUrl" 
            name="url" 
            required 
            placeholder="https://example.com/image.jpg"
            autocomplete="off"
          >
        </div>
        <button type="submit" class="btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right:8px">
            <path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round"/>
          </svg>
          添加图片
        </button>
      </form>
    </div>
    
    <div class="panel">
      <h2 class="panel-title">图片管理 <span style="font-weight:normal;color:var(--text-light)">(${images.length})</span></h2>
      ${images.length > 0 ? `
        <div class="image-list">
          ${images.map(img => `
            <div class="image-item">
              <img src="${img}" alt="画廊图片">
              <button class="delete-btn" data-url="${img}">×</button>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <p>暂无图片</p>
          <p>请在左侧添加新的图片链接</p>
        </div>
      `}
    </div>
  </div>
  
  <script>
    document.getElementById('addForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const url = formData.get('url');
      
      if (!url || !url.startsWith('http')) {
        alert('请输入有效的图片URL');
        return;
      }
      
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.innerHTML = '<span>处理中...</span>';
      
      try {
        const response = await fetch('/admin/add', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          location.href = '/admin?message=图片添加成功';
        } else {
          location.href = '/admin?message=添加失败: URL格式错误&error=true';
        }
      } catch (error) {
        location.href = '/admin?message=添加失败: 网络错误&error=true';
      }
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        const imageUrl = btn.dataset.url;
        if (confirm('确定要删除这张图片吗？此操作不可撤销。')) {
          btn.disabled = true;
          btn.textContent = '删除中...';
          
          try {
            const response = await fetch('/admin/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: imageUrl })
            });
            
            if (response.ok) {
              location.href = '/admin?message=图片删除成功';
            } else {
              location.href = '/admin?message=删除失败&error=true';
            }
          } catch (error) {
            location.href = '/admin?message=删除失败: 网络错误&error=true';
          }
        }
      });
    });
    
    // 管理后台的图片点击预览
    document.querySelectorAll('.image-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // 如果不是点击删除按钮
        if (!e.target.closest('.delete-btn')) {
          const img = item.querySelector('img');
          window.open(img.src, '_blank'); // 在新标签页打开
        }
      });
    });
  </script>
</body>
</html>`;

async function serveHomePage() {
  return new Response(homePageHTML, {
    headers: { 'Content-Type': 'text/html' }
  });
}

async function serveImageData(request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '0');
  const perPage = 15; // 增加每页数量以适应瀑布流
  
  const allImages = await IMAGES.get('gallery', 'json') || [];
  
  const start = page * perPage;
  const end = start + perPage;
  const images = allImages.slice(start, end);
  const hasMore = end < allImages.length;
  
  return new Response(JSON.stringify({ images, hasMore }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleAdminRoutes(request) {
  const url = new URL(request.url);
  
  // 身份验证
  if (!await authenticate(request)) {
    return new Response('需要身份验证', {
      status: 401,
      headers: { 
        'WWW-Authenticate': 'Basic realm="Admin Access", charset="UTF-8"',
        'Cache-Control': 'no-store'
      }
    });
  }
  
  // 添加图片
  if (url.pathname === '/admin/add' && request.method === 'POST') {
    const formData = await request.formData();
    const imageUrl = formData.get('url');
    
    if (!isValidImageUrl(imageUrl)) {
      return Response.redirect(url.origin + '/admin?message=无效的URL格式&error=true');
    }
    
    const allImages = await IMAGES.get('gallery', 'json') || [];
    
    // 防止重复添加
    if (!allImages.includes(imageUrl)) {
      allImages.push(imageUrl);
      await IMAGES.put('gallery', JSON.stringify(allImages));
      return Response.redirect(url.origin + '/admin?message=图片添加成功');
    } else {
      return Response.redirect(url.origin + '/admin?message=图片已存在&error=true');
    }
  }
  
  // 删除图片
  if (url.pathname === '/admin/delete' && request.method === 'POST') {
    const { url: imageUrl } = await request.json();
    const allImages = await IMAGES.get('gallery', 'json') || [];
    
    const updatedImages = allImages.filter(img => img !== imageUrl);
    await IMAGES.put('gallery', JSON.stringify(updatedImages));
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // 显示管理界面
  const allImages = await IMAGES.get('gallery', 'json') || [];
  const message = url.searchParams.get('message') || '';
  const isError = url.searchParams.get('error') === 'true';
  
  return new Response(adminPageHTML(allImages, message, isError), {
    headers: { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-store'
    }
  });
}

async function authenticate(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  
  const [scheme, credentials] = authHeader.split(' ');
  if (scheme !== 'Basic') return false;
  
  try {
    const [username, password] = atob(credentials).split(':');
    return username === ADMIN_USER && password === ADMIN_PASS;
  } catch (e) {
    return false;
  }
}

function isValidImageUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return /^https?:/.test(parsedUrl.protocol);
  } catch (e) {
    return false;
  }
}
