import React from 'react';

const ItemCard = ({ item, onClickApply }) => {
  return (
    <div className="card">
      <div className="card-image-wrap">
        <img src={item.image || "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=500&q=80"} alt={item.name} className="card-image" />
      </div>
      <div className="card-content">
        <h3 className="card-title">{item.name}</h3>
        <p className="card-desc">{item.description}</p>
        
        <div className="card-meta">
          <span className="deadline-badge">
            기한: {item.deadline}
          </span>
          <span className="count-badge">
            신청 {item.count}건
          </span>
        </div>
        
        <button 
          className="btn"
          onClick={() => onClickApply(item)}
        >
          기자재 신청하기
        </button>
      </div>
    </div>
  );
};

export default ItemCard;
