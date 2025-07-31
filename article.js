// 配置API基础URL - 使用您部署的URL
const API_BASE = 'https://saabor-blog-api.eoolife.workers.dev';

// DOM元素
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userMenu = document.getElementById('userMenu');
const userAvatar = document.getElementById('userAvatar');
const userDropdown = document.getElementById('userDropdown');
const articleContainer = document.getElementById('articleContainer');
const articleTitle = document.getElementById('articleTitle');
const articleSubtitle = document.getElementById('articleSubtitle');
const authorAvatar = document.getElementById('authorAvatar');
const authorName = document.getElementById('authorName');
const adminBadge = document.getElementById('adminBadge');
const articleDate = document.getElementById('articleDate');
const articleContent = document.getElementById('articleContent');
const articleActions = document.getElementById('articleActions');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const retryBtn = document.getElementById('retryBtn');
const themeToggle = document.getElementById('themeToggle');

// 存储当前用户信息和文章数据
let currentUser = null;
let currentArticle = null;

// 检查主题模式
function checkTheme() {
    const savedTheme = localStorage.getItem('blog-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// 切换主题
function toggleTheme() {
    if (document.body.classList.contains('dark-mode')) {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('blog-theme', 'light');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        document.body.classList.add('dark-mode');
        localStorage.setItem('blog-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // 重新应用代码高亮
    if (typeof hljs !== 'undefined') {
        document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }
}

// 检查用户是否已登录
async function checkAuth() {
    const token = localStorage.getItem('blog_token');
    if (!token) {
        currentUser = null;
        updateAuthUI();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/user`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('未授权');
        }
        
        currentUser = await response.json();
        updateAuthUI();
    } catch (error) {
        console.error('获取用户信息失败:', error);
        localStorage.removeItem('blog_token');
        currentUser = null;
        updateAuthUI();
    }
}

// 更新认证UI
function updateAuthUI() {
    if (currentUser) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        userMenu.style.display = 'flex';
        userAvatar.src = currentUser.avatar;
    } else {
        loginBtn.style.display = 'inline-flex';
        registerBtn.style.display = 'inline-flex';
        userMenu.style.display = 'none';
    }
}

// 加载文章
async function loadArticle() {
    // 显示加载指示器
    loadingIndicator.style.display = 'block';
    articleContainer.style.display = 'none';
    errorMessage.style.display = 'none';
    
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        if (!id) {
            throw new Error('未提供文章ID');
        }
        
        const response = await fetch(`${API_BASE}/api/articles/${id}`);
        if (!response.ok) {
            throw new Error('文章未找到');
        }
        
        currentArticle = await response.json();
        
        // 填充文章内容
        articleTitle.textContent = currentArticle.title;
        articleSubtitle.textContent = currentArticle.subtitle || '';
        articleSubtitle.style.display = currentArticle.subtitle ? 'block' : 'none';
        
        // 获取作者信息
        let authorData = {
            username: '未知用户',
            avatar: 'https://avatars.githubusercontent.com/u/211512911?v=4',
            is_admin: false
        };
        
        try {
            const authorResponse = await fetch(`${API_BASE}/api/users/${currentArticle.author_uid}`);
            if (authorResponse.ok) {
                authorData = await authorResponse.json();
            }
        } catch (authorError) {
            console.error('获取作者信息失败:', authorError);
        }
        
        // 设置作者信息
        authorAvatar.src = authorData.avatar || 'https://avatars.githubusercontent.com/u/211512911?v=4';
        authorName.textContent = authorData.username;
        adminBadge.style.display = authorData.is_admin ? 'inline' : 'none';
        
        // 格式化日期
        const date = new Date(currentArticle.created_at);
        const formattedDate = date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        articleDate.textContent = formattedDate;
        
        // 处理内容
        if (currentArticle.use_markdown) {
            articleContent.innerHTML = marked.parse(currentArticle.content);
        } else {
            articleContent.innerHTML = `<p>${currentArticle.content.replace(/\n/g, '</p><p>')}</p>`;
        }
        
        // 应用代码高亮
        if (typeof hljs !== 'undefined') {
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }
        
        // 创建操作按钮
        articleActions.innerHTML = '';
        if (currentUser && (currentUser.is_admin || currentUser.id === currentArticle.author.id)) {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-secondary';
            editBtn.innerHTML = '<i class="fas fa-edit"></i> 编辑';
            editBtn.onclick = () => {
                window.location.href = `edit-article.html?id=${currentArticle.id}`;
            };
            articleActions.appendChild(editBtn);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> 删除';
            deleteBtn.onclick = deleteArticle;
            articleActions.appendChild(deleteBtn);
        }
        
        // 显示文章容器
        loadingIndicator.style.display = 'none';
        articleContainer.style.display = 'block';
    } catch (error) {
        console.error('加载文章失败:', error);
        errorText.textContent = error.message || '无法加载文章，请稍后再试。';
        loadingIndicator.style.display = 'none';
        errorMessage.style.display = 'block';
    }
}

// 删除文章
function deleteArticle() {
    if (!confirm('确定要删除这篇文章吗？此操作无法撤销。')) {
        return;
    }
    
    const token = localStorage.getItem('blog_token');
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    fetch(`${API_BASE}/api/articles/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('删除文章失败');
        }
        return response.json();
    })
    .then(() => {
        alert('文章删除成功！');
        window.location.href = 'index.html';
    })
    .catch(error => {
        console.error('删除文章失败:', error);
        alert(`删除失败: ${error.message}`);
    });
}

// 事件监听器
loginBtn.addEventListener('click', () => {
    window.location.href = 'login.html';
});

registerBtn.addEventListener('click', () => {
    window.location.href = 'register.html';
});

logoutBtn.addEventListener('click', () => {
    const token = localStorage.getItem('blog_token');
    if (token) {
        fetch(`${API_BASE}/api/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).catch(console.error);
    }
    
    localStorage.removeItem('blog_token');
    currentUser = null;
    updateAuthUI();
    hideModal(userDropdown);
    window.location.href = 'index.html';
});

// 用户菜单切换
userAvatar.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('active');
});

// 点击文档其他地方关闭下拉菜单
document.addEventListener('click', (e) => {
    if (!userMenu.contains(e.target)) {
        userDropdown.classList.remove('active');
    }
});

// 切换主题
themeToggle.addEventListener('click', toggleTheme);

// 重试按钮
retryBtn.addEventListener('click', loadArticle);

// 页面加载时检查主题、认证状态和加载文章
document.addEventListener('DOMContentLoaded', async () => {
    checkTheme();
    await checkAuth();
    await loadArticle();
});