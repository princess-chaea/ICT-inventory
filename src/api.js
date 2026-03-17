// src/api.js
const GAS_URL = import.meta.env.VITE_GAS_URL;

if (!GAS_URL) {
  console.warn("환경 변수 VITE_GAS_URL 설정되지 않았습니다. API 호출이 실패할 수 있습니다.");
}

export const getItems = async () => {
  if (!GAS_URL) return { items: [] };

  try {
    const response = await fetch(`${GAS_URL}?action=getInitialData`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("아이템 목록 불러오기 에러:", error);
    throw error;
  }
};

export const submitApplication = async (payload) => {
  if (!GAS_URL) throw new Error("GAS Web App URL이 없습니다.");

  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      // GAS의 CORS Preflight (OPTIONS) 문제를 우회하기 위해 text/plain 사용
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("신청서 제출 에러:", error);
    throw error;
  }
};
