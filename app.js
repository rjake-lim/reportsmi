import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBCpZCNOmT0hcuTdJmU_3-SA4rTv5k4PpY",
  authDomain: "reportsmi-3181.firebaseapp.com",
  projectId: "reportsmi-3181",
  storageBucket: "reportsmi-3181.firebasestorage.app",
  messagingSenderId: "276935335804",
  appId: "1:276935335804:web:28b70982f495fca48fcef9"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let currentReportID = null;

// DOM Elements
const dashboardPage = document.getElementById("dashboardPage");
const reportsPage = document.getElementById("reportsPage");
const analyticsPage = document.getElementById("analyticsPage");
const settingsPage = document.getElementById("settingsPage");
const saveBtn = document.getElementById("saveBtn");
const updateBtn = document.getElementById("updateBtn");
const reportsTable = document.getElementById("reportsTable");
const outputText = document.getElementById("outputText");

// Save Report
window.saveReport = async () => {
    const text = outputText.innerText;
    await addDoc(collection(db,"reports"),{ content:text, date:new Date().toLocaleString() });
    alert("Report Saved");
}

// Update Report
window.updateReport = async () => {
    await updateDoc(doc(db,"reports",currentReportID),{ content:outputText.innerText });
    alert("Report Updated");
}

// Show Dashboard
window.showDashboard = () => {
    dashboardPage.style.display="block";
    reportsPage.style.display="none";
    analyticsPage.style.display="none";
    settingsPage.style.display="none";
    saveBtn.style.display="inline-block";
    updateBtn.style.display="none";
}

// Show Reports
window.showReports = async () => {
    dashboardPage.style.display="none";
    reportsPage.style.display="block";
    analyticsPage.style.display="none";
    settingsPage.style.display="none";

    const snapshot = await getDocs(collection(db,"reports"));
    reportsTable.innerHTML = "";
    snapshot.forEach(docSnap=>{
        reportsTable.innerHTML += `
        <tr>
        <td>${docSnap.data().date}</td>
        <td>
            <button class="btn btn-info btn-sm" onclick="openReport('${docSnap.id}')">Open</button>
            <button class="btn btn-danger btn-sm" onclick="deleteReport('${docSnap.id}')">Delete</button>
        </td>
        </tr>`;
    });
}

// Open Report
window.openReport = async (id)=>{
    const snap = await getDoc(doc(db,"reports",id));
    outputText.innerText = snap.data().content;
    currentReportID = id;
    showDashboard();
    saveBtn.style.display="none";
    updateBtn.style.display="inline-block";
}

// Delete Report
window.deleteReport = async (id)=>{
    if(confirm("Delete this report?")){
        await deleteDoc(doc(db,"reports",id));
        showReports();
    }
}

// Analytics
window.showAnalytics = () => {
    dashboardPage.style.display="none";
    reportsPage.style.display="none";
    analyticsPage.style.display="block";
    settingsPage.style.display="none";
}

// Settings
window.showSettings = () => {
    dashboardPage.style.display="none";
    reportsPage.style.display="none";
    analyticsPage.style.display="none";
    settingsPage.style.display="block";
}

// SIDEBAR CONTROL
const sidebar=document.getElementById("sidebarMenu");
const overlay=document.getElementById("overlay");
const toggle=document.getElementById("menuToggle");
const closeBtn=document.getElementById("sidebarClose");
const contentWrapper=document.getElementById("contentWrapper");

toggle.onclick=()=>{
    sidebar.classList.add("show");
    overlay.classList.add("show");
    contentWrapper.classList.add("shift");
};
closeBtn.onclick=closeSidebar;
overlay.onclick=closeSidebar;

function closeSidebar(){
    sidebar.classList.remove("show");
    overlay.classList.remove("show");
    contentWrapper.classList.remove("shift");
}

// EXCEL TABLE
const table = document.getElementById("editableTable");
const tbody = table.querySelector("tbody");

// Convert table to plain text
function updateText() {
    let text = "";
    tbody.querySelectorAll("tr").forEach(row => {
        let rowText = "";
        row.querySelectorAll("td").forEach((cell,index)=>{
            let cellText = cell.innerText.replace(/\t/g,"");
            if(index>0) rowText += " ";
            rowText += cellText;
        });
        text += rowText + "\n";
    });
    outputText.textContent = text;
}

// Keep one empty row
function ensureEmptyRow() {
    const rows = tbody.querySelectorAll("tr");
    const lastRow = rows[rows.length-1];
    const hasContent = [...lastRow.cells].some(td=>td.innerText.trim()!=="");
    if(hasContent){
        const tr = document.createElement("tr");
        for(let i=0;i<lastRow.cells.length;i++){
            const td = document.createElement("td");
            td.contentEditable="true";
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
}

// Arrow key navigation
table.addEventListener("keydown", e => {
    const cell = e.target.closest("td");
    if(!cell) return;
    const row = cell.parentElement;
    const rowIndex = [...tbody.rows].indexOf(row);
    const colIndex = [...row.cells].indexOf(cell);
    let targetCell = null;
    switch(e.key){
        case "ArrowRight": e.preventDefault();
            if(!row.cells[colIndex+1]){
                tbody.querySelectorAll("tr").forEach(r=>{
                    const td = document.createElement("td");
                    td.contentEditable = "true";
                    r.appendChild(td);
                });
            }
            targetCell = row.cells[colIndex+1];
            break;
        case "ArrowLeft": e.preventDefault(); targetCell = row.cells[colIndex-1]; break;
        case "ArrowDown": e.preventDefault();
            if(!tbody.rows[rowIndex+1]){
                const tr = document.createElement("tr");
                for(let i=0;i<row.cells.length;i++){
                    const td = document.createElement("td");
                    td.contentEditable = "true";
                    tr.appendChild(td);
                }
                tbody.appendChild(tr);
            }
            targetCell = tbody.rows[rowIndex+1].cells[colIndex];
            break;
        case "ArrowUp": e.preventDefault();
            if(tbody.rows[rowIndex-1]) targetCell = tbody.rows[rowIndex-1].cells[colIndex];
            break;
    }
    if(targetCell) targetCell.focus();
});

// Paste support
table.addEventListener("paste", e=>{
    const text = e.clipboardData.getData("text");
    if(text.includes("\t")||text.includes("\n")){
        e.preventDefault();
        const rows = text.replace(/\r/g,"").split("\n").map(r=>r.split("\t"));
        tbody.innerHTML="";
        rows.forEach(row=>{
            const tr=document.createElement("tr");
            row.forEach(cellText=>{
                const td=document.createElement("td");
                td.contentEditable="true";
                td.innerText=cellText;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    }
    ensureEmptyRow();
    updateText();
});

// Input update
table.addEventListener("input", ()=>{
    ensureEmptyRow();
    updateText();
});
