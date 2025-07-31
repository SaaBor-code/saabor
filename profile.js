        // 配置API基础URL - 使用您部署的URL
        const API_BASE = 'https://saabor-blog-api.eoolife.workers.dev';
        
        // DOM元素
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userMenu = document.getElementById('userMenu');
        const userAvatar = document.getElementById('userAvatar');
        const userDropdown = document.getElementById('userDropdown');
        const sidebarLoading = document.getElementById('sidebarLoading');
        const mainLoading = document.getElementById('mainLoading');
        const profileSidebarContent = document.getElementById('profileSidebarContent');
        const profileMainContent = document.getElementById('profileMainContent');
        const errorMessage = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        const retryBtn = document.getElementById('retryBtn');
        const themeToggle = document.getElementById('themeToggle');
        
        // 用户信息元素
        const sidebarAvatar = document.getElementById('sidebarAvatar');
        const sidebarUsername = document.getElementById('sidebarUsername');
        const sidebarAdminBadge = document.getElementById('sidebarAdminBadge');
        const articleCount = document.getElementById('articleCount');
        const followerCount = document.getElementById('followerCount');
        const profileActions = document.getElementById('profileActions');
        const bioContent = document.getElementById('bioContent');
        const bioEditor = document.getElementById('bioEditor');
        const bioTextarea = document.getElementById('bioTextarea');
        const saveBioBtn = document.getElementById('saveBioBtn');
        const registeredAt = document.getElementById('registeredAt');
        const userId = document.getElementById('userId');
        const userArticles = document.getElementById('userArticles');
        
        // 存储当前用户信息
        let currentUser = null;
        let profileUser = null;
        
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
                document.querySelectorAll('#bioContent pre code').forEach((block) => {
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
        
        // 加载用户信息
        async function loadUserProfile() {
            // 显示加载指示器
            sidebarLoading.style.display = 'block';
            mainLoading.style.display = 'block';
            profileSidebarContent.style.display = 'none';
            profileMainContent.style.display = 'none';
            errorMessage.style.display = 'none';
            
            try {
                // 从URL获取用户ID
                const urlParams = new URLSearchParams(window.location.search);
                const uid = urlParams.get('uid') || '1'; // 默认加载第一个用户
                
                // 获取用户信息
                const userResponse = await fetch(`${API_BASE}/api/users/${uid}`);
                if (!userResponse.ok) {
                    throw new Error('用户不存在或加载失败');
                }
                
                profileUser = await userResponse.json();
                
                // 加载用户文章
                const articlesResponse = await fetch(`${API_BASE}/api/articles`);
                const allArticles = articlesResponse.ok ? await articlesResponse.json() : [];
                const userArticlesList = allArticles.filter(article => article.author_uid === uid);
                
                // 更新页面内容
                sidebarAvatar.src = profileUser.avatar;
                sidebarUsername.textContent = profileUser.username;
                articleCount.textContent = userArticlesList.length;
                followerCount.textContent = '0'; // 暂时没有粉丝功能
                
                if (profileUser.is_admin) {
                    sidebarAdminBadge.style.display = 'inline';
                } else {
                    sidebarAdminBadge.style.display = 'none';
                }
                
                // 设置注册时间
                registeredAt.textContent = new Date(profileUser.created_at).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                userId.textContent = profileUser.uid;
                
                // 更新个人简介
                if (profileUser.bio) {
                    bioContent.innerHTML = marked.parse(profileUser.bio);
                } else {
                    bioContent.innerHTML = '<p>该用户还没有设置个人简介。</p>';
                }
                
                // 添加操作按钮（如果当前用户有权限）
                profileActions.innerHTML = '';
                
                if (currentUser && (currentUser.uid === profileUser.uid || currentUser.is_admin)) {
                    const editBioBtn = document.createElement('button');
                    editBioBtn.className = 'btn btn-secondary';
                    editBioBtn.innerHTML = '<i class="fas fa-edit"></i> 编辑简介';
                    editBioBtn.addEventListener('click', showBioEditor);
                    
                    profileActions.appendChild(editBioBtn);
                }
                
                // 显示用户文章
                userArticles.innerHTML = '';
                
                if (userArticlesList.length === 0) {
                    userArticles.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: var(--secondary);">
                            <p>该用户还没有发布任何文章。</p>
                        </div>
                    `;
                } else {
                    // 只显示最新的5篇文章
                    const latestArticles = userArticlesList.slice(0, 5);
                    
                    for (const article of latestArticles) {
                        const articleCard = document.createElement('div');
                        articleCard.className = 'user-article-card';
                        
                        articleCard.innerHTML = `
                            <div class="user-article-header">
                                <h3 class="user-article-title"><a href="article.html?id=${article.id}" style="color: inherit; text-decoration: none;">${article.title}</a></h3>
                                <p class="user-article-subtitle">${article.subtitle || ''}</p>
                                <div class="user-article-meta">
                                    <div class="user-article-date">
                                        <i class="far fa-calendar-alt"></i>
                                        ${new Date(article.created_at).toLocaleDateString('zh-CN', { 
                                            year: 'numeric', 
                                            month: 'numeric', 
                                            day: 'numeric' 
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div class="user-article-actions">
                                <a href="article.html?id=${article.id}" class="btn btn-secondary" style="width: 100%;">
                                    <i class="fas fa-eye"></i> 查看文章
                                </a>
                            </div>
                        `;
                        
                        userArticles.appendChild(articleCard);
                    }
                }
                
                // 初始化代码高亮
                if (typeof hljs !== 'undefined') {
                    document.querySelectorAll('#bioContent pre code').forEach((block) => {
                        hljs.highlightElement(block);
                    });
                }
                
                // 显示内容
                sidebarLoading.style.display = 'none';
                mainLoading.style.display = 'none';
                profileSidebarContent.style.display = 'block';
                profileMainContent.style.display = 'block';
            } catch (error) {
                console.error('加载用户信息失败:', error);
                errorText.textContent = error.message || '无法加载用户信息，请稍后再试。';
                sidebarLoading.style.display = 'none';
                mainLoading.style.display = 'none';
                errorMessage.style.display = 'block';
            }
        }
        
        // 显示个人简介编辑器
        function showBioEditor() {
            bioContent.style.display = 'none';
            bioEditor.style.display = 'block';
            bioTextarea.value = profileUser.bio || '';
        }
        
        // 隐藏个人简介编辑器
        function hideBioEditor() {
            bioContent.style.display = 'block';
            bioEditor.style.display = 'none';
        }
        
        // 添加Markdown格式
        function addMarkdownFormat(format) {
            const startPos = bioTextarea.selectionStart;
            const endPos = bioTextarea.selectionEnd;
            const text = bioTextarea.value;
            let formattedText = '';
            
            switch (format) {
                case 'bold':
                    formattedText = `**${text.substring(startPos, endPos) || '加粗文本'}**`;
                    break;
                case 'italic':
                    formattedText = `*${text.substring(startPos, endPos) || '斜体文本'}*`;
                    break;
                case 'heading':
                    formattedText = `# ${text.substring(startPos, endPos) || '标题'}`;
                    break;
                case 'link':
                    formattedText = `[${text.substring(startPos, endPos) || '链接文本'}](https://example.com)`;
                    break;
                case 'image':
                    formattedText = `![替代文本](https://example.com/image.jpg)`;
                    break;
                case 'list':
                    formattedText = `- ${text.substring(startPos, endPos) || '列表项'}`;
                    break;
                case 'code':
                    formattedText = '```\n' + (text.substring(startPos, endPos) || '代码') + '\n```';
                    break;
                case 'blockquote':
                    formattedText = `> ${text.substring(startPos, endPos) || '引用文本'}`;
                    break;
                default:
                    formattedText = text.substring(startPos, endPos);
            }
            
            bioTextarea.value = text.substring(0, startPos) + formattedText + text.substring(endPos);
            bioTextarea.focus();
            bioTextarea.setSelectionRange(startPos + formattedText.length, startPos + formattedText.length);
        }
        
        // 保存个人简介
        async function saveBio() {
            const bio = bioTextarea.value;
            
            try {
                const token = localStorage.getItem('blog_token');
                const response = await fetch(`${API_BASE}/api/user`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ bio })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || '更新个人简介失败');
                }
                
                const updatedUser = await response.json();
                profileUser.bio = updatedUser.bio;
                
                // 更新显示
                bioContent.innerHTML = marked.parse(profileUser.bio);
                
                if (typeof hljs !== 'undefined') {
                    document.querySelectorAll('#bioContent pre code').forEach((block) => {
                        hljs.highlightElement(block);
                    });
                }
                
                hideBioEditor();
                alert('个人简介更新成功！');
            } catch (error) {
                console.error('更新个人简介失败:', error);
                alert(`更新失败: ${error.message}`);
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
        
        // 保存个人简介按钮
        saveBioBtn.addEventListener('click', saveBio);
        
        // 工具栏按钮
        document.querySelectorAll('.toolbar-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                addMarkdownFormat(button.dataset.format);
            });
        });
        
        // 重试按钮
        retryBtn.addEventListener('click', loadUserProfile);
        
        // 页面加载时检查主题、认证状态和加载用户信息
        document.addEventListener('DOMContentLoaded', async () => {
            checkTheme();
            await checkAuth();
            await loadUserProfile();
        });