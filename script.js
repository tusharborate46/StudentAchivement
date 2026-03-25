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
            <td><span class="badge" style="background: #003366; color: white; padding: 4px 8px; border-radius: 4px;">${item.category}</span></td>
            <td>${item.description}</td>
            <td>${item.file_path ? `<a href="http://localhost:5000/${item.file_path}" target="_blank">View</a>` : "No File"}</td>
            <td>
                <button onclick="generateSingleReport(${item.id})" 
        style="background: #28a745; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;">
    <i class="fa-solid fa-file-pdf"></i> Report
</button>
            </td>
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
    const canvasElement = document.getElementById('yearlyPieChart');
    const chartContainer = canvasElement.parentElement; // The div holding the canvas
    const ctx = canvasElement.getContext('2d');
    
    if (pieChartInstance) pieChartInstance.destroy();

    // Change title based on filter
    document.getElementById("pieChartTitle").innerText = selectedYear === "All" ? "Overall Category Distribution" : `Distribution for ${selectedYear}`;

    let academic = 0, sports = 0, cultural = 0;
    filteredData.forEach(item => {
        if(item.category === "Academic") academic++;
        if(item.category === "Sports") sports++;
        if(item.category === "Cultural") cultural++;
    });

    let totalData = academic + sports + cultural;

    // 1. Remove the "No Data" message if it was added previously
    let existingMsg = document.getElementById("no-pie-data-msg");
    if (existingMsg) existingMsg.remove();

    // 2. Check if there is no data
    if (totalData === 0) {
        canvasElement.style.display = 'none'; // Hide the blank canvas

        // Create a nice "No records" message
        let msg = document.createElement("div");
        msg.id = "no-pie-data-msg";
        msg.style.position = "absolute";
        msg.style.top = "50%";
        msg.style.left = "50%";
        msg.style.transform = "translate(-50%, -50%)";
        msg.style.color = "gray";
        msg.style.fontStyle = "italic";
        msg.innerHTML = "<i class='fa-solid fa-chart-pie mb-2 d-block' style='font-size:24px; color:#ccc;'></i> No records match this filter";
        msg.style.textAlign = "center";
        
        chartContainer.appendChild(msg);
        return; // Stop here, don't draw the chart
    }

    // 3. If there IS data, make sure the canvas is visible and draw the chart
    canvasElement.style.display = 'block';

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


// 2. ADMIN PORTAL (ADMIN.HTML) LOGIC

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
                <td>${item.year}</td>
                <td>${item.file_path ? `<a href="http://localhost:5000/${item.file_path}" target="_blank">View</a>` : "No File"}</td>
                <td>${item.status || "Pending"}</td>
                <td>
                    <button class="approve" style="background:green; color:white; border:none; padding:5px; cursor:pointer; border-radius:5px" onclick="approveAchievement(${item.id})">Approve</button>
                    <button class="reject" style="background:red; color:white; border:none;border:none; padding:5px; cursor:pointer; border-radius:5px; padding:5px; cursor:pointer;" onclick="rejectAchievement(${item.id})">Reject</button>
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


//EXPORT PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // 1. Get the current filters for the title
    const selectedYear = document.getElementById("filterYear").value;
    const selectedCat = document.getElementById("filterCategory").value;
    
    // 2. Filter the data 
    const dataToExport = globalAchievements.filter(item => {
        let itemYear = String(item.year || "2024");
        let matchesYear = (selectedYear === "All") || (itemYear === selectedYear);
        let matchesCat = (selectedCat === "All") || (item.category === selectedCat);
        return matchesYear && matchesCat;
    });

    // --- UX IMPROVEMENT: Check for empty data ---
    if (dataToExport.length === 0) {
        alert("There are no records matching your current filters to export.");
        return; // Stop the function here so it doesn't download a blank PDF
    }

    // 3. Add Header Content
    doc.setFontSize(18);
    doc.text("Achievements Report", 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Filter: Year (${selectedYear}), Category (${selectedCat})`, 14, 30);
    doc.text(`Total Records: ${dataToExport.length}`, 14, 37);

    // 4. Map data for the table
    const tableRows = dataToExport.map(item => [
        item.id,
        item.year || "2024",
        item.student_name,
        item.category,
        item.title,
        item.description
    ]);

    // 5. Generate Table
    doc.autoTable({
        startY: 45,
        head: [['ID', 'Year', 'Student Name', 'Category', 'Title', 'Description']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102] }, 
        styles: { fontSize: 9 },
        columnStyles: {
            5: { cellWidth: 50 } 
        }
    });

    // 6. Save File
    doc.save(`Achievements_Report_${selectedYear}.pdf`);

    // --- UX IMPROVEMENT: Success Alert ---
    alert(`Success! The bulk report for ${selectedYear} has been downloaded to your PC.`);
}

// GENERATE REPORT
function generateSingleReport(itemId) {
    // Safely look up the item data using its ID
    const item = globalAchievements.find(a => a.id == itemId);
    
    if (!item) {
        alert("Error: Could not find the details for this achievement.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // --- 1. Header & Branding ---
    doc.setFillColor(0, 51, 102); // Dark Blue
    doc.rect(0, 0, 210, 40, 'F'); 
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("ACHIEVEMENT CERTIFICATE", 105, 25, { align: "center" }); // FIX: Changed "C" to "center"

    // --- 2. Record Metadata ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Report ID: #ACH-${item.id}`, 14, 50);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 55);

    // --- 3. Main Content Section ---
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 60, 196, 60); // Horizontal line

    // Student Name
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("This is to certify that", 105, 75, { align: "center" }); // FIX: Changed "C" to "center"
    
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(item.student_name.toUpperCase(), 105, 88, { align: "center" }); // FIX: Changed "C" to "center"

    // Category Badge (Simulated)
    doc.setDrawColor(0, 51, 102);
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(85, 95, 40, 10, 2, 2, 'FD');
    doc.setFontSize(10);
    doc.text(item.category, 105, 101, { align: "center" }); // FIX: Changed "C" to "center"

    // Achievement Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Achievement Title:", 14, 120);
    doc.setFont("helvetica", "normal");
    doc.text(item.title, 14, 128);

    // Description (Multi-line)
    doc.setFont("helvetica", "bold");
    doc.text("Details:", 14, 140);
    doc.setFont("helvetica", "normal");
    const splitDesc = doc.splitTextToSize(item.description, 180);
    doc.text(splitDesc, 14, 148);

    // --- 4. Verification Table ---
    doc.autoTable({
        startY: 180,
        head: [['Attribute', 'Details']],
        body: [
            ['Academic Year', item.year || "2024"],
            ['Status', item.status || "Approved"],
            ['Verification Link', item.file_path ? "Attachment Provided" : "No Attachment"]
        ],
        theme: 'striped',
        headStyles: { fillColor: [0, 51, 102] }
    });

    // --- 5. Footer / Stamp Area ---
    const finalY = doc.lastAutoTable.finalY + 30;
    doc.line(140, finalY, 190, finalY);
    doc.setFontSize(10);
    doc.text("Authorized Signature", 165, finalY + 5, { align: "center" }); // FIX: Changed "C" to "center"

    // Save the PDF (this triggers the download)
    doc.save(`Achievement_${item.student_name.replace(/\s+/g, '_')}_${item.id}.pdf`);

    // --- TRIGGER ALERT MESSAGE HERE ---
    alert(`Success! The certificate for ${item.student_name} has been downloaded to your PC.`);
}