// 配置API基础URL - 使用您部署的URL
const API_BASE = 'https://saabor-blog-api.eoolife.workers.dev';

// DOM元素
const loginForm = document.getElementById('loginForm');
const username = document.getElementById('username');
const password = document.getElementById('password');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');
const themeToggle = document.getElementById('themeToggle');

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

// 显示错误消息
function showError(element, message) {
    element.textContent = message;
    element.classList.add('active');
}

// 隐藏错误消息
function hideError(element) {
    element.classList.remove('active');
}

// 处理登录
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 验证输入
    let isValid = true;
    
    if (!username.value.trim()) {
        showError(usernameError, '用户名不能为空');
        isValid = false;
    } else {
        hideError(usernameError);
    }
    
    if (!password.value) {
        showError(passwordError, '密码不能为空');
        isValid = false;
    } else if (password.value.length < 8) {
        showError(passwordError, '密码至少需要8个字符');
        isValid = false;
    } else {
        hideError(passwordError);
    }
    
    if (!isValid) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                username: username.value.trim(), 
                password: password.value 
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '登录失败，请检查用户名和密码');
        }
        
        const data = await response.json();
        localStorage.setItem('blog_token', data.token);
        window.location.href = 'index.html';
    } catch (error) {
        alert(`登录失败: ${error.message}`);
        console.error('登录错误:', error);
    }
});

// 表单输入验证
username.addEventListener('input', () => {
    if (username.value.trim()) {
        hideError(usernameError);
    }
});

password.addEventListener('input', () => {
    if (password.value) {
        hideError(passwordError);
    }
});

// 页面加载时检查主题
document.addEventListener('DOMContentLoaded', () => {
    checkTheme();
});

// 切换主题
themeToggle.addEventListener('click', toggleTheme);