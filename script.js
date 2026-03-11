//for displaying the data in Main portal
if(document.getElementById("tablebody")){

fetch("http://localhost:5000/achievements")
.then(res => res.json())
.then(data => {

//main portal body
let table = document.getElementById("tablebody");

data.forEach(item => {

let row = document.createElement("tr");

row.innerHTML = `
<td>${item.id}</td>
<td>${item.student_name}</td>
<td>${item.title}</td>
<td>${item.category}</td>
<td>${item.description}</td>
<td>${item.file_upload || "-"}</td>
<td>${item.status || "Approved"}</td>
`;

table.appendChild(row);

});

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
<td>${item.file_upload || "-"}</td>
<td>${item.status || "Approved"}</td>
<td>${item.verification || "Approved"}</td>

`;

table.appendChild(row);

});

});

}




//Getting the details from user in Submit portal
if(document.getElementById("achievementForm")){

document.getElementById("achievementForm").addEventListener("submit",function(e){

e.preventDefault();

let data = {
 student_name: document.getElementById("student_name").value,
 title: document.getElementById("title").value,
 category: document.getElementById("category").value,
 description: document.getElementById("description").value,
 //file-path: document.GET("file-path").file
};

fetch("http://localhost:5000/submit",{
 method:"POST",
 headers:{
  "Content-Type":"application/json"
 },
 body: JSON.stringify(data)
})
.then(res=>res.text())
.then(msg=>{
 alert(msg);
});

});
}