/**
 * 웹앱 진입점
 */
function doGet(e) {
  // 앱 실행 시 기초적인 시트 구조가 있는지 확인 및 생성
  checkSetup();
  
  try {
    // e.parameter 객체가 없을 경우 기본 처리 (디버깅 등의 이유로 직접 실행할 때 방어 코드)
    if (!e || !e.parameter) {
      return ContentService.createTextOutput(JSON.stringify({ 
        message: "API SERVER IS RUNNING (Need action parameter)" 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const action = e.parameter.action;
    let result;
    
    if (action === 'getInitialData') {
      result = getInitialData();
    } else if (action === 'getAdminData') {
      result = { items: getAdminData(e.parameter.itemName) };
    } else {
      result = { error: "Unknown action" };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 기초 시트 구조(목록 시트)가 없는 경우 생성합니다.
 */
function checkSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let listSheet = ss.getSheetByName("목록");
  
  if (!listSheet) {
    listSheet = ss.insertSheet("목록");
    listSheet.appendRow(["물품명", "이미지주소", "설명", "마감기한"]);
    listSheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#e1f5fe");
    // 예시 데이터 한 줄 추가 (필요 시)
    listSheet.appendRow(["예시 물품", "", "물품 설명을 입력하세요", "2026-12-31"]);
  }
}

/**
 * [목록] 시트에서 물품 정보와 각 탭의 신청 건수를 가져옵니다.
 */
function getInitialData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const listSheet = ss.getSheetByName("목록");
  
  if (!listSheet) return { items: [] };
  
  const data = listSheet.getDataRange().getValues();
  data.shift(); // 헤더 제외
  
  // 성능 최적화: 모든 시트의 마지막 행 번호를 한 번에 가져와 매핑합니다. (N+1 Query 문제 해결)
  const allSheets = ss.getSheets();
  const countsMap = {};
  allSheets.forEach(s => {
    countsMap[s.getName()] = s.getLastRow() - 1;
  });
  
  const items = data.map(row => {
    const itemName = row[0];
    if (!itemName) return null;
    
    // 이전에 루프 안에서 getSheetByName을 호출하던 것을 매핑된 객체에서 즉시 찾도록 변경
    const count = countsMap[itemName] || 0;
    
    let d = row[3];
    let deadlineStr = d;
    if (Object.prototype.toString.call(d) === '[object Date]') {
      // GAS Date 객체인 경우
      deadlineStr = Utilities.formatDate(d, "GMT+9", "yyyy-MM-dd HH:mm");
    } else if (typeof d === 'string' && d.includes('T')) {
      // 시트 데이터가 ISO 문자열로 넘어온 경우
      try {
        let parsed = new Date(d);
        if (!isNaN(parsed.getTime())) {
          const kstMillis = parsed.getTime() + (9 * 60 * 60 * 1000);
          const kstDate = new Date(kstMillis);
          deadlineStr = kstDate.toISOString().replace('T', ' ').substring(0, 16);
        }
      } catch(e) {}
    }
    
    return {
      name: itemName,
      image: row[1] ? (row[1].startsWith("http") ? row[1] : "https://drive.google.com/thumbnail?id=" + row[1] + "&sz=w1000") : "https://via.placeholder.com/150",
      description: row[2],
      deadline: deadlineStr,
      count: count > 0 ? count : 0
    };
  }).filter(item => item !== null);
  
  return { items: items };
}

/**
 * 관리자용: 특정 물품의 전체 신청 명단을 가져옵니다.
 */
function getAdminData(itemName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(itemName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  data.shift(); // 헤더 제외
  
  return data.map(row => ({
    timestamp: row[0], // 이미 포맷팅된 문자열로 저장됨
    grade: row[1],
    classNum: row[2],
    name: row[3],
    quantity: row[4],
    note: row[5]
  })).reverse(); // 최신순 정렬
}

/**
 * 신청 정보를 해당 물품 이름의 탭에 저장합니다.
 * 시트가 없으면 생성하고 한국 표준시(KST)로 타임스탬프를 기록합니다.
 */
function submitSurvey(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(payload.itemName);
  
  // 1. 해당 물품 탭이 없으면 헤더와 함께 자동 생성
  if (!sheet) {
    sheet = ss.insertSheet(payload.itemName);
    sheet.appendRow(["타임스탬프", "학년/구분", "반/실이름", "교사명", "신청수량", "비고"]);
    sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#f3f3f3");
    sheet.setFrozenRows(1); // 첫 행 고정
  }
  
  // 2. 한국 표준시(KST) 날짜 포맷팅 (년-월-일 시:분:초)
  const kstTime = Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd HH:mm:ss");
  
  // 3. 데이터 기록
  sheet.appendRow([
    kstTime,
    payload.grade,
    payload.classNum,
    payload.teacherName,
    payload.quantity,
    payload.note || ""
  ]);
  return { success: true, newCount: sheet.getLastRow() - 1 };
}

/**
 * 관리자: 새로운 기자재를 등록합니다.
 * DriveApp을 사용하여 사진을 특정 폴더에 저장하고 링크를 시트에 기록합니다.
 */
function addAdminItem(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const listSheet = ss.getSheetByName("목록");
  
  // 1. 이미지 저장 처리
  let imageUrl = "";
  if (payload.imageBase64 && payload.imageFileName) {
    try {
      // Base64 데이터에서 마임 타입 및 순수 데이터 분리 (ex: "data:image/png;base64,iVBORw...")
      const base64Data = payload.imageBase64.split(",")[1];
      const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), payload.imageMimeType, payload.imageFileName);
      
      // 2. Drive 폴더 접근 및 파일 생성
      const folderId = "1TvnV3Tk0BowqaA9F208pAI8bj57cmjYs";
      let folder;
      try {
        folder = DriveApp.getFolderById(folderId);
      } catch (e) {
        return { success: false, error: "1. 폴더 접근 실패 (ID: " + folderId + ") - " + e.toString() };
      }
      
      let file;
      try {
        file = folder.createFile(blob);
      } catch (e) {
        return { success: false, error: "2. 파일 생성 실패 (폴더명: " + folder.getName() + ") - " + e.toString() };
      }
      
      try {
        // 도메인 정책에 따라 외부 공유 설정이 막혀있을 수 있으므로 try-catch로 감싸 비정상 종료를 막습니다.
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (e) {
        console.warn("3. 공유 설정 건너뜀 (도메인 정책 가능성): " + e.toString());
      }
      
      // 썸네일 뷰어 등에서 유연하게 활용하기 위해 파일 ID만 저장합니다.
      imageUrl = file.getId();
    } catch (e) {
      return { 
        success: false, 
        error: "이미지 처리 중 기타 예외 발생: " + e.toString() 
      };
    }
  }
  
  // 2. [목록] 시트에 새 아이템 추가
  listSheet.appendRow([
    payload.itemName,
    imageUrl,
    payload.description || "",
    payload.deadline || ""
  ]);
  
  // 3. 신청받을 전용 시트(탭)도 미리 생성해 둡니다.
  let newSheet = ss.getSheetByName(payload.itemName);
  if (!newSheet) {
    newSheet = ss.insertSheet(payload.itemName);
    newSheet.appendRow(["타임스탬프", "학년/구분", "반/실이름", "교사명", "신청수량", "비고"]);
    newSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#f3f3f3");
    newSheet.setFrozenRows(1); // 첫 행 고정
  }
  
  return { success: true, message: "성공적으로 추가되었습니다." };
}

/**
 * POST 요청 처리 (설문 신청 제출 및 새로운 아이템 추가)
 * Vercel 등 외부에서 fetch 시 preflight(OPTIONS) 에러를 피하기 위해
 * Content-Type: text/plain 으로 요청을 보내고 여기서 JSON 파싱을 수행합니다.
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    let result;
    
    // 동작 분기 처리
    if (payload.action === 'addAdminItem') {
      result = addAdminItem(payload);
    } else {
      // 기본은 신청 제출 로직
      result = submitSurvey(payload);
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 드라이브 권한을 수동으로 테스트하기 위한 디버그용 함수입니다.
 * GAS 에디터에서 이 함수를 선택하고 '실행'을 눌러보세요.
 */
function debugDrivePermissions() {
  const folderId = "1TvnV3Tk0BowqaA9F208pAI8bj57cmjYs";
  try {
    const folder = DriveApp.getFolderById(folderId);
    let currentUser = "알 수 없음 (권한 필요)";
    try {
      currentUser = Session.getActiveUser().getEmail();
    } catch(e) {}
    
    let owner = "알 수 없음";
    try {
      owner = folder.getOwner().getEmail();
    } catch(e) {}
    
    Logger.log("--- 진단 정보 ---");
    Logger.log("현재 실행 사용자: " + currentUser);
    Logger.log("폴더 소유자: " + owner);
    Logger.log("1. 폴더 접근 성공: " + folder.getName());
    
    const testBlob = Utilities.newBlob("test", "text/plain", "test.txt");
    const testFile = folder.createFile(testBlob);
    Logger.log("2. 테스트 파일 생성 성공: " + testFile.getName());
    
    try {
      testFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      Logger.log("3. 공유 설정 성공");
    } catch (e) {
      Logger.log("3. 공유 설정 실패: " + e.toString());
      Logger.log("   -> [원인 분석] 파일 생성은 되지만 공유 설정만 안 되는 경우:");
      Logger.log("      1. 현재 사용자가 폴더의 '편집자'일 뿐 '소유자'는 아님");
      Logger.log("      2. 소유자가 공유 설정의 [편집자가 권한을 변경하고 공유할 수 있음] 체크를 해제함");
    }
    
    // 테스트 파일 즉시 삭제
    testFile.setTrashed(true);
    Logger.log("4. 테스트 완료 및 파일 삭제됨");
    
    return "진단 완료! 소유자와 현재 사용자가 일치하는지 로그를 확인해 주세요.";
  } catch (e) {
    return "치명적 오류: " + e.toString() + "\n(매니페스트 변경으로 인해 '실행' 버튼을 눌러 권한을 다시 승인해야 할 수 있습니다.)";
  }
}