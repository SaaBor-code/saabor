// 配置API基础URL - 使用您部署的URL
const API_BASE = 'https://saabor-blog-api.eoolife.workers.dev';

// DOM元素
const registerForm = document.getElementById('registerForm');
const username = document.getElementById('username');
const password = document.getElementById('password');
const avatar = document.getElementById('avatar');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');
const avatarError = document.getElementById('avatarError');
const passwordStrengthText = document.getElementById('passwordStrengthText');
const passwordStrengthFill = document.getElementById('passwordStrengthFill');
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

// 检查密码强度
function checkPasswordStrength(pwd) {
    let strength = 0;
    let strengthText = '太弱';
    let strengthColor = '#dc3545'; // 红色
    
    // 检查长度
    if (pwd.length >= 8) strength += 1;
    if (pwd.length >= 12) strength += 1;
    
    // 检查是否包含小写字母
    if (/[a-z]/.test(pwd)) strength += 1;
    
    // 检查是否包含大写字母
    if (/[A-Z]/.test(pwd)) strength += 1;
    
    // 检查是否包含数字
    if (/[0-9]/.test(pwd)) strength += 1;
    
    // 检查是否包含特殊字符
    if (/[^a-zA-Z0-9]/.test(pwd)) strength += 1;
    
    // 设置显示
    const width = (strength / 6) * 100;
    passwordStrengthFill.style.width = `${width}%`;
    
    if (strength < 2) {
        strengthText = '太弱';
        strengthColor = '#dc3545'; // 红色
    } else if (strength < 4) {
        strengthText = '中等';
        strengthColor = '#ffc107'; // 黄色
    } else if (strength < 5) {
        strengthText = '较强';
        strengthColor = '#17a2b8'; // 蓝色
    } else {
        strengthText = '很强';
        strengthColor = '#28a745'; // 绿色
    }
    
    passwordStrengthText.textContent = strengthText;
    passwordStrengthFill.style.backgroundColor = strengthColor;
}

// 处理注册
registerForm.addEventListener('submit', async (e) => {
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
    
    if (avatar.value && !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(avatar.value)) {
        showError(avatarError, '请输入有效的URL');
        isValid = false;
    } else {
        hideError(avatarError);
    }
    
    if (!isValid) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                username: username.value.trim(), 
                password: password.value,
                avatar: avatar.value.trim() || ''
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '注册失败');
        }
        
        const user = await response.json();
        localStorage.setItem('blog_token', user.token);
        window.location.href = 'index.html';
    } catch (error) {
        alert(`注册失败: ${error.message}`);
        console.error('注册错误:', error);
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
    checkPasswordStrength(password.value);
});

avatar.addEventListener('input', () => {
    if (!avatar.value.trim() || /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(avatar.value)) {
        hideError(avatarError);
    }
});

// 页面加载时检查主题
document.addEventListener('DOMContentLoaded', () => {
    checkTheme();
});

// 切换主题
themeToggle.addEventListener('click', toggleTheme);