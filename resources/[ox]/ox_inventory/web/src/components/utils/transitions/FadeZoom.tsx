import React, { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';

interface Props {
  in?: boolean;
  children: React.ReactNode;
}

const FadeZoom: React.FC<Props> = (props) => {
  const nodeRef = useRef(null);

  return (
    <CSSTransition in={props.in} nodeRef={nodeRef} classNames="transition-fadezoom" timeout={200} unmountOnExit>
      <span ref={nodeRef}>{props.children}</span>
    </CSSTransition>
  );
};

export default FadeZoom;
