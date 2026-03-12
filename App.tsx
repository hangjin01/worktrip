import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import L from 'leaflet';
import { Trip, ViewState, Coordinate, CheckInRecord, Expense, ItineraryItem } from './types';
import { getCurrentPosition, calculateDistance } from './services/locationService';
import { analyzeReceiptImage, generateTripReport } from './services/geminiService';
import { 
  IconMapPin, 
  IconBriefcase, 
  IconCamera, 
  IconFileText, 
  IconChevronRight, 
  IconCheckCircle, 
  IconClock, 
  IconHome, 
  IconReceipt, 
  IconXCircle, 
  IconGlobe, 
  IconEdit, 
  IconCalendar,
  IconZap,
  IconLogOut,
  IconPlus,
  IconTrash,
  IconMap,
  IconNavigation,
  IconSave,
  IconX,
  IconImage,
  IconSend
} from './components/Icons';

// --- Translations ---
type Lang = 'ja' | 'ko';

const TRANSLATIONS = {
  ja: {
    status_label: "現在のステータス",
    status_active: "出張中 (Active)",
    status_inactive: "出張予定なし",
    btn_checkin: "手動チェックイン",
    btn_expense: "経費入力",
    history_title: "最近の活動履歴",
    history_subtitle: "History",
    no_history: "まだ活動記録がありません",
    btn_create_report: "日報作成 (AI)",
    trip_schedule_title: "訪問スケジュール",
    trip_schedule_hint: "現地に到着すると自動でチェックインされます",
    btn_checkin_here: "手動チェックイン",
    locating: "測位中...",
    scan_title: "レシートをスキャン",
    scan_desc: "カメラでレシートを撮影するか、画像を選択してください。AIが自動で内容を読み取ります。",
    btn_camera: "カメラを起動",
    btn_upload: "アルバムから選択",
    analyzing: "解析中... (Analyzing)",
    report_preview: "出張日報プレビュー",
    report_ai_badge: "AI Generated",
    report_loading: "レポート作成中...",
    report_sending: "送信中...",
    report_failed: "レポートを生成できませんでした。",
    btn_regenerate: "再生成",
    btn_submit: "メールで提出 (Submit)",
    btn_edit: "編集",
    btn_done: "完了",
    nav_home: "ホーム",
    nav_schedule: "日程",
    nav_report: "日報",
    nav_settings: "設定",
    error_loc_perm: "位置情報を取得できません。権限を確認してください。",
    error_loc_fetch: "現在地を取得できませんでした。",
    msg_checkin_ok: "✅ {name}にチェックインしました",
    msg_checkin_warn: "⚠️ {name}から離れていますが、記録しました。",
    msg_receipt_fail: "レシート解析に失敗しました。もう一度お試しください。",
    msg_img_fail: "画像の読み込みに失敗しました。",
    debug_gps: "GPS:",
    status_checked_in: "チェックイン済み:",
    auto_checkin_active: "自動チェックイン有効",
    auto_checkin_desc: "目的地付近(50m以内)で自動記録",
    toast_auto_checkin: "📍 自動チェックイン完了: {name}",
    btn_checkout: "チェックアウト",
    status_checked_out: "チェックアウト:",
    msg_checkout_ok: "👋 {name}からチェックアウトしました",
    // New Trip Translations
    title_create_trip: "新規出張計画",
    label_trip_title: "出張名",
    label_destination: "行き先",
    label_start_date: "開始日",
    label_end_date: "終了日",
    label_trip_purpose: "出張の目的",
    btn_save_trip: "計画を保存",
    section_upcoming: "今後の出張予定",
    msg_trip_created: "新しい出張計画を作成しました",
    btn_new_trip: "新規作成",
    msg_fill_all: "すべての項目を入力してください",
    confirm_delete_trip: "この出張計画を削除してもよろしいですか？",
    msg_trip_deleted: "出張計画を削除しました",
    msg_no_trip_selected: "出張が選択されていません",
    msg_create_first_trip: "新しい出張計画を作成してください",
    // Map & Edit
    tab_list: "リスト",
    tab_map: "マップ",
    btn_navigate: "経路案内",
    btn_cancel: "キャンセル",
    btn_save: "保存",
    label_location_name: "場所名",
    label_address: "住所",
    label_time: "時間",
    // Email
    label_email: "送信先メールアドレス",
    placeholder_email: "manager@company.com",
    msg_email_sent: "日報を送信しました: {email}",
    error_email_required: "メールアドレスを入力してください",
    // Expense Chart
    chart_title: "経費内訳",
    chart_total: "合計"
  },
  ko: {
    status_label: "현재 상태",
    status_active: "출장 중 (Active)",
    status_inactive: "출장 일정 없음",
    btn_checkin: "수동 체크인",
    btn_expense: "경비 입력",
    history_title: "최근 활동 내역",
    history_subtitle: "History",
    no_history: "아직 활동 기록이 없습니다",
    btn_create_report: "일보 작성 (AI)",
    trip_schedule_title: "방문 일정",
    trip_schedule_hint: "현지에 도착하면 자동으로 체크인됩니다",
    btn_checkin_here: "수동 체크인",
    locating: "위치 확인 중...",
    scan_title: "영수증 스캔",
    scan_desc: "카메라로 영수증을 찍거나 이미지를 선택하세요. AI가 자동으로 내용을 읽어옵니다.",
    btn_camera: "카메라 실행",
    btn_upload: "앨범에서 선택",
    analyzing: "분석 중... (Analyzing)",
    report_preview: "출장 일보 미리보기",
    report_ai_badge: "AI 생성됨",
    report_loading: "리포트 작성 중...",
    report_sending: "전송 중...",
    report_failed: "리포트를 생성할 수 없습니다.",
    btn_regenerate: "재생성",
    btn_submit: "메일로 제출 (Submit)",
    btn_edit: "수정",
    btn_done: "완료",
    nav_home: "홈",
    nav_schedule: "일정",
    nav_report: "일보",
    nav_settings: "설정",
    error_loc_perm: "위치 정보를 가져올 수 없습니다. 권한을 확인해주세요.",
    error_loc_fetch: "현재 위치를 가져올 수 없습니다.",
    msg_checkin_ok: "✅ {name}에 체크인했습니다",
    msg_checkin_warn: "⚠️ {name}에서 떨어져 있지만 기록했습니다.",
    msg_receipt_fail: "영수증 분석에 실패했습니다. 다시 시도해주세요.",
    msg_img_fail: "이미지를 불러오는데 실패했습니다.",
    debug_gps: "GPS:",
    status_checked_in: "체크인 완료:",
    auto_checkin_active: "자동 체크인 활성",
    auto_checkin_desc: "목적지 부근(50m 이내) 자동 기록",
    toast_auto_checkin: "📍 자동 체크인 완료: {name}",
    btn_checkout: "체크아웃",
    status_checked_out: "체크아웃:",
    msg_checkout_ok: "👋 {name}에서 체크아웃했습니다",
    // New Trip Translations
    title_create_trip: "새 출장 계획",
    label_trip_title: "출장명",
    label_destination: "목적지",
    label_start_date: "시작일",
    label_end_date: "종료일",
    label_trip_purpose: "출장 목적",
    btn_save_trip: "계획 저장",
    section_upcoming: "예정된 출장",
    msg_trip_created: "새 출장 계획이 생성되었습니다",
    btn_new_trip: "새로 만들기",
    msg_fill_all: "모든 항목을 입력해주세요",
    confirm_delete_trip: "이 출장 계획을 삭제하시겠습니까?",
    msg_trip_deleted: "출장 계획이 삭제되었습니다",
    msg_no_trip_selected: "선택된 출장이 없습니다",
    msg_create_first_trip: "새로운 출장 계획을 만들어보세요",
    // Map & Edit
    tab_list: "목록",
    tab_map: "지도",
    btn_navigate: "길찾기",
    btn_cancel: "취소",
    btn_save: "저장",
    label_location_name: "장소명",
    label_address: "주소",
    label_time: "시간",
    // Email
    label_email: "수신 이메일 주소",
    placeholder_email: "manager@company.com",
    msg_email_sent: "일보를 전송했습니다: {email}",
    error_email_required: "이메일 주소를 입력해주세요",
    // Expense Chart
    chart_title: "경비 내역",
    chart_total: "합계"
  }
};

