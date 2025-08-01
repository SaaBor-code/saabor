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

// 创建缓存对象
const cache = {
    articles: new Map(),
    users: new Map(),
    comments: new Map(),
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
        this.comments.clear();
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
        
        // 检查缓存
        let articleData = cache.get(id, cache.articles);
        if (!articleData) {
            const response = await fetch(`${API_BASE}/api/articles/${id}`);
            if (!response.ok) {
                throw new Error('文章未找到');
            }
            
            articleData = await response.json();
            // 存储到缓存
            cache.set(id, articleData, cache.articles);
        }
        
        currentArticle = articleData;
        
        // 填充文章内容
        articleTitle.textContent = currentArticle.title;
        articleSubtitle.textContent = currentArticle.subtitle || '';
        articleSubtitle.style.display = currentArticle.subtitle ? 'block' : 'none';
        
        // 获取作者信息
        let authorData = cache.get(currentArticle.author_uid, cache.users);
        if (!authorData) {
            try {
                const authorResponse = await fetch(`${API_BASE}/api/users/${currentArticle.author_uid}`);
                if (authorResponse.ok) {
                    authorData = await authorResponse.json();
                    // 存储到缓存
                    cache.set(currentArticle.author_uid, authorData, cache.users);
                }
            } catch (authorError) {
                console.error('获取作者信息失败:', authorError);
            }
        }
        
        // 设置默认作者信息
        if (!authorData) {
            authorData = {
                username: '未知用户',
                avatar: 'https://avatars.githubusercontent.com/u/211512911?v=4',
                is_admin: false
            };
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
        
        // 处理内容 - 强制使用Markdown格式
        articleContent.innerHTML = marked.parse(currentArticle.content);
        
        // 应用代码高亮
        if (typeof hljs !== 'undefined') {
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }
        
        // 创建操作按钮
        articleActions.innerHTML = '';
        // 修复：使用正确的字段名 author_uid 而不是 author.id
        if (currentUser && (currentUser.is_admin || currentUser.uid === currentArticle.author_uid)) {
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
        
        // 加载评论
        loadComments();
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
        // 清除缓存
        cache.articles.delete(id);
        alert('文章删除成功！');
        window.location.href = 'index.html';
    })
    .catch(error => {
        console.error('删除文章失败:', error);
        alert(`删除失败: ${error.message}`);
    });
}

// 加载评论
async function loadComments() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (!id) return;
    
    try {
        // 检查缓存
        let commentsData = cache.get(id, cache.comments);
        if (!commentsData) {
            const response = await fetch(`${API_BASE}/api/articles/${id}/comments`);
            if (!response.ok) {
                throw new Error('加载评论失败');
            }
            
            commentsData = await response.json();
            // 存储到缓存
            cache.set(id, commentsData, cache.comments);
        }
        
        renderComments(commentsData);
    } catch (error) {
        console.error('加载评论失败:', error);
    }
}

// 渲染评论
function renderComments(comments) {
    const commentsSection = document.getElementById('commentsSection');
    const commentsList = document.getElementById('commentsList');
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p class="no-comments">暂无评论，快来抢沙发吧！</p>';
    } else {
        commentsList.innerHTML = comments.map(comment => `
            <div class="comment" data-id="${comment.id}">
                <div class="comment-header">
                    <img src="${comment.author.avatar}" alt="${comment.author.username}" class="comment-avatar">
                    <div class="comment-author">${comment.author.username}</div>
                    <div class="comment-date">${new Date(comment.created_at).toLocaleString()}</div>
                    ${currentUser && (currentUser.uid === comment.author.uid || currentUser.is_admin) ? 
                      `<button class="delete-comment-btn" data-id="${comment.id}"><i class="fas fa-trash"></i></button>` : ''}
                </div>
                <div class="comment-content">
                    ${marked.parse(comment.content)}
                </div>
            </div>
        `).join('');
        
        // 添加删除按钮事件监听器
        document.querySelectorAll('.delete-comment-btn').forEach(button => {
            button.addEventListener('click', function() {
                const commentId = this.getAttribute('data-id');
                deleteComment(commentId);
            });
        });
    }
    
    // 确保评论区域存在后再显示
    if (commentsSection) {
        commentsSection.style.display = 'block';
    }
}

// 提交评论
async function submitComment() {
    const commentContent = document.getElementById('commentContent');
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    
    if (!commentContent.value.trim()) {
        alert('评论内容不能为空');
        return;
    }
    
    if (!currentUser) {
        alert('请先登录后再发表评论');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const token = localStorage.getItem('blog_token');
        const response = await fetch(`${API_BASE}/api/articles/${articleId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                content: commentContent.value.trim()
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '发表评论失败');
        }
        
        // 清除评论缓存
        cache.comments.delete(articleId);
        
        // 清空评论框
        commentContent.value = '';
        
        // 重新加载评论
        loadComments();
    } catch (error) {
        console.error('发表评论失败:', error);
        alert(`发表评论失败: ${error.message}`);
    }
}

// 删除评论
async function deleteComment(commentId) {
    if (!confirm('确定要删除这条评论吗？')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('blog_token');
        const response = await fetch(`${API_BASE}/api/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '删除评论失败');
        }
        
        // 获取文章ID以清除相关缓存
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');
        
        // 清除评论缓存
        cache.comments.delete(articleId);
        
        // 重新加载评论
        loadComments();
    } catch (error) {
        console.error('删除评论失败:', error);
        alert(`删除评论失败: ${error.message}`);
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

// 提交评论按钮 - 修复事件监听器
document.addEventListener('DOMContentLoaded', () => {
    const submitCommentBtn = document.getElementById('submitComment');
    if (submitCommentBtn) {
        submitCommentBtn.addEventListener('click', submitComment);
    }
});

// 重试按钮
retryBtn.addEventListener('click', loadArticle);

// 页面加载时检查主题、认证状态和加载文章
document.addEventListener('DOMContentLoaded', async () => {
    checkTheme();
    await checkAuth();
    await loadArticle();
    
    // 添加个人资料链接事件监听器
    const profileLink = document.getElementById('profileLink');
    if (profileLink) {
        profileLink.addEventListener('click', () => {
            if (currentUser) {
                window.location.href = `profile.html?id=${currentUser.uid}`;
            } else {
                window.location.href = 'login.html';
            }
        });
    }
});