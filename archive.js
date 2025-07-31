// 配置API基础URL - 使用您部署的URL
const API_BASE = 'https://saabor-blog-api.eoolife.workers.dev';

// DOM元素
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userMenu = document.getElementById('userMenu');
const userAvatar = document.getElementById('userAvatar');
const userDropdown = document.getElementById('userDropdown');
const loadingIndicator = document.getElementById('loadingIndicator');
const archiveContent = document.getElementById('archiveContent');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const retryBtn = document.getElementById('retryBtn');
const themeToggle = document.getElementById('themeToggle');

// 存储当前用户信息
let currentUser = null;

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

// 加载文章归档
async function loadArchive() {
    // 显示加载指示器
    loadingIndicator.style.display = 'block';
    archiveContent.style.display = 'none';
    errorMessage.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE}/api/articles`);
        if (!response.ok) {
            throw new Error('无法加载文章');
        }
        
        const articles = await response.json();
        
        // 按年份和月份分组
        const groupedArticles = {};
        
        articles.forEach(article => {
            const date = new Date(article.created_at);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            
            if (!groupedArticles[year]) {
                groupedArticles[year] = {};
            }
            
            if (!groupedArticles[year][month]) {
                groupedArticles[year][month] = [];
            }
            
            groupedArticles[year][month].push(article);
        });
        
        // 生成HTML
        let archiveHTML = '';
        
        // 按年份降序排列
        Object.keys(groupedArticles).sort((a, b) => b - a).forEach(year => {
            archiveHTML += `<div class="year-section">`;
            archiveHTML += `<h2 class="year-header">${year}年</h2>`;
            
            // 按月份降序排列
            Object.keys(groupedArticles[year]).sort((a, b) => b - a).forEach(month => {
                const monthNames = [
                    '一', '二', '三', '四', '五', '六',
                    '七', '八', '九', '十', '十一', '十二'
                ];
                
                archiveHTML += `<div class="month-section">`;
                archiveHTML += `<h3 class="month-header">`;
                archiveHTML += `<i class="fas fa-calendar-alt"></i>`;
                archiveHTML += `${monthNames[month - 1]}月`;
                archiveHTML += `</h3>`;
                archiveHTML += `<ul class="article-list">`;
                
                groupedArticles[year][month].forEach(article => {
                    const articleDate = new Date(article.created_at);
                    const day = articleDate.getDate();
                    
                    // 获取作者信息
                    const author = article.author || {
                        username: '未知用户',
                        is_admin: false
                    };
                    
                    archiveHTML += `<li class="article-item">`;
                    archiveHTML += `<a href="article.html?id=${article.id}" class="article-link">${article.title}</a>`;
                    archiveHTML += `<div class="article-meta">`;
                    archiveHTML += `<div class="article-date">`;
                    archiveHTML += `<i class="far fa-calendar-alt"></i>`;
                    archiveHTML += `${day}日`;
                    archiveHTML += `</div>`;
                    archiveHTML += `<span class="article-category">${author.username}</span>`;
                    archiveHTML += `</div>`;
                    archiveHTML += `</li>`;
                });
                
                archiveHTML += `</ul>`;
                archiveHTML += `</div>`;
            });
            
            archiveHTML += `</div>`;
        });
        
        archiveContent.innerHTML = archiveHTML;
        loadingIndicator.style.display = 'none';
        archiveContent.style.display = 'block';
    } catch (error) {
        console.error('加载文章归档失败:', error);
        errorText.textContent = error.message || '无法加载文章归档，请稍后再试。';
        loadingIndicator.style.display = 'none';
        errorMessage.style.display = 'block';
    }
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
retryBtn.addEventListener('click', loadArchive);

// 页面加载时检查主题、认证状态和加载归档
document.addEventListener('DOMContentLoaded', async () => {
    checkTheme();
    await checkAuth();
    await loadArchive();
});