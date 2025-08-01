// 配置API基础URL - 使用您部署的URL
const API_BASE = 'https://saabor-blog-api.eoolife.workers.dev';

// DOM元素
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userMenu = document.getElementById('userMenu');
const userAvatar = document.getElementById('userAvatar');
const userDropdown = document.getElementById('userDropdown');
const themeToggle = document.getElementById('themeToggle');

// 存储当前用户信息
let currentUser = null;

// 创建缓存对象
const cache = {
    articles: new Map(),
    users: new Map(),
    // 缓存有效期5分钟
    ttl: 5 * 60 * 1000,
    
    set(key, data, map) {
        map.set(key, {
            data: data,
            timestamp: Date.now()
        });
    },
    
    get(key, map) {
        const cached = map.get(key);
        if (!cached) return null;
        
        // 检查是否过期
        if (Date.now() - cached.timestamp > this.ttl) {
            map.delete(key);
            return null;
        }
        
        return cached.data;
    },
    
    clear() {
        this.articles.clear();
        this.users.clear();
    }
};

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

// 页面加载时检查主题和认证状态
document.addEventListener('DOMContentLoaded', async () => {
    checkTheme();
    await checkAuth();
});

// 加载分类数据
async function loadCategories() {
    try {
        // 检查缓存
        let articles = cache.get('categories', cache.articles);
        if (!articles) {
            const response = await fetch(`${API_BASE}/api/articles`);
            if (!response.ok) {
                throw new Error('无法加载文章');
            }
            
            articles = await response.json();
            // 存储到缓存
            cache.set('categories', articles, cache.articles);
        }
        
        // 按分类组织文章（这里我们按标签模拟分类）
        const categories = {};
        
        articles.forEach(article => {
            // 如果文章有副标题作为标签/分类
            const category = article.subtitle || '未分类';
            
            if (!categories[category]) {
                categories[category] = [];
            }
            
            categories[category].push(article);
        });
        
        // 生成分类HTML
        const categoriesContainer = document.getElementById('categoriesContainer');
        let categoriesHTML = '';
        
        Object.keys(categories).forEach(category => {
            categoriesHTML += `<div class="category-section">`;
            categoriesHTML += `<h2 class="category-header">${category} <span class="article-count">(${categories[category].length})</span></h2>`;
            categoriesHTML += `<div class="articles-grid">`;
            
            categories[category].forEach(article => {
                // 获取作者信息
                let author = cache.get(article.author_uid, cache.users);
                if (!author) {
                    try {
                        const authorResponse = await fetch(`${API_BASE}/api/users/${article.author_uid}`);
                        if (authorResponse.ok) {
                            author = await authorResponse.json();
                            // 存储到缓存
                            cache.set(article.author_uid, author, cache.users);
                        }
                    } catch (authorError) {
                        console.error('获取作者信息失败:', authorError);
                    }
                }
                
                // 设置默认作者信息
                if (!author) {
                    author = {
                        username: '未知用户',
                        avatar: 'https://avatars.githubusercontent.com/u/211512911?v=4',
                        is_admin: false
                    };
                }
                
                categoriesHTML += `
                    <article class="article-card">
                        <div class="article-header">
                            <h3 class="article-title">${article.title}</h3>
                            <div class="article-meta">
                                <img src="${author.avatar}" alt="${author.username}" class="author-avatar">
                                <span>${author.username}</span>
                                ${author.is_admin ? '<span class="admin-badge">管理员</span>' : ''}
                            </div>
                        </div>
                        <div class="article-content">
                            <p>${article.content.substring(0, 100)}${article.content.length > 100 ? '...' : ''}</p>
                        </div>
                        <div class="article-actions">
                            <button class="btn btn-primary" onclick="window.location.href='article.html?id=${article.id}'">
                                <i class="fas fa-eye"></i> 阅读全文
                            </button>
                        </div>
                    </article>
                `;
            });
            
            categoriesHTML += `</div>`;
            categoriesHTML += `</div>`;
        });
        
        categoriesContainer.innerHTML = categoriesHTML;
    } catch (error) {
        console.error('加载分类失败:', error);
        const categoriesContainer = document.getElementById('categoriesContainer');
        categoriesContainer.innerHTML = `
            <div class="error-message">
                <h3>加载失败</h3>
                <p>无法加载分类数据，请稍后再试。</p>
                <button class="btn btn-primary" onclick="loadCategories()">
                    <i class="fas fa-redo"></i> 重新加载
                </button>
            </div>
        `;
    }
}
