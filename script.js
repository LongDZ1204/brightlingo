/* script.js - Phiên bản tự động hút dữ liệu từ Google Sheets */

// 1. DÁN ID GOOGLE SHEET CỦA BẠN VÀO ĐÂY:
const SHEET_ID = '1lnuHtXDvq7r1fRU4xHf6yU5dIg0ktsDhEZz2jeoMRUQ'; 

// ==========================================
// CÁC HÀM HỖ TRỢ XỬ LÝ DỮ LIỆU
// ==========================================
function getYouTubeID(url) {
    if(!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Hàm fetch API ẩn của Google
async function fetchSheetData(sheetName) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
    try {
        const response = await fetch(url);
        const text = await response.text();
        // Google trả về 1 chuỗi text bọc JSON, cần cắt bỏ phần thừa để lấy JSON chuẩn
        const jsonString = text.substring(47, text.length - 2); 
        const json = JSON.parse(jsonString);
        return json.table.rows; // Trả về các hàng dữ liệu
    } catch (error) {
        console.error(`Lỗi tải dữ liệu từ sheet ${sheetName}:`, error);
        return [];
    }
}

// ==========================================
// KHỞI CHẠY TẢI DỮ LIỆU TỪ INTERNET
// ==========================================
let videoData = [], docData = [], examData = [];

window.onload = async () => {
    // Tải đồng loạt 3 sheet
    const [videoRows, docRows, examRows] = await Promise.all([
        fetchSheetData('Videos'),
        fetchSheetData('Documents'),
        fetchSheetData('Exams')
    ]);

    // Xử lý data Video (Cột 0: Tên, Cột 1: Link, Cột 2: Danh mục)
    videoData = videoRows.map(row => ({
        title: row.c[0]?.v || '',
        link: row.c[1]?.v || '',
        category: row.c[2]?.v || 'Khác'
    })).filter(v => v.title !== '');

    // Xử lý data Documents (Cột 0: Tên, Cột 1: Link, Cột 2: Loại)
    docData = docRows.map(row => ({
        title: row.c[0]?.v || '',
        link: row.c[1]?.v || '#',
        type: row.c[2]?.v || 'thamkhao'
    })).filter(d => d.title !== '');

    // Xử lý data Exams (Cột 0: Tên, Cột 1: Cấp độ, Cột 2: Link)
    examData = examRows.map(row => ({
        title: row.c[0]?.v || '',
        level: row.c[1]?.v || 'Cơ bản',
        link: row.c[2]?.v || '#'
    })).filter(e => e.title !== '');

    // Render ra giao diện (Giữ nguyên logic của Phase 2)
    renderVideoTabs();
    renderVideos();
    switchDocTab('giangday');
    renderExams();
};

// ==========================================
// LOGIC RENDER GIAO DIỆN (Giữ nguyên như bản trước)
// ==========================================
let currentVideoCategory = 'Tất cả';

function renderVideoTabs() {
    const tabsContainer = document.getElementById('video-tabs');
    const categories = ['Tất cả', ...new Set(videoData.map(v => v.category))];
    tabsContainer.innerHTML = '';
    categories.forEach(category => {
        const btn = document.createElement('button');
        const isActive = category === currentVideoCategory;
        btn.className = `px-5 py-2 rounded-full font-semibold border-2 transition ${isActive ? 'tab-active' : 'tab-inactive hover:border-blue-900 hover:text-blue-900'}`;
        btn.innerText = category;
        btn.onclick = () => { currentVideoCategory = category; renderVideoTabs(); renderVideos(); };
        tabsContainer.appendChild(btn);
    });
}

function renderVideos() {
    const grid = document.getElementById('video-grid');
    grid.innerHTML = '';
    const filteredVideos = currentVideoCategory === 'Tất cả' ? videoData : videoData.filter(v => v.category === currentVideoCategory);
    
    if(filteredVideos.length === 0) {
        grid.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">Đang cập nhật video...</p>';
        return;
    }

    filteredVideos.forEach(video => {
        const videoId = getYouTubeID(video.link);
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1';
        card.innerHTML = `
            <div class="relative w-full" style="padding-top: 56.25%;">
                <iframe class="absolute top-0 left-0 w-full h-full" src="https://www.youtube.com/embed/${videoId}" title="${video.title}" frameborder="0" allowfullscreen></iframe>
            </div>
            <div class="p-5">
                <span class="inline-block px-3 py-1 mb-2 text-xs font-semibold text-blue-900 bg-blue-100 rounded-full">${video.category}</span>
                <h3 class="text-lg font-bold text-gray-900 line-clamp-2">${video.title}</h3>
            </div>
        `;
        grid.appendChild(card);
    });
}

let currentDocType = 'giangday';
function switchDocTab(type) {
    currentDocType = type;
    document.getElementById('tab-giangday').className = type === 'giangday' ? 'px-6 py-3 text-lg font-semibold border-b-2 border-blue-900 text-blue-900 transition' : 'px-6 py-3 text-lg font-semibold border-b-2 border-transparent text-gray-500 hover:text-blue-900 transition';
    document.getElementById('tab-thamkhao').className = type === 'thamkhao' ? 'px-6 py-3 text-lg font-semibold border-b-2 border-blue-900 text-blue-900 transition' : 'px-6 py-3 text-lg font-semibold border-b-2 border-transparent text-gray-500 hover:text-blue-900 transition';
    renderDocs();
}

function renderDocs() {
    const grid = document.getElementById('doc-grid');
    grid.innerHTML = '';
    const filteredDocs = docData.filter(d => d.type === currentDocType);
    if(filteredDocs.length === 0) {
        grid.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">Chưa có tài liệu trong mục này.</p>';
        return;
    }
    filteredDocs.forEach(doc => {
        const card = document.createElement('div');
        card.className = 'flex items-center p-5 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-300 hover:shadow-md transition group';
        card.innerHTML = `
            <div class="text-red-500 text-3xl mr-4 group-hover:-translate-y-1 transition"><i class="fa-solid fa-file-pdf"></i></div>
            <div class="flex-1"><h3 class="text-gray-900 font-semibold text-lg line-clamp-1">${doc.title}</h3></div>
            <a href="${doc.link}" target="_blank" class="ml-4 text-blue-900 bg-blue-100 hover:bg-blue-900 hover:text-white px-4 py-2 rounded font-medium transition">Tải về</a>
        `;
        grid.appendChild(card);
    });
}

function renderExams() {
    const list = document.getElementById('exam-list');
    list.innerHTML = '';
    if(examData.length === 0) {
        list.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-gray-500">Đang cập nhật đề thi...</td></tr>';
        return;
    }
    examData.forEach(exam => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition";
        let levelColor = "bg-green-100 text-green-800";
        if(exam.level === "Trung cấp") levelColor = "bg-yellow-100 text-yellow-800";
        if(exam.level === "Nâng cao") levelColor = "bg-red-100 text-red-800";
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap"><div class="flex items-center"><i class="fa-solid fa-pen-to-square text-blue-500 mr-3"></i><span class="text-sm font-medium text-gray-900">${exam.title}</span></div></td>
            <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${levelColor}">${exam.level}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><a href="${exam.link}" target="_blank" class="text-blue-600 hover:text-blue-900 font-bold border border-blue-600 rounded px-3 py-1 hover:bg-blue-50 transition">Làm bài</a></td>
        `;
        list.appendChild(tr);
    });
}