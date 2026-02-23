import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppShell,
  Group,
  Text,
  NavLink,
  TextInput,
  Burger,
  Divider,
  Box,
  Button,
  Stack,
  ThemeIcon,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconLayoutDashboard,
  IconStethoscope,
  IconUsers,
  IconUserShield,
  IconSearch,
  IconPlayerPlay,
  IconBrain,
} from "@tabler/icons-react";
import { BeginConsultationModal } from "../consultation/BeginConsultationModal";

interface NavGroup {
  title: string;
  items: { label: string; path: string; icon: React.ElementType }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Clinical Operations",
    items: [
      { label: "Command Center", path: "/", icon: IconLayoutDashboard },
      { label: "Consultations", path: "/consultations", icon: IconStethoscope },
      { label: "Patients", path: "/patients", icon: IconUsers },
      { label: "Doctors", path: "/doctors", icon: IconUserShield },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "Search", path: "/search", icon: IconSearch },
    ],
  },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [consultModalOpen, setConsultModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

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

  const handleNavClick = (path: string) => {
    navigate(path);
    if (mobileOpened) toggleMobile();
  };

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <>
      <a
        href="#main-content"
        className="skip-link"
        style={{
          position: "absolute",
          left: "-9999px",
          zIndex: 9999,
          padding: "0.75rem 1rem",
          background: "var(--mantine-color-indigo-6)",
          color: "white",
          fontWeight: 600,
          borderRadius: "var(--mantine-radius-sm)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.left = "0.5rem";
          e.currentTarget.style.top = "0.5rem";
        }}
        onBlur={(e) => {
          e.currentTarget.style.left = "-9999px";
          e.currentTarget.style.top = "";
        }}
      >
        Skip to main content
      </a>
      <AppShell
        header={{ height: 56 }}
        navbar={{
          width: 260,
          breakpoint: "sm",
          collapsed: { mobile: !mobileOpened },
        }}
        padding="lg"
        aria-label="Main application shell"
        styles={{
          main: {
            backgroundColor: "var(--mantine-color-dark-8)",
            minHeight: "100vh",
          },
          header: {
            backgroundColor: "var(--mantine-color-dark-9)",
            borderBottom: "1px solid var(--mantine-color-dark-6)",
          },
          navbar: {
            backgroundColor: "var(--mantine-color-dark-9)",
            borderRight: "1px solid var(--mantine-color-dark-6)",
          },
        }}
      >
        <AppShell.Header role="banner">
          <Group h="100%" px="md" justify="space-between">
            <Group gap="sm">
              <Burger
                opened={mobileOpened}
                onClick={toggleMobile}
                hiddenFrom="sm"
                size="sm"
                aria-label="Toggle navigation menu"
              />
              <Group gap={6}>
                <ThemeIcon size="sm" variant="filled" color="indigo" radius="xl">
                  <IconBrain size={12} />
                </ThemeIcon>
                <Text fw={700} size="md" ff="var(--mantine-font-family)">
                  Hippocrates X
                </Text>
              </Group>
            </Group>
            <form onSubmit={handleSearch} role="search" aria-label="Global search">
              <TextInput
                placeholder="Search consultations..."
                aria-label="Search consultations and analyses"
                leftSection={<IconSearch size={16} />}
                value={searchValue}
                onChange={(e) => setSearchValue(e.currentTarget.value)}
                w={{ base: 200, sm: 320 }}
                size="sm"
                radius="md"
                styles={{
                  input: {
                    backgroundColor: "var(--mantine-color-dark-7)",
                    borderColor: "var(--mantine-color-dark-5)",
                  },
                }}
              />
            </form>
            <Box visibleFrom="sm" />
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="sm" role="navigation" aria-label="Main navigation">
          <AppShell.Section grow>
            <Stack gap="lg">
              {NAV_GROUPS.map((group) => (
                <div key={group.title}>
                  <Text
                    size="xs"
                    fw={600}
                    c="dimmed"
                    tt="uppercase"
                    mb={6}
                    px="sm"
                    style={{ letterSpacing: "0.06em" }}
                  >
                    {group.title}
                  </Text>
                  <Stack gap={2}>
                    {group.items.map((item) => (
                      <NavLink
                        key={item.path}
                        label={item.label}
                        leftSection={<item.icon size={18} stroke={1.5} />}
                        active={isActive(item.path)}
                        onClick={() => handleNavClick(item.path)}
                        variant="light"
                        aria-current={isActive(item.path) ? "page" : undefined}
                        styles={{
                          root: {
                            borderRadius: "var(--mantine-radius-md)",
                            transition: "all 0.15s ease",
                          },
                        }}
                      />
                    ))}
                  </Stack>
                </div>
              ))}
            </Stack>
          </AppShell.Section>

          <AppShell.Section>
            <Divider mb="sm" color="dark.6" />
            <Button
              fullWidth
              size="md"
              leftSection={<IconPlayerPlay size={18} />}
              onClick={() => setConsultModalOpen(true)}
              aria-label="Start a new consultation session"
              variant="gradient"
              gradient={{ from: "indigo.7", to: "clinical.7", deg: 135 }}
              radius="md"
              styles={{
                root: {
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                },
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 20px var(--mantine-color-indigo-9)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
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
