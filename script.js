let globalAchievements = []; // Store data globally to filter without re-fetching

// 1. MAIN PORTAL (INDEX.HTML) LOGIC

if(document.getElementById("tablebody")) {

    // Fetch once on load
    fetch("http://localhost:5000/achievements")
    .then(res => res.json())
    .then(data => {
        // Filter out pending items for public view
        globalAchievements = data.filter(item => item.status === "Approved" || !item.status);
        
        populateYearDropdown();
        applyFilters(); // Renders table, stats, and charts
    });

    // Event Listeners for Dropdowns
    document.getElementById("filterYear").addEventListener("change", applyFilters);
    document.getElementById("filterCategory").addEventListener("change", applyFilters);
}

function populateYearDropdown() {
    let yearSelect = document.getElementById("filterYear");
    // Extract unique years from data (Fallback to 2024 if null)
    let years = [...new Set(globalAchievements.map(item => item.year || "2024"))].sort((a, b) => b - a);
    
    years.forEach(year => {
        let option = document.createElement("option");
        option.value = year;
        option.text = year;
        yearSelect.appendChild(option);
    });
}

function applyFilters() {
    let selectedYear = document.getElementById("filterYear").value;
    let selectedCat = document.getElementById("filterCategory").value;

    // Filter Data
    let filteredData = globalAchievements.filter(item => {
        let itemYear = String(item.year || "2024");
        let matchesYear = (selectedYear === "All") || (itemYear === selectedYear);
        let matchesCat = (selectedCat === "All") || (item.category === selectedCat);
        return matchesYear && matchesCat;
    });

    renderTable(filteredData);
    renderStats(filteredData);
    renderYearlyPieChart(filteredData, selectedYear);
    renderOverallProgressChart(); // Overall progress always uses all data
}

function renderTable(data) {
    let table = document.getElementById("tablebody");
    table.innerHTML = "";
    
    data.forEach(item => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.id}</td>
            <td><strong>${item.year || "2024"}</strong></td>
            <td>${item.student_name}</td>
            <td>${item.title}</td>
            <td><span class="badge bg-primary" style="padding:4px 8px; border-radius:4px; color:white; background:#003366;">${item.category}</span></td>
            <td>${item.description}</td>
            <td>${item.file_path ? `<a href="http://localhost:5000/${item.file_path}" target="_blank">View</a>` : "No File"}</td>
        `;
        table.appendChild(row);
    });
}

function renderStats(data) {
    let academic = 0, sports = 0, cultural = 0;
    data.forEach(item => {
        if(item.category === "Academic") academic++;
        if(item.category === "Sports") sports++;
        if(item.category === "Cultural") cultural++;
    });

    document.getElementById("totalCount").innerText = data.length;
    document.getElementById("academicCount").innerText = academic;
    document.getElementById("sportsCount").innerText = sports;
    document.getElementById("culturalCount").innerText = cultural;
}

// Chart Variables
let pieChartInstance = null;
let progressChartInstance = null;

function renderYearlyPieChart(filteredData, selectedYear) {
    const ctx = document.getElementById('yearlyPieChart').getContext('2d');
    if (pieChartInstance) pieChartInstance.destroy();

    // Change title based on filter
    document.getElementById("pieChartTitle").innerText = selectedYear === "All" ? "Overall Category Distribution" : `Distribution for ${selectedYear}`;

    let academic = 0, sports = 0, cultural = 0;
    filteredData.forEach(item => {
        if(item.category === "Academic") academic++;
        if(item.category === "Sports") sports++;
        if(item.category === "Cultural") cultural++;
    });

    pieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Academic', 'Sports', 'Cultural'],
            datasets: [{
                data: [academic, sports, cultural],
                backgroundColor: ['#0d6efd', '#28a745', '#ffc107']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
}

function renderOverallProgressChart() {
    const ctx = document.getElementById('progressChart').getContext('2d');
    if (progressChartInstance) progressChartInstance.destroy();

    // Group data by year
    let yearCounts = {};
    globalAchievements.forEach(item => {
        let y = item.year || "2024";
        yearCounts[y] = (yearCounts[y] || 0) + 1;
    });

    // Sort years chronologically
    let sortedYears = Object.keys(yearCounts).sort((a, b) => a - b);
    let counts = sortedYears.map(y => yearCounts[y]);

    progressChartInstance = new Chart(ctx, {
        type: 'line', // Can be changed to 'bar'
        data: {
            labels: sortedYears,
            datasets: [{
                label: 'Total Submissions',
                data: counts,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

// ==========================================
// 2. ADMIN PORTAL (ADMIN.HTML) LOGIC
// ==========================================
if(document.getElementById("tablebody-admin")) {
    fetch("http://localhost:5000/achievements")
    .then(res => res.json())
    .then(data => {
        let table = document.getElementById("tablebody-admin");
        data.forEach(item => {
            let row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.student_name}</td>
                <td>${item.title}</td>
                <td>${item.category}</td>
                <td>${item.description}</td>
                <td>${item.file_path ? `<a href="http://localhost:5000/${item.file_path}" target="_blank">View</a>` : "No File"}</td>
                <td>${item.status || "Pending"}</td>
                <td>
                    <button class="approve" style="background:green; color:white; border:none; padding:5px; cursor:pointer;" onclick="approveAchievement(${item.id})">Approve</button>
                    <button class="reject" style="background:red; color:white; border:none; padding:5px; cursor:pointer;" onclick="rejectAchievement(${item.id})">Reject</button>
                </td>
            `;
            table.appendChild(row);
        });
    });
}

function approveAchievement(id){
    fetch(`http://localhost:5000/approve/${id}`,{ method:"PUT" })
    .then(res=>res.text()).then(msg=>{ alert(msg); location.reload(); });
}

function rejectAchievement(id){
    fetch(`http://localhost:5000/reject/${id}`,{ method:"PUT" })
    .then(res=>res.text()).then(msg=>{ alert(msg); location.reload(); });
}


// SUBMIT FORM LOGIC

if(document.getElementById("achievementForm")){
    document.getElementById("achievementForm").addEventListener("submit", function(e){
        e.preventDefault();
        let formData = new FormData();
        formData.append("student_name", document.getElementById("student_name").value);
        formData.append("year", document.getElementById("year").value); // NEW FIELD ADDED HERE
        formData.append("title", document.getElementById("title").value);
        formData.append("category", document.getElementById("category").value);
        formData.append("description", document.getElementById("description").value);

        let fileInput = document.getElementById("file_upload");
        if(fileInput.files.length > 0){
            formData.append("file_upload", fileInput.files[0]);
        }

        fetch("http://localhost:5000/submit",{
            method:"POST",
            body: formData
        })
        .then(res=>res.text())
        .then(msg=>{
            alert(msg);
            document.getElementById("achievementForm").reset();
        });
    });
}


// 4. LOGIN LOGIC

if(document.getElementById("loginForm")){
    document.getElementById("loginForm").addEventListener("submit", function(e){
        e.preventDefault();
        let data = {
            username: document.getElementById("username").value,
            password: document.getElementById("password").value
        };

        fetch("http://localhost:5000/admin/login",{
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(result => {
            if(result.success){
                alert("Login successful");
                localStorage.setItem("adminLoggedIn", "true");
                window.location.href = "admin.html";
            } else {
                alert("Invalid username or password");
            }
        });
    });
}