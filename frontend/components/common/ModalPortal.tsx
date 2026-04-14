import React from 'react';
import ReactDOM from 'react-dom';

/**
 * 将弹窗/抽屉渲染到 #modal-root（body 直接子节点），
 * 脱离 Layout 的 backdrop-blur 堆叠上下文，保证遮罩覆盖整个视口。
 */
const ModalPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const el = document.getElementById('modal-root');
  if (!el) return <>{children}</>;
  return ReactDOM.createPortal(children, el);
};

export default ModalPortal;
