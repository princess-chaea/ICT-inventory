import React, { useState, useEffect } from 'react';
import ItemCard from '../components/ItemCard';
import ApplicationModal from '../components/ApplicationModal';
import { getItems, submitApplication } from '../api';

const Home = ({ showToast }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await getItems();
      if (data && data.items) {
        setItems(data.items);
      } else {
        setItems([]);
      }
    } catch (err) {
      setError("데이터를 불러오는데 실패했습니다.");
      showToast("데이터 형식 오류 또는 네트워크 에러", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleModalSubmit = async (formData) => {
    try {
      const result = await submitApplication(formData);
      if (result.success) {
        showToast("신청이 완료되었습니다!", "success");
        handleModalClose();
        // 신청 완료 후 목록 갱신을 위해 데이터 다시 패치 혹은 count 증가
        setItems(items.map(item => 
          item.name === formData.itemName 
            ? { ...item, count: result.newCount } 
            : item
        ));
      } else {
        showToast(result.error || "신청 중 오류가 발생했습니다.", "error");
      }
    } catch (err) {
      showToast("서버와 통신할 수 없습니다.", "error");
    }
  };

  return (
    <div className="container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header className="header">
        <h1>하주초 정보화 기자재 신청</h1>
        <p>필요한 기자재를 쉽게 신청하세요. 각 품목의 잔여 기한 및 현재 신청 건수를 확인하실 수 있습니다.</p>
      </header>
      
      {loading ? (
        <div className="grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="card skeleton" style={{ height: '380px' }}></div>
          ))}
        </div>
      ) : error ? (
        <div className="empty-state">
          <svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
          <h3>통신 오류 발생</h3>
          <p>{error}</p>
          <button className="btn" style={{ marginTop: '1rem', width: 'auto' }} onClick={fetchItems}>다시 시도</button>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
          </svg>
          <h3>현재 신청 가능한 기자재가 없습니다.</h3>
        </div>
      ) : (
        <div className="grid">
          {items.map((item, idx) => (
            <ItemCard 
              key={idx} 
              item={item} 
              onClickApply={handleApplyClick} 
            />
          ))}
        </div>
      )}

      <ApplicationModal 
        isOpen={isModalOpen}
        item={selectedItem}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default Home;
