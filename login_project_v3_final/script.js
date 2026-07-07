function switchTab(type) {
    const tabs = document.querySelectorAll('.tab-btn');
    const phoneGroup = document.getElementById('phoneGroup');
    const emailGroup = document.getElementById('emailGroup');

    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.toLowerCase().includes(type === 'email' ? 'email' : 'điện')) {
            tab.classList.add('active');
        }
    });

    if (type === 'email') {
        phoneGroup.style.display = 'none';
        emailGroup.style.display = 'block';
    } else {
        phoneGroup.style.display = 'block';
        emailGroup.style.display = 'none';
    }
}

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
}

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Đăng nhập thành công! (Demo)');
});