import React, { useState, useEffect, useRef } from 'react';
import { getItems, getAdminData, addAdminItem } from '../api';
import { Link } from 'react-router-dom';

const Admin = ({ showToast }) => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [applications, setApplications] = useState([]);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  
  // 신규 품목 등록 폼 State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', description: '', deadline: '' });
  const [newImage, setNewImage] = useState(null); // File object
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await getItems();
      if (data && data.items) {
        setItems(data.items);
        if (data.items.length > 0) {
          handleItemSelection(data.items[0].name);
        }
      }
    } catch (err) {
      showToast("품목 목록을 불러오지 못했습니다.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelection = async (itemName) => {
    setSelectedItem(itemName);
    setLoadingData(true);
    setApplications([]);
    try {
      const data = await getAdminData(itemName);
      if (data && data.items) {
        // 학년, 반, 이름 순으로 정렬
        const sorted = data.items.sort((a, b) => {
          const getSortValue = (val) => {
            const match = String(val).match(/^(\d+)/);
            if (match) return { isNum: true, val: parseInt(match[1]) };
            return { isNum: false, val: 999, original: String(val) };
          };

          const gradeA = getSortValue(a.grade);
          const gradeB = getSortValue(b.grade);

          // 학년 숫자 우선 (1-6)
          if (gradeA.isNum && !gradeB.isNum) return -1;
          if (!gradeA.isNum && gradeB.isNum) return 1;
          if (gradeA.val !== gradeB.val) return gradeA.val - gradeB.val;
          if (!gradeA.isNum && !gradeB.isNum) {
            const cmp = gradeA.original.localeCompare(gradeB.original);
            if (cmp !== 0) return cmp;
          }

          // 학년이 같으면 반 정렬
          const classA = getSortValue(a.classNum);
          const classB = getSortValue(b.classNum);
          if (classA.isNum && !classB.isNum) return -1;
          if (!classA.isNum && classB.isNum) return 1;
          if (classA.val !== classB.val) return classA.val - classB.val;
          
          const classCmp = String(a.classNum).localeCompare(String(b.classNum));
          if (classCmp !== 0) return classCmp;

          // 이름 정렬
          return String(a.name).localeCompare(String(b.name));
        });
        setApplications(sorted);
        
        const sum = sorted.reduce((acc, curr) => acc + (parseInt(curr.quantity) || 0), 0);
        setTotalQuantity(sum);
      } else {
        setTotalQuantity(0);
      }
    } catch (err) {
      showToast("데이터를 불러오지 못했습니다.", "error");
    } finally {
      setLoadingData(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewImage(e.target.files[0]);
    }
  };

  const handleAddItemSubmit = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newImage) {
      showToast("품목명과 이미지는 필수 항목입니다.", "error");
      return;
    }
    
    setIsAdding(true);
    try {
      // 1. 파일을 Base64로 인코딩
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result;
        
        // 2. API 호출
        const payload = {
          itemName: newItem.name,
          description: newItem.description,
          deadline: newItem.deadline,
          imageBase64: base64data,
          imageFileName: newImage.name,
          imageMimeType: newImage.type
        };
        
        const result = await addAdminItem(payload);
        if (result.success) {
          showToast("새로운 기자재가 성공적으로 등록 되었습니다!", "success");
          setShowAddForm(false);
          setNewItem({ name: '', description: '', deadline: '' });
          setNewImage(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          fetchItems(); // 목록 갱신
        } else {
          showToast(result.error || "등록 중 오류가 발생했습니다.", "error");
        }
        setIsAdding(false);
      };
      reader.onerror = () => {
        showToast("파일을 읽는 도중 오류가 발생했습니다.", "error");
        setIsAdding(false);
      };
      
      reader.readAsDataURL(newImage); // Data URI scheme으로 읽기
      
    } catch (err) {
      showToast("등록 실패. 다시 시도해주세요.", "error");
      setIsAdding(false);
    }
  };

  return (
    <div className="container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header className="header" style={{ marginBottom: '2rem', padding: '2rem 1rem' }}>
        <h1 style={{ fontSize: '2rem' }}>관리자 대시보드</h1>
        <p>기자재 신청 현황을 열람합니다.</p>
        <Link to="/" className="btn btn-secondary" style={{ width: 'auto', display: 'inline-block', marginTop: '1rem' }}>
          &larr; 사용자 홈으로
        </Link>
      </header>
      
      {loading ? (
        <div className="skeleton" style={{ height: '300px' }}></div>
      ) : (
        <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>
          
          <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ flexGrow: 1 }}>
              <label className="form-label" style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>품목 선택</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {items.map(item => (
                  <button
                    key={item.name}
                    className={`btn ${selectedItem === item.name ? '' : 'btn-secondary'}`}
                    style={{ width: 'auto' }}
                    onClick={() => handleItemSelection(item.name)}
                  >
                    {item.name} ({item.count}건)
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              className="btn btn-secondary" 
              style={{ width: 'auto', marginLeft: '1rem', whiteSpace: 'nowrap', borderColor: 'var(--primary)', color: 'var(--primary)' }}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              + 새 품목 등록
            </button>
          </div>

          {showAddForm && (
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--primary)', animation: 'fadeIn 0.3s' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--primary)' }}>새로운 기자재 등록</h3>
              <form onSubmit={handleAddItemSubmit}>
                <div className="form-row">
                  <div className="form-col form-group">
                    <label className="form-label">품목명 *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="예: 아이패드 10세대" 
                      value={newItem.name} 
                      onChange={e => setNewItem({...newItem, name: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="form-col form-group">
                    <label className="form-label">기한 설정</label>
                    <input 
                      type="datetime-local" 
                      className="form-control" 
                      value={newItem.deadline} 
                      onChange={e => setNewItem({...newItem, deadline: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">이미지 파일 (구글 드라이브 업로드) *</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="form-control" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    required 
                    style={{ padding: '0.5rem' }}
                  />
                  <small style={{ color: 'var(--text-muted)' }}>* 선택한 사진은 지정된 구글 드라이브 폴더에 저장됩니다.</small>
                </div>

                <div className="form-group">
                  <label className="form-label">기자재 설명</label>
                  <textarea 
                    className="form-control" 
                    placeholder="신청 시 유의사항 등을 적어주세요." 
                    value={newItem.description} 
                    onChange={e => setNewItem({...newItem, description: e.target.value})} 
                  ></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setShowAddForm(false)}>취소</button>
                  <button type="submit" className="btn" style={{ width: 'auto', minWidth: '120px' }} disabled={isAdding}>
                    {isAdding ? <><span className="spinner"></span> 등록 중...</> : '드라이브에 저장하고 등록'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', overflowX: 'auto' }}>
            <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {selectedItem} 신청 현황
              {!loadingData && applications.length > 0 && (
                <span style={{ fontSize: '1rem', background: '#FEF2F2', color: 'var(--error)', padding: '0.25rem 0.75rem', borderRadius: '9999px', marginLeft: 'auto' }}>
                  총 신청 수량: {totalQuantity}개
                </span>
              )}
              {loadingData && <span className="spinner spinner-primary" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span>}
            </h2>

            {!loadingData && applications.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>신청 내역이 없습니다.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', width: '20%', whiteSpace: 'nowrap' }}>신청일시</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', width: '10%', whiteSpace: 'nowrap', textAlign: 'center' }}>학년/구분</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', width: '10%', whiteSpace: 'nowrap', textAlign: 'center' }}>반/실</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', width: '10%', whiteSpace: 'nowrap', textAlign: 'center' }}>교사명</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', width: '5%', whiteSpace: 'nowrap' }}>수량</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', width: '45%' }}>비고</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>{new Date(app.timestamp).toLocaleString('ko-KR')}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: '500', whiteSpace: 'nowrap', textAlign: 'center' }}>{app.grade}</td>
                      <td style={{ padding: '0.75rem 0.5rem', whiteSpace: 'nowrap', textAlign: 'center' }}>{app.classNum}</td>
                      <td style={{ padding: '0.75rem 0.5rem', whiteSpace: 'nowrap', textAlign: 'center' }}>{app.name}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ background: 'var(--primary)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                          {app.quantity}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{app.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
