// 配置API基础URL - 使用您部署的URL
        const API_BASE = 'https://saabor-blog-api.eoolife.workers.dev';
        
        // DOM元素
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const newArticleBtn = document.getElementById('newArticleBtn');
        const userMenu = document.getElementById('userMenu');
        const userAvatar = document.getElementById('userAvatar');
        const userDropdown = document.getElementById('userDropdown');
        const articlesContainer = document.getElementById('articlesContainer');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const apiStatus = document.getElementById('apiStatus');
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
        
        // 检查API是否可用
        async function checkApiStatus() {
            try {
                const response = await fetch(`${API_BASE}/api/articles`);
                if (response.ok) {
                    apiStatus.textContent = 'API状态: 正常';
                    apiStatus.style.color = '#28a745';
                    return true;
                } else {
                    throw new Error('API返回错误状态');
                }
            } catch (error) {
                apiStatus.textContent = 'API状态: 不可用';
                apiStatus.style.color = '#dc3545';
                console.error('API检查失败:', error);
                return false;
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
                newArticleBtn.style.display = currentUser ? 'inline-flex' : 'none';
            } else {
                loginBtn.style.display = 'inline-flex';
                registerBtn.style.display = 'inline-flex';
                userMenu.style.display = 'none';
                newArticleBtn.style.display = 'none';
            }
        }
        
        // 加载文章
        async function loadArticles() {
            // 显示加载指示器
            loadingIndicator.style.display = 'flex';
            articlesContainer.innerHTML = '';
            articlesContainer.appendChild(loadingIndicator);
            
            try {
                // 检查缓存
                let articles = cache.get('articles', cache.articles);
                if (!articles) {
                    const response = await fetch(`${API_BASE}/api/articles`);
                    if (!response.ok) {
                        throw new Error('加载文章失败');
                    }
                    
                    articles = await response.json();
                    // 存储到缓存
                    cache.set('articles', articles, cache.articles);
                }
                
                // 清空容器
                articlesContainer.innerHTML = '';
                
                if (articles.length === 0) {
                    const emptyState = document.createElement('div');
                    emptyState.className = 'empty-state';
                    emptyState.innerHTML = `
                        <img src="https://cdn-icons-png.flaticon.com/512/2744/2744098.png" alt="无文章">
                        <h3>还没有文章</h3>
                        <p>当您或他人发布文章后，它们会显示在这里。</p>
                        ${currentUser ? 
                            '<button class="btn btn-primary" id="firstArticleBtn">发布第一篇文章</button>' : 
                            '<p>请登录后发布您的第一篇文章</p>'
                        }
                    `;
                    articlesContainer.appendChild(emptyState);
                    
                    if (currentUser) {
                        document.getElementById('firstArticleBtn').addEventListener('click', () => {
                            window.location.href = 'new-article.html';
                        });
                    }
                    
                    return;
                }
                
                // 创建文章卡片
                for (const article of articles) {
                    try {
                        // 检查缓存中的作者信息
                        let author = cache.get(`user_${article.author_uid}`, cache.users);
                        if (!author) {
                            // 获取作者信息
                            const authorResponse = await fetch(`${API_BASE}/api/users/${article.author_uid}`);
                            author = authorResponse.ok ? await authorResponse.json() : {
                                username: '未知用户',
                                avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Unknown',
                                is_admin: false
                            };
                            // 存储到缓存
                            cache.set(`user_${article.author_uid}`, author, cache.users);
                        }
                        
                        const articleCard = document.createElement('div');
                        articleCard.className = 'article-card';
                        
                        // 检查当前用户是否有权限编辑此文章
                        let actionsHTML = '';
                        if (currentUser && (currentUser.uid === article.author_uid || currentUser.is_admin)) {
                            actionsHTML = `
                                <div class="article-actions">
                                    <a href="edit-article.html?id=${article.id}" class="btn btn-secondary">编辑</a>
                                    <button class="btn btn-danger delete-article" data-id="${article.id}">删除</button>
                                </div>
                            `;
                        }
                        
                        articleCard.innerHTML = `
                            <div class="article-header">
                                <h2 class="article-title"><a href="article.html?id=${article.id}" style="color: inherit; text-decoration: none;">${article.title}</a></h2>
                                <p class="article-subtitle">${article.subtitle || ''}</p>
                                <div class="article-meta">
                                    <img src="${author.avatar}" alt="${author.username}" class="author-avatar">
                                    <span>${author.username} 
                                        ${author.is_admin ? '<span class="admin-badge">管理员</span>' : ''}
                                        • ${new Date(article.created_at).toLocaleDateString('zh-CN', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}</span>
                                </div>
                            </div>
                            <div class="article-content">
                                <p>${article.content.substring(0, 200)}${article.content.length > 200 ? '...' : ''}</p>
                            </div>
                            ${actionsHTML}
                        `;
                        
                        articlesContainer.appendChild(articleCard);
                        
                        // 添加删除事件监听器
                        if (currentUser && (currentUser.uid === article.author_uid || currentUser.is_admin)) {
                            articleCard.querySelector('.delete-article').addEventListener('click', () => deleteArticle(article.id));
                        }
                    } catch (error) {
                        console.error(`加载文章 ${article.id} 的作者信息失败:`, error);
                    }
                }
            } catch (error) {
                console.error('加载文章失败:', error);
                articlesContainer.innerHTML = `
                    <div class="empty-state">
                        <img src="https://cdn-icons-png.flaticon.com/512/2744/2744098.png" alt="错误">
                        <h3>加载文章失败</h3>
                        <p>${error.message || '无法加载文章，请稍后再试。'}</p>
                        <button class="btn btn-primary" id="retryBtn">重试</button>
                    </div>
                `;
                document.getElementById('retryBtn').addEventListener('click', loadArticles);
            } finally {
                loadingIndicator.style.display = 'none';
            }
        }
        
        // 删除文章
        function deleteArticle(id) {
            if (!confirm('确定要删除这篇文章吗？此操作不可撤销！')) return;
            
            const token = localStorage.getItem('blog_token');
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
                // 清除缓存
                cache.clear();
                loadArticles();
                alert('文章删除成功！');
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
        
        newArticleBtn.addEventListener('click', () => {
            window.location.href = 'new-article.html';
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
        
        // 页面加载时检查主题、认证状态和API状态
        document.addEventListener('DOMContentLoaded', async () => {
            checkTheme();
            await checkApiStatus();
            await checkAuth();
            await loadArticles();
        });