// Internal Toast Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 left-4 right-4 z-[9999] p-4 rounded-xl shadow-lg flex items-center space-x-3 transition-all transform translate-y-0
      ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}
    `}>
      {type === 'success' ? <IconCheckCircle className="w-6 h-6" /> : <IconXCircle className="w-6 h-6" />}
      <span className="font-bold text-sm">{message}</span>
    </div>
  );
};

// --- Trip Map Component ---
const TripMap = ({ items, t }: { items: ItineraryItem[], t: any }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([35.6812, 139.7671], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance.current);
    }

    const map = mapInstance.current;
    
    // Clear existing markers
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    // Add markers
    const bounds = L.latLngBounds([]);
    
    items.forEach((item) => {
      const { latitude, longitude } = item.coords;
      const markerLatLng = L.latLng(latitude, longitude);
      bounds.extend(markerLatLng);

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color:#4F46E5;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 3px 6px rgba(0,0,0,0.4);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -10]
      });

      const popupContent = document.createElement('div');
      popupContent.innerHTML = `
        <div style="font-family:'Noto Sans JP',sans-serif;">
          <strong style="color:#1e1b4b;font-size:14px;">${item.locationName}</strong><br/>
          <span style="color:#6b7280;font-size:12px;">${item.scheduledTime}</span><br/>
          <div style="margin-top:8px;">
            <button class="nav-btn" style="background-color:#4F46E5;color:white;border:none;padding:4px 8px;border-radius:4px;font-size:12px;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:4px;">
              <span>${t.btn_navigate}</span>
            </button>
          </div>
        </div>
      `;
      
      const navBtn = popupContent.querySelector('.nav-btn');
      if (navBtn) {
          navBtn.addEventListener('click', () => {
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, '_blank');
          });
      }

      L.marker(markerLatLng, { icon: customIcon })
        .addTo(map)
        .bindPopup(popupContent);
    });

    if (items.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      // Map cleanup handled by ref check
    };
  }, [items]);

  return <div ref={mapRef} className="w-full h-full rounded-xl z-0" />;
};


const App: React.FC = () => {
  // State
  const [language, setLanguage] = useState<Lang>('ja');
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedReport, setGeneratedReport] = useState<string>('');
  const [isEditingReport, setIsEditingReport] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Detail View State
  const [showMap, setShowMap] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemData, setEditItemData] = useState<Partial<ItineraryItem>>({});

  // New Trip Form State
  const [newTripData, setNewTripData] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    purpose: ''
  });
  
  // Helpers
  const t = TRANSLATIONS[language];
  const toggleLanguage = () => setLanguage(prev => prev === 'ja' ? 'ko' : 'ja');

  // Grouping trips by month
  const groupTripsByMonth = (trips: Trip[]) => {
    const groups: { [key: string]: Trip[] } = {};
    trips.forEach(trip => {
      if (!trip.startDate) return;
      const date = new Date(trip.startDate);
      if (isNaN(date.getTime())) return;
      
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(trip);
    });
    
    return Object.keys(groups).sort().map(key => ({
      monthKey: key,
      trips: groups[key].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    }));
  };

  const formatMonthHeader = (key: string) => {
    const [year, month] = key.split('-');
    return language === 'ja' ? `${year}年 ${parseInt(month, 10)}月` : `${year}년 ${parseInt(month, 10)}월`;
  };

  // File Input Ref for Camera
  const fileInputRef = useRef<HTMLInputElement>(null);
  // File Input Ref for Gallery
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Initialize Location & Auto Check-in Loop
  useEffect(() => {
    updateLocation();
    
    // Poll location every 10 seconds for faster auto-checkin response
    const interval = setInterval(() => {
      updateLocation();
    }, 10000); 

    return () => clearInterval(interval);
  }, []);

  // Effect for Auto Check-in Logic
  useEffect(() => {
    if (!currentLocation || !activeTrip) return;
    
    // Check distances for all itinerary items
    activeTrip.itinerary.forEach(item => {
      // 1. Check if already checked in
      const isAlreadyCheckedIn = checkIns.some(ci => ci.itineraryItemId === item.id && ci.type === 'check-in');
      if (isAlreadyCheckedIn) return;

      // 2. Check distance
      const distance = calculateDistance(currentLocation, item.coords);
      const AUTO_CHECKIN_THRESHOLD = 50; // meters

      // 3. Trigger Check-in if close
      if (distance <= AUTO_CHECKIN_THRESHOLD) {
        performCheckIn(item, true); // true = automated
      }
    });

  }, [currentLocation, checkIns, activeTrip]); // Run when location changes or checkins update

  const updateLocation = async () => {
    try {
      const coords = await getCurrentPosition();
      setCurrentLocation(coords);
      setErrorMsg(null);
    } catch (err) {
      console.warn("Location error", err);
      setErrorMsg(t.error_loc_perm);
    }
  };

  // --- Handlers ---

  const performCheckIn = (item: any, isAuto: boolean) => {
    if (!currentLocation || !activeTrip) return;

    const newRecord: CheckInRecord = {
      id: Date.now().toString(),
      tripId: activeTrip.id,
      timestamp: Date.now(),
      locationName: item.locationName,
      coords: currentLocation,
      type: 'check-in',
      verified: true,
      itineraryItemId: item.id
    };

    setCheckIns(prev => [...prev, newRecord]);

    if (isAuto) {
       setNotification({
         message: t.toast_auto_checkin.replace('{name}', item.locationName),
         type: 'success'
       });
    } else {
       // Manual check-in feedback
       alert(t.msg_checkin_ok.replace('{name}', item.locationName));
    }
  };

  const handleManualCheckIn = async (itemId: string) => {
    setLoading(true);
    await updateLocation(); // Force update
    
    if (!currentLocation) {
      setLoading(false);
      alert(t.error_loc_fetch);
      return;
    }

    if (!activeTrip) {
        setLoading(false);
        return;
    }

    const item = activeTrip.itinerary.find(i => i.id === itemId);
    if (!item) {
        setLoading(false);
        return;
    }

    // Manual check-in always allowed, but we can warn if far away
    performCheckIn(item, false);
    setLoading(false);
  };

  const handleCheckOut = async (itemId: string) => {
    setLoading(true);
    await updateLocation();
    
    if (!currentLocation) {
      setLoading(false);
      alert(t.error_loc_fetch);
      return;
    }

    if (!activeTrip) {
        setLoading(false);
        return;
    }

    const item = activeTrip.itinerary.find(i => i.id === itemId);
    if (!item) {
        setLoading(false);
        return;
    }

    const newRecord: CheckInRecord = {
      id: Date.now().toString(),
      tripId: activeTrip.id,
      timestamp: Date.now(),
      locationName: item.locationName,
      coords: currentLocation,
      type: 'check-out',
      verified: true,
      itineraryItemId: itemId
    };

    setCheckIns(prev => [...prev, newRecord]);
    setLoading(false);
    alert(t.msg_checkout_ok.replace('{name}', item.locationName));
  };

  const handleReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeTrip) {
        alert(t.msg_no_trip_selected);
        return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // Convert to Base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        
        try {
          const result = await analyzeReceiptImage(base64String);
          
          const newExpense: Expense = {
            id: Date.now().toString(),
            tripId: activeTrip.id,
            date: result.date || new Date().toISOString().split('T')[0],
            merchant: result.merchant || 'Unknown',
            amount: result.amount || 0,
            category: result.category || 'Other',
            imageUrl: URL.createObjectURL(file) // temporary preview
          };
          
          setExpenses([newExpense, ...expenses]);
          setView(ViewState.TRIP_DETAIL); // Go back to list
        } catch (apiError) {
          console.error(apiError);
          alert(t.msg_receipt_fail);
        } finally {
            setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setLoading(false);
      alert(t.msg_img_fail);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setIsSending(false);
    setIsEditingReport(false);
    const itinerary = activeTrip ? activeTrip.itinerary : [];
    const report = await generateTripReport(checkIns, expenses, language, itinerary);
    setGeneratedReport(report);
    setLoading(false);
  };
  
  const handleSendReport = () => {
    if (!recipientEmail) {
        alert(t.error_email_required);
        return;
    }
    
    setLoading(true);
    setIsSending(true);
    
    setTimeout(() => {
        setLoading(false);
        setIsSending(false);
        setNotification({
            message: t.msg_email_sent.replace('{email}', recipientEmail),
            type: 'success'
        });
        setView(ViewState.HOME);
        setRecipientEmail(''); // Reset
    }, 1500);
  };

  const handleSaveTrip = () => {
    if (!newTripData.title || !newTripData.destination || !newTripData.startDate || !newTripData.endDate) {
      alert(t.msg_fill_all);
      return;
    }

    // Auto-create a default itinerary item
    const defaultItineraryItem: ItineraryItem = {
      id: `item-${Date.now()}`,
      title: newTripData.title,
      locationName: newTripData.destination,
      address: newTripData.destination,
      coords: { latitude: 35.6812, longitude: 139.7671 }, // Default placeholder coordinates (Tokyo)
      scheduledTime: '09:00'
    };

    const newTrip: Trip = {
      id: `TRIP-${Date.now()}`,
      title: newTripData.title,
      destination: newTripData.destination,
      startDate: newTripData.startDate,
      endDate: newTripData.endDate,
      status: 'upcoming',
      purpose: newTripData.purpose,
      itinerary: [defaultItineraryItem]
    };

    setUpcomingTrips([...upcomingTrips, newTrip]);
    setActiveTrip(newTrip); // Set as active trip so it appears in Schedule view
    setNewTripData({ title: '', destination: '', startDate: '', endDate: '', purpose: '' });
    setView(ViewState.HOME);
    setNotification({ message: t.msg_trip_created, type: 'success' });
  };

  const handleUpcomingTripClick = (trip: Trip) => {
    setActiveTrip(trip);
    setView(ViewState.TRIP_DETAIL);
  };

  const handleDeleteTrip = (e: React.MouseEvent, tripId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm(t.confirm_delete_trip)) {
      // Remove trip from list
      setUpcomingTrips(prev => prev.filter(t => t.id !== tripId));
      
      // Remove associated data (Check-ins and Expenses)
      setCheckIns(prev => prev.filter(c => c.tripId !== tripId));
      setExpenses(prev => prev.filter(ex => ex.tripId !== tripId));

      setNotification({ message: t.msg_trip_deleted, type: 'success' });
      
      // If the deleted trip was the active one, clear active state and reset view
      if (activeTrip?.id === tripId) {
          setActiveTrip(null);
          setView(ViewState.HOME);
      }
    }
  };

  // -- Edit Itinerary Handlers --
  const handleEditClick = (item: ItineraryItem) => {
    setEditingItemId(item.id);
    setEditItemData(item);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditItemData({});
  };

  const handleSaveEdit = () => {
    if (!activeTrip || !editingItemId) return;

    const updatedItinerary = activeTrip.itinerary.map(item => {
      if (item.id === editingItemId) {
        return { ...item, ...editItemData };
      }
      return item;
    });

    const updatedTrip = { ...activeTrip, itinerary: updatedItinerary };
    setActiveTrip(updatedTrip);

    // Update in upcomingTrips list as well
    setUpcomingTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));

    setEditingItemId(null);
    setEditItemData({});
  };

  // --- Rendering Helpers ---

  // Simple Markdown Parser (Headers, Bold, Lists)
  const renderMarkdown = (text: string) => {
    if (!text) return '';
    const lines = text.split('\n');
    let html = '';
    let inList = false;

    lines.forEach(line => {
        // Sanitize & basic formatting
        let cleanLine = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        
        // Bold formatting
        cleanLine = cleanLine.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');

        if (cleanLine.trim().startsWith('## ')) {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<h3 class="text-lg font-bold text-indigo-700 mt-6 mb-3 border-b border-indigo-50 pb-2">${cleanLine.replace('## ', '')}</h3>`;
        } else if (cleanLine.trim().startsWith('- ')) {
            if (!inList) { html += '<ul class="list-disc pl-5 space-y-2 mb-4">'; inList = true; }
            html += `<li class="text-gray-700 leading-relaxed pl-1">${cleanLine.replace('- ', '')}</li>`;
        } else if (cleanLine.trim() === '') {
            if (inList) { html += '</ul>'; inList = false; }
            html += '<div class="h-3"></div>';
        } else {
            if (inList) { html += '</ul>'; inList = false; }
            // Only add p tag if it's not a header line
            if (!cleanLine.startsWith('#')) {
                html += `<p class="mb-2 text-gray-600 leading-relaxed">${cleanLine}</p>`;
            }
        }
    });
    if (inList) html += '</ul>';
    return html;
  };

  // --- Expense Chart Helper ---
  const renderExpenseChart = () => {
    if (expenses.length === 0) return null;

    // Aggregate expenses by category
    const categoryTotals: { [key: string]: number } = {};
    let totalAmount = 0;

    expenses.forEach(exp => {
      const cat = exp.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
      totalAmount += exp.amount;
    });

    const data = Object.keys(categoryTotals).map((cat, index) => ({
      label: cat,
      value: categoryTotals[cat],
      color: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'][index % 5], // Indigo, Emerald, Amber, Pink, Violet
      percentage: Math.round((categoryTotals[cat] / totalAmount) * 100)
    })).sort((a, b) => b.value - a.value);

    // Pie Chart SVG Logic
    let cumulativePercent = 0;
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mt-4">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
           <span>{t.chart_title}</span>
           <span className="text-xs text-gray-500 font-normal">{t.chart_total}: ¥{totalAmount.toLocaleString()}</span>
        </h3>
        
        <div className="flex items-center justify-between">
           {/* Chart */}
           <div className="relative w-32 h-32 shrink-0">
              <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }} className="w-full h-full">
                {data.map((slice, i) => {
                  if (slice.value === 0) return null;
                  const startPercent = cumulativePercent;
                  const slicePercent = slice.value / totalAmount;
                  const endPercent = cumulativePercent + slicePercent;
                  cumulativePercent = endPercent;

                  // Handle single slice 100% case
                  if (slicePercent >= 0.999) {
                    return <circle key={i} cx="0" cy="0" r="1" fill={slice.color} />;
                  }

                  const x1 = Math.cos(2 * Math.PI * startPercent);
                  const y1 = Math.sin(2 * Math.PI * startPercent);
                  const x2 = Math.cos(2 * Math.PI * endPercent);
                  const y2 = Math.sin(2 * Math.PI * endPercent);

                  const largeArcFlag = slicePercent > 0.5 ? 1 : 0;

                  const pathData = [
                    `M 0 0`,
                    `L ${x1} ${y1}`,
                    `A 1 1 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    `Z`
                  ].join(' ');

                  return <path key={i} d={pathData} fill={slice.color} />;
                })}
              </svg>
              {/* Donut hole */}
              <div className="absolute inset-0 m-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-inner">
                 <IconReceipt className="w-6 h-6 text-gray-300" />
              </div>
           </div>

           {/* Legend */}
           <div className="flex-1 ml-6 space-y-2 overflow-y-auto max-h-40">
              {data.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center">
                    <div className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-600 font-medium truncate max-w-[80px]">{item.label}</span>
                  </div>
                  <div className="text-right shrink-0">
                     <span className="font-bold text-gray-800">¥{item.value.toLocaleString()}</span>
                     <span className="text-gray-400 ml-1">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  };

  // --- Views ---

  const renderHome = () => (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <IconGlobe className="w-32 h-32" />
        </div>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">{t.status_label}</p>
            <h1 className="text-2xl font-bold flex items-center gap-2">
                {activeTrip ? t.status_active : t.status_inactive}
                {activeTrip && <span className="animate-pulse w-2 h-2 rounded-full bg-green-400"></span>}
            </h1>
          </div>
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
            <IconBriefcase className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="mt-6 relative z-10">
          {activeTrip ? (
            <>
              <p className="text-lg font-semibold">{activeTrip.title}</p>
              <div className="flex items-center text-blue-200 text-sm mt-1 space-x-2">
                <IconMapPin className="w-4 h-4" />
                <span>{activeTrip.destination}</span>
                <span className="mx-1">•</span>
                <IconClock className="w-4 h-4" />
                <span>{activeTrip.startDate} - {activeTrip.endDate}</span>
              </div>
              {activeTrip.purpose && (
                 <p className="text-blue-200 text-xs mt-2 italic bg-blue-800/30 p-2 rounded-lg inline-block">
                   "{activeTrip.purpose}"
                 </p>
              )}
            </>
          ) : (
            <div className="py-4">
              <p className="text-blue-100 text-sm mb-3">{t.msg_create_first_trip}</p>
              <button 
                onClick={() => setView(ViewState.CREATE_TRIP)}
                className="bg-white/20 hover:bg-white/30 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <IconPlus className="w-4 h-4" />
                <span>{t.btn_new_trip}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => {
              if (activeTrip) {
                  setView(ViewState.TRIP_DETAIL);
              } else {
                  alert(t.msg_no_trip_selected);
              }
          }}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 active:bg-gray-50 transition-colors"
        >
          <div className={`p-3 rounded-full relative ${activeTrip ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
            <IconCalendar className="w-6 h-6" />
            {activeTrip && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>}
          </div>
          <span className={`font-medium ${activeTrip ? 'text-gray-700' : 'text-gray-400'}`}>{t.nav_schedule}</span>
        </button>

        <button 
          onClick={() => {
            if (activeTrip) {
                setView(ViewState.SCANNER);
                setTimeout(() => fileInputRef.current?.click(), 100);
            } else {
                alert(t.msg_no_trip_selected);
            }
          }}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 active:bg-gray-50 transition-colors"
        >
          <div className={`p-3 rounded-full ${activeTrip ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
            <IconCamera className="w-6 h-6" />
          </div>
          <span className={`font-medium ${activeTrip ? 'text-gray-700' : 'text-gray-400'}`}>{t.btn_expense}</span>
        </button>
      </div>

       {/* Upcoming Trips Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-gray-800 text-base">{t.section_upcoming}</h3>
            <button 
                onClick={() => setView(ViewState.CREATE_TRIP)}
                className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full font-bold flex items-center space-x-1 active:bg-indigo-100"
            >
                <IconPlus className="w-3 h-3" />
                <span>{t.btn_new_trip}</span>
            </button>
        </div>
        
        {upcomingTrips.length === 0 ? (
             <div 
                onClick={() => setView(ViewState.CREATE_TRIP)}
                className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 bg-gray-50 hover:bg-white hover:border-indigo-200 hover:text-indigo-400 transition-all cursor-pointer"
             >
                <IconBriefcase className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-sm font-medium">{t.btn_new_trip}</span>
             </div>
        ) : (
            <div className="space-y-4">
                {groupTripsByMonth(upcomingTrips).map(group => (
                    <div key={group.monthKey}>
                        <h4 className="text-xs font-bold text-gray-500 mb-2 ml-1">
                            {formatMonthHeader(group.monthKey)}
                        </h4>
                        <div className="space-y-3">
                            {group.trips.map(trip => (
                                <div 
                                  key={trip.id} 
                                  onClick={() => handleUpcomingTripClick(trip)}
                                  className={`p-4 rounded-xl shadow-sm border flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer relative group
                                    ${activeTrip?.id === trip.id ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-white border-gray-100'}
                                  `}
                                >
                                     <div className="flex items-center space-x-4 w-full">
                                        <div className={`p-3 rounded-lg shrink-0 ${activeTrip?.id === trip.id ? 'bg-indigo-200 text-indigo-700' : 'bg-indigo-50 text-indigo-600'}`}>
                                            <IconCalendar className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-gray-800 text-sm truncate">{trip.title}</h4>
                                            {trip.purpose && (
                                                <p className="text-xs text-gray-600 mt-0.5 truncate">{trip.purpose}</p>
                                            )}
                                            <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                                                <span className="flex items-center truncate"><IconMapPin className="w-3 h-3 mr-0.5" /> {trip.destination}</span>
                                                <span>•</span>
                                                <span className="shrink-0">{trip.startDate}</span>
                                            </div>
                                        </div>
                                        <button 
                                          type="button"
                                          onClick={(e) => handleDeleteTrip(e, trip.id)}
                                          className="p-3 -m-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-20"
                                          aria-label="Delete trip"
                                        >
                                          <IconTrash className="w-4 h-4 pointer-events-none" />
                                        </button>
                                     </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
            <span>{t.history_title}</span>
            <span className="text-xs text-gray-400 font-normal">{t.history_subtitle}</span>
        </h3>
        
        {checkIns.length === 0 && expenses.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            {t.no_history}
          </div>
        ) : (
          <div className="space-y-4">
            {checkIns.map(ci => (
              <div key={ci.id} className="flex items-start space-x-3 pb-3 border-b border-gray-50 last:border-0">
                <div className={`mt-1 p-1.5 rounded-full ${ci.type === 'check-out' ? 'bg-gray-100 text-gray-600' : (ci.verified ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600')}`}>
                   {ci.type === 'check-out' ? <IconLogOut className="w-3 h-3" /> : (ci.verified ? <IconZap className="w-3 h-3" /> : <IconMapPin className="w-3 h-3" />)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{ci.locationName} <span className="text-xs font-normal text-gray-500">({ci.type === 'check-out' ? t.btn_checkout : 'Check-in'})</span></p>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-gray-500">{new Date(ci.timestamp).toLocaleString(language === 'ja' ? 'ja-JP' : 'ko-KR')}</p>
                    {ci.verified && ci.type === 'check-in' && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 rounded">Auto</span>}
                  </div>
                </div>
                {ci.verified && <IconCheckCircle className="w-4 h-4 text-blue-500 ml-auto" />}
              </div>
            ))}
            {expenses.map(ex => (
              <div key={ex.id} className="flex items-start space-x-3 pb-3 border-b border-gray-50 last:border-0">
                <div className="mt-1 p-1.5 rounded-full bg-green-100 text-green-600">
                   <IconReceipt className="w-3 h-3" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-800">{ex.merchant}</p>
                    <p className="text-sm font-bold text-gray-800">¥{ex.amount.toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-gray-500">{ex.category} • {ex.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Expense Chart */}
      {renderExpenseChart()}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
        {/* Navbar */}
        <div className="bg-white shadow-sm sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-black tracking-tight text-indigo-900 flex items-center gap-2">
            <IconGlobe className="w-6 h-6 text-indigo-600" />
            <span>O1BO</span>
            </h1>
            <div className="flex items-center space-x-2">
                <button 
                    onClick={toggleLanguage}
                    className="px-3 py-1.5 rounded-full bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                >
                    {language === 'ja' ? '🇯🇵 日本語' : '🇰🇷 한국어'}
                </button>
            </div>
        </div>

        <main className="p-4 max-w-md mx-auto">
            {notification && (
                <Toast 
                    message={notification.message} 
                    type={notification.type} 
                    onClose={() => setNotification(null)} 
                />
            )}

            {view === ViewState.HOME && renderHome()}

            {view === ViewState.CREATE_TRIP && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">{t.title_create_trip}</h2>
                    {/* Form for Create Trip */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">{t.label_trip_title}</label>
                            <input 
                                type="text" 
                                value={newTripData.title}
                                onChange={(e) => setNewTripData({...newTripData, title: e.target.value})}
                                className="w-full p-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                                placeholder="e.g. Tokyo Business Trip"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">{t.label_destination}</label>
                            <input 
                                type="text" 
                                value={newTripData.destination}
                                onChange={(e) => setNewTripData({...newTripData, destination: e.target.value})}
                                className="w-full p-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                                placeholder="e.g. Tokyo, Japan"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">{t.label_start_date}</label>
                                <input 
                                    type="date" 
                                    value={newTripData.startDate}
                                    onChange={(e) => setNewTripData({...newTripData, startDate: e.target.value})}
                                    className="w-full p-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">{t.label_end_date}</label>
                                <input 
                                    type="date" 
                                    value={newTripData.endDate}
                                    onChange={(e) => setNewTripData({...newTripData, endDate: e.target.value})}
                                    className="w-full p-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">{t.label_trip_purpose}</label>
                            <textarea 
                                value={newTripData.purpose}
                                onChange={(e) => setNewTripData({...newTripData, purpose: e.target.value})}
                                className="w-full p-2 border border-gray-200 rounded-lg h-24 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                                placeholder="..."
                            />
                        </div>
                        <button 
                            onClick={handleSaveTrip}
                            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
                        >
                            {t.btn_save_trip}
                        </button>
                    </div>
                </div>
            )}

            {view === ViewState.TRIP_DETAIL && activeTrip && (
                <div className="space-y-4 flex flex-col h-[calc(100vh-140px)]">
                    <div className="flex items-center justify-between shrink-0">
                        <button onClick={() => setView(ViewState.HOME)} className="text-sm text-gray-500 flex items-center">
                            <IconChevronRight className="w-4 h-4 rotate-180 mr-1" /> Back
                        </button>
                        <h2 className="text-lg font-bold">{activeTrip.title}</h2>
                        <div className="w-8"></div>
                    </div>
                    
                    {/* View Toggle */}
                    <div className="bg-gray-200 p-1 rounded-lg flex shrink-0">
                      <button 
                        onClick={() => setShowMap(false)}
                        className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-md transition-all ${!showMap ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500'}`}
                      >
                        <IconFileText className="w-3 h-3 mr-1" />
                        {t.tab_list}
                      </button>
                      <button 
                        onClick={() => setShowMap(true)}
                        className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-md transition-all ${showMap ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500'}`}
                      >
                        <IconMap className="w-3 h-3 mr-1" />
                        {t.tab_map}
                      </button>
                    </div>

                    {showMap ? (
                      <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 shadow-inner relative bg-gray-100">
                        <TripMap items={activeTrip.itinerary} t={t} />
                      </div>
                    ) : (
                      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex-1 overflow-y-auto">
                          <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-3">{t.trip_schedule_title}</h3>
                          <div className="space-y-4">
                              {activeTrip.itinerary.map((item) => {
                                  const isCheckedIn = checkIns.some(c => c.itineraryItemId === item.id && c.type === 'check-in');
                                  const isCheckedOut = checkIns.some(c => c.itineraryItemId === item.id && c.type === 'check-out');
                                  const isEditing = editingItemId === item.id;
                                  
                                  return (
                                  <div key={item.id} className="relative pl-6 pb-6 border-l-2 border-indigo-200 last:pb-0 last:border-l-0">
                                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow-sm"></div>
                                      
                                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 relative group">
                                          {isEditing ? (
                                            <div className="space-y-2">
                                              <div>
                                                <label className="text-[10px] text-gray-500 font-bold uppercase">{t.label_time}</label>
                                                <input 
                                                  type="time" 
                                                  value={editItemData.scheduledTime || ''} 
                                                  onChange={(e) => setEditItemData({...editItemData, scheduledTime: e.target.value})}
                                                  className="w-full text-sm p-1.5 border border-gray-200 rounded bg-white text-gray-900 focus:ring-2 focus:ring-indigo-100 outline-none"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-[10px] text-gray-500 font-bold uppercase">{t.label_location_name}</label>
                                                <input 
                                                  type="text" 
                                                  value={editItemData.locationName || ''}
                                                  onChange={(e) => setEditItemData({...editItemData, locationName: e.target.value})}
                                                  className="w-full text-sm p-1.5 border border-gray-200 rounded bg-white text-gray-900 focus:ring-2 focus:ring-indigo-100 outline-none"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-[10px] text-gray-500 font-bold uppercase">{t.label_address}</label>
                                                <input 
                                                  type="text" 
                                                  value={editItemData.address || ''}
                                                  onChange={(e) => setEditItemData({...editItemData, address: e.target.value})}
                                                  className="w-full text-sm p-1.5 border border-gray-200 rounded bg-white text-gray-900 focus:ring-2 focus:ring-indigo-100 outline-none"
                                                />
                                              </div>
                                              <div className="flex space-x-2 pt-2">
                                                <button onClick={handleSaveEdit} className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded flex items-center justify-center">
                                                  <IconSave className="w-3 h-3 mr-1" /> {t.btn_save}
                                                </button>
                                                <button onClick={handleCancelEdit} className="flex-1 bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded flex items-center justify-center">
                                                  <IconX className="w-3 h-3 mr-1" /> {t.btn_cancel}
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <>
                                              <button 
                                                onClick={() => handleEditClick(item)}
                                                className="absolute top-2 right-2 p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                              >
                                                <IconEdit className="w-4 h-4" />
                                              </button>

                                              <div className="flex justify-between items-start mb-2 pr-8">
                                                  <div>
                                                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{item.scheduledTime}</span>
                                                      <h4 className="font-bold text-gray-800 mt-1">{item.locationName}</h4>
                                                      <p className="text-xs text-gray-500">{item.address}</p>
                                                  </div>
                                                  {isCheckedIn && !isCheckedOut && (
                                                      <span className="text-green-500"><IconCheckCircle className="w-5 h-5" /></span>
                                                  )}
                                              </div>
                                              
                                              <div className="flex space-x-2 mt-3">
                                                  {!isCheckedIn ? (
                                                      <button 
                                                          onClick={() => handleManualCheckIn(item.id)}
                                                          className="flex-1 bg-indigo-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all"
                                                      >
                                                          {t.btn_checkin}
                                                      </button>
                                                  ) : !isCheckedOut ? (
                                                      <button 
                                                          onClick={() => handleCheckOut(item.id)}
                                                          className="flex-1 bg-white border border-gray-200 text-gray-700 text-xs font-bold py-2 rounded-lg hover:bg-gray-50 active:scale-95 transition-all"
                                                      >
                                                          {t.btn_checkout}
                                                      </button>
                                                  ) : (
                                                      <div className="flex-1 bg-gray-100 text-gray-400 text-center text-xs font-bold py-2 rounded-lg">
                                                          Completed
                                                      </div>
                                                  )}
                                              </div>
                                            </>
                                          )}
                                      </div>
                                  </div>
                                  );
                              })}
                          </div>
                      </div>
                    )}
                </div>
            )}

            {view === ViewState.REPORT && (
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <button onClick={() => setView(ViewState.HOME)} className="text-sm text-gray-500 flex items-center">
                            <IconChevronRight className="w-4 h-4 rotate-180 mr-1" /> Back
                        </button>
                        <h2 className="text-lg font-bold">{t.report_preview}</h2>
                        <div className="w-8"></div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                            <p className="text-gray-500">{isSending ? t.report_sending : t.report_loading}</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500 flex items-center">
                                    <IconZap className="w-3 h-3 mr-1 text-yellow-500" />
                                    {t.report_ai_badge}
                                </span>
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={() => setIsEditingReport(!isEditingReport)}
                                        className="p-1.5 hover:bg-white rounded text-gray-500 transition-colors"
                                    >
                                        {isEditingReport ? <IconCheckCircle className="w-4 h-4 text-green-500" /> : <IconEdit className="w-4 h-4" />}
                                    </button>
                                    <button 
                                        onClick={handleGenerateReport} 
                                        className="p-1.5 hover:bg-white rounded text-gray-500 transition-colors"
                                        title={t.btn_regenerate}
                                    >
                                        <IconZap className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                {isEditingReport ? (
                                    <textarea 
                                        className="w-full h-96 text-sm text-gray-700 leading-relaxed p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 bg-white outline-none"
                                        value={generatedReport}
                                        onChange={(e) => setGeneratedReport(e.target.value)}
                                    />
                                ) : (
                                    <div 
                                        className="prose prose-sm max-w-none text-gray-700"
                                        dangerouslySetInnerHTML={{ __html: renderMarkdown(generatedReport) }}
                                    />
                                )}
                            </div>
                            {/* Email and Submit Section */}
                            <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">{t.label_email}</label>
                                    <input 
                                        type="email"
                                        value={recipientEmail}
                                        onChange={(e) => setRecipientEmail(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-sm"
                                        placeholder={t.placeholder_email}
                                    />
                                </div>
                                <button 
                                    onClick={handleSendReport}
                                    className="w-full bg-indigo-900 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200/50 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                >
                                     <IconSend className="w-4 h-4" />
                                     {t.btn_submit}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {view === ViewState.SCANNER && (
                 <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center animate-pulse">
                        <IconCamera className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">{t.scan_title}</h3>
                    <p className="text-gray-500 max-w-xs">{t.scan_desc}</p>
                    
                    {/* Camera Button */}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-full font-bold shadow-lg w-64 flex items-center justify-center space-x-2"
                    >
                        <IconCamera className="w-5 h-5" />
                        <span>{t.btn_camera}</span>
                    </button>

                    {/* Gallery Button */}
                    <button 
                        onClick={() => galleryInputRef.current?.click()}
                        className="bg-white text-indigo-600 border-2 border-indigo-100 px-6 py-3 rounded-full font-bold shadow-sm w-64 flex items-center justify-center space-x-2 hover:bg-indigo-50"
                    >
                        <IconImage className="w-5 h-5" />
                        <span>{t.btn_upload}</span>
                    </button>
                </div>
            )}

        </main>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-40 safe-area-bottom">
            <button 
                onClick={() => setView(ViewState.HOME)}
                className={`flex flex-col items-center space-y-1 ${view === ViewState.HOME ? 'text-indigo-600' : 'text-gray-400'}`}
            >
                <IconHome className="w-6 h-6" />
                <span className="text-[10px] font-bold">{t.nav_home}</span>
            </button>
            
            <button 
                onClick={() => {
                if (activeTrip) setView(ViewState.TRIP_DETAIL);
                else alert(t.msg_no_trip_selected);
                }}
                className={`flex flex-col items-center space-y-1 ${view === ViewState.TRIP_DETAIL ? 'text-indigo-600' : 'text-gray-400'}`}
            >
                <IconCalendar className="w-6 h-6" />
                <span className="text-[10px] font-bold">{t.nav_schedule}</span>
            </button>

            <div className="relative -top-6">
                <button 
                onClick={() => {
                    if (activeTrip) {
                    setView(ViewState.SCANNER);
                    setTimeout(() => fileInputRef.current?.click(), 100);
                    } else {
                    alert(t.msg_no_trip_selected);
                    }
                }}
                className="bg-indigo-600 text-white p-4 rounded-full shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
                >
                <IconCamera className="w-6 h-6" />
                </button>
            </div>

            <button 
                onClick={() => {
                    if (activeTrip) {
                        handleGenerateReport();
                        setView(ViewState.REPORT);
                    } else {
                        alert(t.msg_no_trip_selected);
                    }
                }}
                className={`flex flex-col items-center space-y-1 ${view === ViewState.REPORT ? 'text-indigo-600' : 'text-gray-400'}`}
            >
                <IconFileText className="w-6 h-6" />
                <span className="text-[10px] font-bold">{t.nav_report}</span>
            </button>

            <button className="flex flex-col items-center space-y-1 text-gray-400">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                <span className="text-[10px] font-bold">{t.nav_settings}</span>
            </button>
        </div>
        
        {/* Hidden File Input for Camera */}
        <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            ref={fileInputRef} 
            className="hidden"
            onChange={handleReceiptUpload} 
        />
        {/* Hidden File Input for Gallery */}
         <input 
            type="file" 
            accept="image/*" 
            ref={galleryInputRef} 
            className="hidden"
            onChange={handleReceiptUpload} 
        />
    </div>
  );
};

export default App;