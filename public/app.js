// Firebase 연결 및 데이터베이스 설정
const db = firebase.firestore();
let currentFilter = 'ALL';

// 1. 재고 등록 기능
function addStock() {
    const company = document.getElementById('companySelect').value;
    const type = document.getElementById('typeSelect').value;
    const spec = document.getElementById('specInput').value;
    const qty = Number(document.getElementById('qtyInput').value);
    const weight = Number(document.getElementById('weightInput').value);
    let width = document.getElementById('widthInput').value;

    // 유효성 검사
    if (!spec || !weight) {
        alert("규격과 중량은 필수 입력입니다.");
        return;
    }

    // 원코일 자동 분류 로직 (폭에 따라 분류 예시)
    if (type === '원코일' && width) {
        spec = spec + ` (W:${width})`; 
    }

    // 데이터 저장
    db.collection("stocks").add({
        company: company,
        type: type,
        spec: spec,
        width: width ? Number(width) : 0,
        qty: qty,
        weight: weight,
        timestamp: firebase.firestore.FieldValue.serverTimestamp() // 등록 시간
    }).then(() => {
        alert("재고가 등록되었습니다.");
        // 입력창 초기화
        document.getElementById('specInput').value = '';
        document.getElementById('qtyInput').value = '';
        document.getElementById('weightInput').value = '';
        document.getElementById('widthInput').value = '';
        loadStock(); // 목록 새로고침
    }).catch((error) => {
        console.error("Error adding document: ", error);
        alert("에러 발생: " + error.message);
    });
}

// 2. 재고 불러오기
function loadStock() {
    const tableBody = document.getElementById('tableBody');
    const summaryBox = document.getElementById('summaryBox');
    const loading = document.getElementById('loading');
    
    if(tableBody) tableBody.innerHTML = "";
    if(loading) loading.style.display = "block";

    let query = db.collection("stocks").orderBy("timestamp", "desc");

    if (currentFilter !== 'ALL') {
        query = query.where("company", "==", currentFilter);
    }

    query.get().then((querySnapshot) => {
        let totalWeight = 0;
        let totalCount = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const date = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString() : '-';
            
            let companyName = data.company;
            if(companyName === 'SAMSUNG_KR') companyName = '삼성(한국)';
            if(companyName === 'SAMSUNG_VN') companyName = '삼성(베트남)';
            if(companyName === 'OTHERS') companyName = '기타';

            const row = `
                <tr>
                    <td>${companyName}</td>
                    <td>${data.type}</td>
                    <td>${data.spec}</td>
                    <td>${data.width || '-'}</td>
                    <td>${data.qty}</td>
                    <td>${data.weight.toLocaleString()}</td>
                    <td>${date}</td>
                    <td><button onclick="deleteStock('${doc.id}')" class="delete-btn">삭제</button></td>
                </tr>
            `;
            if(tableBody) tableBody.innerHTML += row;
            totalWeight += data.weight;
            totalCount++;
        });

        if(summaryBox) summaryBox.innerText = `총 중량: ${totalWeight.toLocaleString()} kg / 총 수량: ${totalCount} 건`;
        if(loading) loading.style.display = "none";
    }).catch((error) => {
        console.log("Error getting documents: ", error);
        if(loading) loading.innerText = "데이터 로딩 실패";
    });
}

// 3. 재고 삭제
function deleteStock(id) {
    if(confirm("정말 이 재고를 삭제하시겠습니까?")) {
        db.collection("stocks").doc(id).delete().then(() => {
            alert("삭제되었습니다.");
            loadStock();
        }).catch((error) => {
            alert("삭제 실패: " + error.message);
        });
    }
}

// 4. 필터링
function filterByCompany(companyCode) {
    currentFilter = companyCode;
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(btn => btn.classList.remove('active'));
    if(event) event.target.classList.add('active');
    loadStock();
}

window.onload = loadStock;