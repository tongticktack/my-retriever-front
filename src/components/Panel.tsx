import { ReactNode, HTMLAttributes } from 'react';
import styles from './Panel.module.css';

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  noPadding?: boolean;
  scrollY?: boolean;
}

export default function Panel({ children, className = '', noPadding, scrollY, ...rest }: PanelProps) {
  const classes = [styles.panel];
  if (noPadding) classes.push(styles.noPadding);
  if (scrollY) classes.push(styles.scrollY);
  if (className) classes.push(className);

  return (
    <div className={classes.join(' ')} {...rest}>
      {children}
    </div>
  );
}
