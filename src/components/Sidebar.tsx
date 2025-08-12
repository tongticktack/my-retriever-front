import Image from "next/image";
import NavButton from "./NavButton";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const menuItems = [
    { href: "/", icon: "/chatIcon.svg", label: "Chat" },
    { href: "/map", icon: "/mapIcon.svg", label: "Map" },
    { href: "/search", icon: "/searchIcon.svg", label: "Search" },
    { href: "/my", icon: "/myPageIcon.svg", label: "My" },
  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>
        <Image
          src="/myRetrieverlogo.svg"
          alt="My Retriever Logo"
          width={160}
          height={54}
          priority
        />
      </div>

      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <NavButton
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </nav>
    </div>
  );
}
