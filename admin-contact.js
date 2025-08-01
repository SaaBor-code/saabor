const API_BASE = '';
let currentUser = null;

// DOM元素
const loadingIndicator = document.getElementById('loadingIndicator');
const messagesContainer = document.getElementById('messagesContainer');
const messagesList = document.getElementById('messagesList');
const messageDetail = document.getElementById('messageDetail');
const messageContent = document.getElementById('messageContent');
const messageStatus = document.getElementById('messageStatus');
const backToList = document.getElementById('backToList');
const markAsRead = document.getElementById('markAsRead');
const markAsReplied = document.getElementById('markAsReplied');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const userMenu = document.getElementById('userMenu');
const userAvatar = document.getElementById('userAvatar');
const userDropdown = document.getElementById('userDropdown');
const logoutBtn = document.getElementById('logoutBtn');
const themeToggle = document.getElementById('themeToggle');

// 检查用户认证状态
async function checkAuth() {
    const token = localStorage.getItem('blog_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            localStorage.removeItem('blog_token');
            window.location.href = 'login.html';
            return;
        }
        
        const userData = await response.json();
        currentUser = userData;
        
        // 检查是否为管理员
        if (!userData.is_admin) {
            window.location.href = 'index.html';
            return;
        }
        
        updateAuthUI();
        loadMessages();
    } catch (error) {
        console.error('检查认证状态失败:', error);
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
        loginBtn.style.display = 'inline-flex';
        registerBtn.style.display = 'inline-flex';
        userMenu.style.display = 'none';
    }
}

// 加载消息列表
async function loadMessages() {
    try {
        loadingIndicator.style.display = 'flex';
        messagesContainer.style.display = 'none';
        messageDetail.style.display = 'none';
        
        const token = localStorage.getItem('blog_token');
        const response = await fetch(`${API_BASE}/api/contact/messages`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('加载消息失败');
        }
        
        const messages = await response.json();
        renderMessages(messages);
        
        loadingIndicator.style.display = 'none';
        messagesContainer.style.display = 'block';
    } catch (error) {
        console.error('加载消息失败:', error);
        loadingIndicator.style.display = 'none';
        alert('加载消息失败，请稍后再试');
    }
}

// 渲染消息列表
function renderMessages(messages) {
    if (messages.length === 0) {
        messagesList.innerHTML = '<p class="no-messages">暂无消息</p>';
        return;
    }
    
    messagesList.innerHTML = messages.map(message => `
        <div class="message-item ${message.status}" data-id="${message.id}">
            <div class="message-summary">
                <div class="message-subject">${message.subject}</div>
                <div class="message-meta">
                    <span class="message-name">${message.name}</span>
                    <span class="message-email">${message.email}</span>
                    <span class="message-date">${formatDate(message.created_at)}</span>
                </div>
            </div>
            <div class="message-status-badge ${message.status}">
                ${getStatusText(message.status)}
            </div>
        </div>
    `).join('');
    
    // 添加点击事件
    document.querySelectorAll('.message-item').forEach(item => {
        item.addEventListener('click', () => {
            const messageId = item.dataset.id;
            show_message_detail(messageId);
        });
    });
}

// 显示消息详情
async function show_message_detail(messageId) {
    try {
        const token = localStorage.getItem('blog_token');
        const response = await fetch(`${API_BASE}/api/contact/messages`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('加载消息详情失败');
        }
        
        const messages = await response.json();
        const message = messages.find(m => m.id === messageId);
        
        if (!message) {
            throw new Error('消息不存在');
        }
        
        messageContent.innerHTML = `
            <h2>${message.subject}</h2>
            <div class="message-info">
                <div class="info-item">
                    <label>发件人:</label>
                    <span>${message.name} &lt;${message.email}&gt;</span>
                </div>
                <div class="info-item">
                    <label>时间:</label>
                    <span>${formatDate(message.created_at)}</span>
                </div>
            </div>
            <div class="message-body">
                <p>${message.message.replace(/\n/g, '<br>')}</p>
            </div>
        `;
        
        // 更新状态显示
        messageStatus.className = `message-status ${message.status}`;
        messageStatus.textContent = getStatusText(message.status);
        
        // 设置状态按钮
        markAsRead.style.display = message.status === 'unread' ? 'inline-block' : 'none';
        markAsReplied.style.display = message.status !== 'replied' ? 'inline-block' : 'none';
        markAsRead.onclick = () => updateMessageStatus(messageId, 'read');
        markAsReplied.onclick = () => updateMessageStatus(messageId, 'replied');
        
        messagesContainer.style.display = 'none';
        messageDetail.style.display = 'block';
    } catch (error) {
        console.error('显示消息详情失败:', error);
        alert('加载消息详情失败，请稍后再试');
    }
}

// 更新消息状态
async function updateMessageStatus(messageId, status) {
    try {
        const token = localStorage.getItem('blog_token');
        const response = await fetch(`${API_BASE}/api/contact/messages/${messageId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            throw new Error('更新状态失败');
        }
        
        // 重新加载消息列表
        loadMessages();
        messageDetail.style.display = 'none';
        messagesContainer.style.display = 'block';
    } catch (error) {
        console.error('更新消息状态失败:', error);
        alert('更新状态失败，请稍后再试');
    }
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
}

// 获取状态文本
function getStatusText(status) {
    switch (status) {
        case 'unread':
            return '未读';
        case 'read':
            return '已读';
        case 'replied':
            return '已回复';
        default:
            return '未知';
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
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// 返回列表
backToList.addEventListener('click', () => {
    messageDetail.style.display = 'none';
    messagesContainer.style.display = 'block';
});

// 页面加载时检查主题和认证状态
document.addEventListener('DOMContentLoaded', async () => {
    // 检查主题
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    await checkAuth();
});