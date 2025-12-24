// Check if user is admin
const user = JSON.parse(localStorage.getItem("user"));

if (!user || !user.isAdmin) {
  alert("אין לך הרשאה לגשת לעמוד זה.");
  window.location.href = "login.html";
} else {
  // Set admin name
  document.getElementById('currentAdminName').textContent = `שלום, ${user.name || 'מנהל'}`;
}

// Dashboard stats
let statsData = { totalUsers: 0, newUsers: 0, adminUsers: 0, totalTransactions: 0 };

// Load users data
fetch("http://localhost:3000/admin/users-data")
  .then(res => res.json())
  .then(data => {
    const tbody = document.querySelector("#userTable tbody");
    tbody.innerHTML = "";

    if (data.length === 0) {
      tbody.innerHTML = "<tr><td colspan='6'>אין משתמשים להצגה</td></tr>";
      return;
    }

    // Update stats
    statsData.totalUsers = data.length;
    
    // Calculate new users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    statsData.newUsers = data.filter(user => new Date(user.createdAt) > thirtyDaysAgo).length;
    
    // Count admins
    statsData.adminUsers = data.filter(user => user.isAdmin).length;
    
    // Calculate total transactions
    statsData.totalTransactions = data.reduce((sum, user) => sum + user.totalTransactions, 0);
    
    // Update stats UI
    document.getElementById('totalUsers').textContent = statsData.totalUsers;
    document.getElementById('newUsers').textContent = statsData.newUsers;
    document.getElementById('adminUsers').textContent = statsData.adminUsers;
    document.getElementById('totalTransactions').textContent = statsData.totalTransactions;

    // Populate table
    data.forEach(user => {
      const tr = document.createElement("tr");
      
      const userStatus = user.isAdmin ? 
        `<span class="badge badge-warning">מנהל</span>` : 
        `<span class="badge badge-info">משתמש רגיל</span>`;
        
      tr.innerHTML = `
        <td class="user-name">${user.name}</td>
        <td class="user-email">${user.email}</td>
        <td>${userStatus}</td>
        <td>${user.totalTransactions}</td>
        <td>${new Date(user.createdAt).toLocaleDateString('he-IL')}</td>
        <td>
          <button class="make-admin-btn ${user.isAdmin ? 'disabled' : ''}" 
                  data-email="${user.email}" 
                  ${user.isAdmin ? 'disabled' : ''}>
            ${user.isAdmin ? 'כבר מנהל' : 'הפוך למנהל'}
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Add search functionality
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      const rows = document.querySelectorAll('#userTable tbody tr');
      
      rows.forEach(row => {
        const name = row.querySelector('.user-name')?.textContent.toLowerCase() || '';
        const email = row.querySelector('.user-email')?.textContent.toLowerCase() || '';
        
        if (name.includes(searchTerm) || email.includes(searchTerm)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });

    // Admin button functionality
    document.querySelectorAll(".make-admin-btn").forEach(btn => {
      if (btn.classList.contains('disabled')) return;
      
      btn.addEventListener("click", async () => {
        const email = btn.dataset.email;
        const confirmAction = confirm(`אתה בטוח שברצונך להפוך את ${email} למנהל?`);
        if (!confirmAction) return;

        // Show loading state
        const originalText = btn.textContent;
        btn.textContent = 'מעדכן...';
        btn.disabled = true;

        try {
          const res = await fetch("http://localhost:3000/admin/make-admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
          });

          const result = await res.json();
          if (res.ok) {
            alert(result.message);
            location.reload();
          } else {
            alert("שגיאה: " + result.message);
            btn.textContent = originalText;
            btn.disabled = false;
          }
        } catch (err) {
          console.error("שגיאה בעדכון:", err);
          alert("שגיאה במהלך הפיכת המשתמש למנהל");
          btn.textContent = originalText;
          btn.disabled = false;
        }
      });
    });
  })
  .catch(err => {
    console.error("שגיאה בטעינת המשתמשים", err);
    const tbody = document.querySelector("#userTable tbody");
    tbody.innerHTML = `<tr><td colspan="6">שגיאה בטעינת הנתונים. אנא נסה שנית.</td></tr>`;
  });

// Pagination functionality (for demonstration)
document.querySelectorAll('.page-link').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.page-link').forEach(l => l.classList.remove('active'));
    this.classList.add('active');
  });
});