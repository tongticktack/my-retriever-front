import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import styles from "./NavButton.module.css";

interface NavButtonProps {
  href: string;
  icon: string;
  label: string;
}

export default function NavButton({ href, icon, label }: NavButtonProps) {
  const router = useRouter();
  const isActive = router.pathname === href;

  return (
    <Link
      href={href}
      className={`${styles.navButton} ${isActive ? styles.active : ""}`}
    >
      <div className={styles.menuContent}>
        <Image
          src={icon}
          alt={label}
          width={24}
          height={24}
          className={styles.icon}
        />
        <span className={styles.label}>{label}</span>
      </div>
    </Link>
  );
}
