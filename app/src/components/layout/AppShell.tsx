import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppShell,
  Group,
  Text,
  NavLink,
  TextInput,
  ActionIcon,
  Burger,
  Divider,
  Box,
  Button,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconLayoutDashboard,
  IconStethoscope,
  IconUsers,
  IconSearch,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { BeginConsultationModal } from "../consultation/BeginConsultationModal";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: IconLayoutDashboard },
  { label: "Consultations", path: "/consultations", icon: IconStethoscope },
  { label: "Patients", path: "/patients", icon: IconUsers },
  { label: "Search", path: "/search", icon: IconSearch },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [consultModalOpen, setConsultModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [activeSidebarItem, setActiveSidebarItem] = useState(0);

  // Handle focus management for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && consultModalOpen) {
        setConsultModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [consultModalOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const handleNavClick = (index: number, path: string) => {
    setActiveSidebarItem(index);
    navigate(path);
    if (mobileOpened) {
      toggleMobile();
    }
  };

  return (
    <>
      <AppShell
        header={{ height: 56 }}
        navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !mobileOpened } }}
        padding="lg"
        aria-label="Main application shell"
      >
        <AppShell.Header role="banner">
          <Group h="100%" px="md" justify="space-between">
            <Group>
              <Burger
                opened={mobileOpened}
                onClick={toggleMobile}
                hiddenFrom="sm"
                size="sm"
                aria-label="Toggle navigation menu"
              />
              <Text fw={700} size="lg" ff="var(--mantine-font-family)">
                Hippocrates X
              </Text>
            </Group>
            <form onSubmit={handleSearch} role="search" aria-label="Global search">
              <TextInput
                placeholder="Search consultations..."
                aria-label="Search consultations and analyses"
                leftSection={<IconSearch size={16} />}
                value={searchValue}
                onChange={(e) => setSearchValue(e.currentTarget.value)}
                w={320}
                size="sm"
              />
            </form>
            <Box />
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="sm" role="navigation" aria-label="Main navigation">
          <AppShell.Section grow>
            {NAV_ITEMS.map((item, index) => (
              <NavLink
                key={item.path}
                label={item.label}
                leftSection={<item.icon size={18} stroke={1.5} />}
                active={
                  item.path === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.path)
                }
                onClick={() => handleNavClick(index, item.path)}
                variant="light"
                mb={2}
                aria-current={location.pathname === item.path ? "page" : undefined}
              />
            ))}
          </AppShell.Section>

          <AppShell.Section>
            <Divider mb="sm" />
            <Button
              fullWidth
              leftSection={<IconPlayerPlay size={18} />}
              onClick={() => setConsultModalOpen(true)}
              aria-label="Start a new consultation session"
            >
              Begin Consultation
            </Button>
          </AppShell.Section>
        </AppShell.Navbar>

        <AppShell.Main id="main-content" role="main">
          <Outlet />
        </AppShell.Main>
      </AppShell>

      <BeginConsultationModal
        opened={consultModalOpen}
        onClose={() => setConsultModalOpen(false)}
      />
    </>
  );
}
