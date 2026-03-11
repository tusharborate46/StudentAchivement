//for displaying the data in Main portal
if(document.getElementById("tablebody")){

fetch("http://localhost:5000/achievements")
.then(res => res.json())
.then(data => {

//main portal body 
let table = document.getElementById("tablebody");
let total = 0;
let academic = 0;
let sports = 0;
let cultural = 0;
data.forEach(item => {

let row = document.createElement("tr");

row.innerHTML = `
<td>${item.id}</td>
<td>${item.student_name}</td>
<td>${item.title}</td>
<td>${item.category}</td>
<td>${item.description}</td>
<td>${item.file_path || "-"}</td>
<td>${item.status || "Approved"}</td>
`;

table.appendChild(row);
total++;

if(item.category === "Academic") academic++;
if(item.category === "Sports") sports++;
if(item.category === "Cultural") cultural++;
});
document.getElementById("totalCount").innerText = total;
document.getElementById("academicCount").innerText = academic;
document.getElementById("sportsCount").innerText = sports;
document.getElementById("culturalCount").innerText = cultural;
});

}


//admin portal body
if(document.getElementById("tablebody-admin")){

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
<td>
${item.file_path ? 
`<a href="http://localhost:5000/${item.file_path}" target="_blank">View</a>`
: "No File"}
</td>
<td ">${item.status || "Pending"}</td>
<td>
<button class="approve" onclick="approveAchievement(${item.id})">Approve</button>
<button class="reject" onclick="rejectAchievement(${item.id})">Reject</button>
</td>

`;

table.appendChild(row);


});

});

}
function approveAchievement(id){

fetch(`http://localhost:5000/approve/${id}`,{
method:"PUT"
})
.then(res=>res.text())
.then(msg=>{
alert(msg);
location.reload(); // refresh table
});

}

function rejectAchievement(id){

fetch(`http://localhost:5000/reject/${id}`,{
method:"PUT"
})
.then(res=>res.text())
.then(msg=>{
alert(msg);
location.reload();
});

}




//Getting the details from user in Submit portal
if(document.getElementById("achievementForm")){

document.getElementById("achievementForm").addEventListener("submit",function(e){

e.preventDefault();

let formData = new FormData();

formData.append("student_name", document.getElementById("student_name").value);
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
});

});
}



//Login sccript
if(document.getElementById("loginForm")){

document.getElementById("loginForm").addEventListener("submit", function(e){

e.preventDefault();

let data = {
username: document.getElementById("username").value,
password: document.getElementById("password").value
};

fetch("http://localhost:5000/admin/login",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body: JSON.stringify(data)
})
.then(res => res.json())
.then(result => {

if(result.success){

alert("Login successful");

// Save login session
localStorage.setItem("adminLoggedIn", "true");

// Redirect to admin panel
window.location.href = "admin.html";

}
else{
alert("Invalid username or password");
}

});

});

}