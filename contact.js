// 配置API基础URL - 使用您部署的URL
const API_BASE = 'https://saabor-blog-api.eoolife.workers.dev';

// DOM元素
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userMenu = document.getElementById('userMenu');
const userAvatar = document.getElementById('userAvatar');
const userDropdown = document.getElementById('userDropdown');
const contactForm = document.getElementById('contactForm');
const name = document.getElementById('name');
const email = document.getElementById('email');
const subject = document.getElementById('subject');
const message = document.getElementById('message');
const nameError = document.getElementById('nameError');
const emailError = document.getElementById('emailError');
const subjectError = document.getElementById('subjectError');
const messageError = document.getElementById('messageError');
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

// 显示错误消息
function showError(element, message) {
    element.textContent = message;
    element.classList.add('active');
}

// 隐藏错误消息
function hideError(element) {
    element.classList.remove('active');
}

// 处理联系表单提交
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 验证输入
    let isValid = true;
    
    if (!name.value.trim()) {
        showError(nameError, '请输入您的姓名');
        isValid = false;
    } else {
        hideError(nameError);
    }
    
    if (!email.value.trim()) {
        showError(emailError, '请输入您的邮箱');
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        showError(emailError, '请输入有效的邮箱地址');
        isValid = false;
    } else {
        hideError(emailError);
    }
    
    if (!subject.value.trim()) {
        showError(subjectError, '请输入消息主题');
        isValid = false;
    } else {
        hideError(subjectError);
    }
    
    if (!message.value.trim()) {
        showError(messageError, '请输入消息内容');
        isValid = false;
    } else {
        hideError(messageError);
    }
    
    if (!isValid) return;
    
    // 在实际应用中，这里会发送邮件或保存到数据库
    // 由于我们没有后端邮件服务，这里只是模拟
    alert('感谢您的消息！我们会在24小时内回复您。');
    contactForm.reset();
});

// 表单输入验证
name.addEventListener('input', () => {
    if (name.value.trim()) {
        hideError(nameError);
    }
});

email.addEventListener('input', () => {
    if (email.value.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        hideError(emailError);
    }
});

subject.addEventListener('input', () => {
    if (subject.value.trim()) {
        hideError(subjectError);
    }
});

message.addEventListener('input', () => {
    if (message.value.trim()) {
        hideError(messageError);
    }
});

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