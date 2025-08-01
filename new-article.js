        // 配置API基础URL - 使用您部署的URL
        const API_BASE = 'https://saabor-blog-api.eoolife.workers.dev';
        
        // DOM元素
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userMenu = document.getElementById('userMenu');
        const userAvatar = document.getElementById('userAvatar');
        const userDropdown = document.getElementById('userDropdown');
        const articleForm = document.getElementById('articleForm');
        const title = document.getElementById('title');
        const subtitle = document.getElementById('subtitle');
        const content = document.getElementById('content');
        const useMarkdown = document.getElementById('useMarkdown');
        const previewContent = document.getElementById('previewContent');
        const titleError = document.getElementById('titleError');
        const contentError = document.getElementById('contentError');
        const cancelBtn = document.getElementById('cancelBtn');
        const submitBtn = document.getElementById('submitBtn');
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
            
            // 重新应用代码高亮
            if (typeof hljs !== 'undefined') {
                document.querySelectorAll('#previewContent pre code').forEach((block) => {
                    hljs.highlightElement(block);
                });
            }
        }
        
        // 检查用户是否已登录
        async function checkAuth() {
            const token = localStorage.getItem('blog_token');
            if (!token) {
                // 未登录，重定向到登录页面
                window.location.href = 'login.html';
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
                window.location.href = 'login.html';
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
                window.location.href = 'login.html';
            }
        }
        
        // 更新预览
        function updatePreview() {
            const contentValue = content.value;
            
            if (useMarkdown.checked) {
                // 使用Markdown解析
                previewContent.innerHTML = marked.parse(contentValue);
            } else {
                // 普通文本
                previewContent.innerHTML = `<p>${contentValue.replace(/\n/g, '</p><p>')}</p>`;
            }
            
            // 应用代码高亮
            if (typeof hljs !== 'undefined') {
                document.querySelectorAll('#previewContent pre code').forEach((block) => {
                    hljs.highlightElement(block);
                });
            }
        }
        
        // 添加Markdown格式
        function addMarkdownFormat(format) {
            const startPos = content.selectionStart;
            const endPos = content.selectionEnd;
            const text = content.value;
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
            
            content.value = text.substring(0, startPos) + formattedText + text.substring(endPos);
            content.focus();
            content.setSelectionRange(startPos + formattedText.length, startPos + formattedText.length);
            updatePreview();
        }
        
        // 处理表单提交
        async function submitArticle() {
            // 验证输入
            let isValid = true;
            
            if (!title.value.trim()) {
                showError(titleError, '标题不能为空');
                isValid = false;
            } else {
                hideError(titleError);
            }
            
            if (!content.value.trim()) {
                showError(contentError, '内容不能为空');
                isValid = false;
            } else {
                hideError(contentError);
            }
            
            if (!isValid) return;
            
            try {
                const token = localStorage.getItem('blog_token');
                const response = await fetch(`${API_BASE}/api/articles`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: title.value.trim(),
                        subtitle: subtitle.value.trim(),
                        content: content.value,
                        // 强制使用Markdown格式
                        markdown: true
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || '发布文章失败');
                }
                
                const article = await response.json();
                window.location.href = `article.html?id=${article.id}`;
            } catch (error) {
                alert(`发布失败: ${error.message}`);
                console.error('发布文章失败:', error);
            }
        }
        
        // 显示错误消息
        function showError(element, message) {
            element.textContent = message;
            element.classList.add('active');
        }
        
        // 隐藏错误消息
        function hideError(element) {
            element.classList.remove('active');
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
        
        // 输入事件
        title.addEventListener('input', () => {
            if (title.value.trim()) {
                hideError(titleError);
            }
        });
        
        content.addEventListener('input', () => {
            if (content.value.trim()) {
                hideError(contentError);
            }
            updatePreview();
        });
        
        useMarkdown.addEventListener('change', updatePreview);
        
        // 工具栏按钮
        document.querySelectorAll('.toolbar-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                addMarkdownFormat(button.dataset.format);
            });
        });
        
        // 取消按钮
        cancelBtn.addEventListener('click', () => {
            if (confirm('确定要放弃编辑吗？所有更改将丢失。')) {
                window.location.href = 'index.html';
            }
        });
        
        // 提交按钮
        submitBtn.addEventListener('click', submitArticle);
        
        // 表单提交（回车）
        articleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitArticle();
        });
        
        // 页面加载时检查主题和认证状态
        document.addEventListener('DOMContentLoaded', async () => {
            checkTheme();
            await checkAuth();
            updatePreview();
        });