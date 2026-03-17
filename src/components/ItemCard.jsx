import React from 'react';

const ItemCard = ({ item, onClickApply }) => {
  const [imgLoaded, setImgLoaded] = React.useState(false);

  return (
    <div className="card fade-in">
      <div className="card-image-wrap">
        {!imgLoaded && <div className="skeleton" style={{ width: '100%', height: '100%' }}></div>}
        <img 
          src={item.image || "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=500&q=80"} 
          alt={item.name} 
          className="card-image" 
          style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
          onLoad={() => setImgLoaded(true)}
        />
      </div>
      <div className="card-content">
        <h3 className="card-title">{item.name}</h3>
        <p className="card-desc" style={{ whiteSpace: 'pre-wrap' }}>{item.description}</p>
        
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
