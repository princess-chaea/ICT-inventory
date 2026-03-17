import React, { useState } from 'react';

const ApplicationModal = ({ isOpen, onClose, item, onSubmit }) => {
  const [formData, setFormData] = useState({
    grade: '',
    classNum: '',
    teacherName: '',
    quantity: 1,
    note: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !item) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit({ ...formData, itemName: item.name });
      setFormData({ grade: '', classNum: '', teacherName: '', quantity: 1, note: '' }); // 리셋
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{item.name} 신청하기</h2>
          <button className="modal-close" onClick={onClose} aria-label="닫기">
            &times;
          </button>
        </div>
        
        <div className="modal-body">
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
            아래 필수 정보를 입력 후 신청서를 제출해주세요.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-col form-group">
                <label className="form-label" htmlFor="grade">학년/구분 *</label>
                <select 
                  id="grade" 
                  name="grade" 
                  className="form-control" 
                  value={formData.grade}
                  onChange={handleChange}
                  required
                >
                  <option value="">선택하세요</option>
                  <option value="1학년">1학년</option>
                  <option value="2학년">2학년</option>
                  <option value="3학년">3학년</option>
                  <option value="4학년">4학년</option>
                  <option value="5학년">5학년</option>
                  <option value="6학년">6학년</option>
                  <option value="전담">전담</option>
                  <option value="특수/기타">특수/기타</option>
                </select>
              </div>
              
              <div className="form-col form-group">
                <label className="form-label" htmlFor="classNum">반/실이름 *</label>
                <input 
                  type="text" 
                  id="classNum" 
                  name="classNum" 
                  className="form-control" 
                  placeholder="예: 3반, 과학실" 
                  value={formData.classNum}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="teacherName">신청교사명 *</label>
              <input 
                type="text" 
                id="teacherName" 
                name="teacherName" 
                className="form-control" 
                placeholder="이름을 입력하세요" 
                value={formData.teacherName}
                onChange={handleChange}
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="quantity">신청수량 *</label>
              <input 
                type="number" 
                id="quantity" 
                name="quantity" 
                className="form-control" 
                min="1"
                max="100"
                value={formData.quantity}
                onChange={handleChange}
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="note">비고 (선택)</label>
              <textarea 
                id="note" 
                name="note" 
                className="form-control" 
                placeholder="추가 요청사항이나 사유를 적어주세요"
                value={formData.note}
                onChange={handleChange}
              ></textarea>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
                disabled={isSubmitting}
                style={{ width: 'auto' }}
              >
                취소
              </button>
              <button 
                type="submit" 
                className="btn" 
                disabled={isSubmitting}
                style={{ width: 'auto', minWidth: '120px' }}
              >
                {isSubmitting ? (
                  <><span className="spinner"></span> 제출 중...</>
                ) : '신청 완료'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicationModal;
