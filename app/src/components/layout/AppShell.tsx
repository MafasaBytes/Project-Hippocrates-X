import { useState } from "react";
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <>
      <AppShell
        header={{ height: 56 }}
        navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !mobileOpened } }}
        padding="lg"
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Group>
              <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
              <Text fw={700} size="lg" ff="var(--mantine-font-family)">
                Hippocrates X
              </Text>
            </Group>
            <form onSubmit={handleSearch}>
              <TextInput
                placeholder="Search consultations..."
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

        <AppShell.Navbar p="sm">
          <AppShell.Section grow>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                label={item.label}
                leftSection={<item.icon size={18} stroke={1.5} />}
                active={
                  item.path === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.path)
                }
                onClick={() => {
                  navigate(item.path);
                  toggleMobile();
                }}
                variant="light"
                mb={2}
              />
            ))}
          </AppShell.Section>

          <AppShell.Section>
            <Divider mb="sm" />
            <Button
              fullWidth
              leftSection={<IconPlayerPlay size={18} />}
              onClick={() => setConsultModalOpen(true)}
            >
              Begin Consultation
            </Button>
          </AppShell.Section>
        </AppShell.Navbar>

        <AppShell.Main>
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
