import {
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  createTheme,
  styled,
} from "@suid/material";
import { DrawerProps } from "@suid/material/Drawer";
import {
  ListItemTab,
  TabMap,
  TheftData,
  TheftDataEntry,
  UnionTabs,
} from "../../types";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { useAtom } from "solid-jotai";
import apiUrlAtom from "../../state";
import {
  ChevronLeftRounded,
  QueueMusicRounded,
  SearchRounded,
} from "@suid/icons-material";

import "./style.css";
import { drawerWidth, smallSizeWidth } from ".";

type Anchor = NonNullable<DrawerProps["anchor"]>;

export const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

export default function TemporaryDrawer(props: {
  tabs: TabMap;
  onTabSelect: (title: string) => void;
  onTheftData: (data: TheftDataEntry) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  key: string | number;
}) {
  const allTagsTag = "all tabs";
  const open = () => props.open;
  const originTabs: ListItemTab[] = Object.entries(props.tabs).map(
    ([key, value]) => {
      let tags = [allTagsTag];
      if (Array.isArray(value.tag)) {
        tags = [...tags, ...value.tag];
      } else if (value.tag) {
        tags = [value.tag, ...tags];
      }
      return {
        ...value,
        key: key,
        tags: tags,
        selected: value.tag ? false : true,
      };
    }
  );

  const [theftData, setTheftData] = createSignal<TheftData>([]);
  const [theftEnabled, setTheftEnabled] = createSignal(false);
  const [selectedTab, setSelectedTab] = createSignal<UnionTabs>();
  const [searchTerm, setSearchTerm] = createSignal("");
  const [smallSize, setSmallSize] = createSignal(
    window.innerWidth < smallSizeWidth
  );
  const apiURL = useAtom(apiUrlAtom)[0];

  createEffect(() => {
    const handleResize = () => {
      setSmallSize(window.innerWidth < smallSizeWidth);
    };

    window.addEventListener("resize", handleResize);

    onCleanup(() => {
      window.removeEventListener("resize", handleResize);
    });
  });

  createEffect(async () => {
    const response = await fetch(apiURL() + "/list");
    const data = (await response.json()) as TheftData;
    setTheftData(data);
  });

  // get all tags in tabs and delete dup tags
  const allTags = originTabs
    .map((tab) => tab.tags)
    .reduce((prev, curr) => prev.concat(curr))
    .filter((tag, index, self) => self.indexOf(tag) === index);

  let [selectedTags, setSelectedTags] = createSignal([allTagsTag]);

  let filteredTabs = () =>
    originTabs.filter(
      (tab) =>
        tab.tags.some((tag) => selectedTags().includes(tag)) &&
        tab.name
          .toLowerCase()
          .replace(" ", "")
          .includes(searchTerm().toLowerCase().replace(" ", ""))
    );

  let filteredTheftData = () =>
    theftData().filter(
      (data) =>
        data.name
          .toLowerCase()
          .replace(" ", "")
          .includes(searchTerm().toLowerCase().replace(" ", "")) ||
        (data.meta?.name ?? "")
          .toLowerCase()
          .replace(" ", "")
          .includes(searchTerm().toLowerCase().replace(" ", "")) ||
        (data.meta?.url ?? "")
          .toLowerCase()
          .replace(" ", "")
          .includes(searchTerm().toLowerCase().replace(" ", ""))
    );

  const list = (anchor: Anchor) => (
    <Box
      sx={{
        width: anchor === "top" || anchor === "bottom" ? "auto" : drawerWidth,
      }}
      role="presentation"
    >
      <List disablePadding>
        {/* tab list */}
        {filteredTabs().length === 0 && searchTerm().length > 0 && (
          <ListItem>
            <Typography
              variant="h5"
              color="textSecondary"
              sx={{
                display: "block",
                width: "100%",
                textAlign: "center",
                py: 8,
              }}
            >
              No result found
            </Typography>
          </ListItem>
        )}
        {filteredTabs().map((tab) => (
          <ListItem disablePadding>
            <ListItemButton
              selected={
                selectedTab() &&
                selectedTab().type === "preset" &&
                selectedTab().data === tab
              }
              onClick={() => {
                setSelectedTab({ type: "preset", data: tab });
                props.onTabSelect(tab.key);
                smallSize() && props.setOpen(false);
              }}
            >
              <ListItemIcon sx={{ mr: -2 }}>
                <QueueMusicRounded />
              </ListItemIcon>
              <ListItemText primary={tab["name"]} />
            </ListItemButton>
          </ListItem>
        ))}
        {(theftEnabled() || selectedTags().includes(allTagsTag)) &&
          filteredTheftData().map((data) => (
            <ListItem disablePadding>
              <ListItemButton
                selected={
                  selectedTab() &&
                  selectedTab().type === "theft" &&
                  selectedTab().data === data
                }
                onClick={() => {
                  setSelectedTab({ type: "theft", data: data });
                  props.onTheftData(data);
                  smallSize() && props.setOpen(false);
                }}
              >
                <ListItemIcon sx={{ mr: -2 }}>
                  <QueueMusicRounded />
                </ListItemIcon>
                <ListItemText primary={data["name"]} />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
      <Typography
        variant="caption"
        sx={{ display: "block", width: "100%", textAlign: "center", py: 2 }}
      >
        <p>Made with 😈 by IO Club</p>
        <p>
          Github:{" "}
          <Link href="https://github.com/io-club/GuiTabs" target="_blank">
            GuiTabs
          </Link>
          &nbsp;
          <Link href="https://github.com/io-club/GuiTabsThief" target="_blank">
            GuiTabsThief
          </Link>
        </p>
      </Typography>
    </Box>
  );
  const anchor: Anchor = "left";
  return (
    <Drawer
      ModalProps={{
        onBackdropClick: () => {
          props.setOpen(false);
        },
      }}
      variant={!smallSize() ? "persistent" : "temporary"}
      anchor={anchor}
      open={open()}
      sx={{ zIndex: 9999 }}
    >
      <Box
        backgroundColor={createTheme().palette.background.paper}
        style={{ position: "sticky", top: 0, "z-index": 9999 }}
      >
        <DrawerHeader sx={{ width: "var(--drawer-width)", gap: "8px" }}>
          <Box class="SearchBox">
            <SearchRounded class="WoW" fontSize="small" />
            <input
              type="search"
              onInput={(e) => setSearchTerm(e.currentTarget.value)}
              class="Search"
              placeholder="Search"
              autocomplete="on"
            />
          </Box>
          <IconButton
            size="small"
            onClick={() => {
              props.setOpen(false);
            }}
          >
            <ChevronLeftRounded />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <Box class="TagsBox">
          {/* tags */}
          {allTags.map((v) => (
            <Chip
              onClick={() => {
                const checked = !selectedTags().includes(v);
                if (v === allTagsTag) {
                  setSelectedTags([allTagsTag]);
                  setTheftEnabled(false);
                  return;
                }
                if (checked) {
                  setSelectedTags([
                    v,
                    ...selectedTags().filter((tag) => tag !== allTagsTag),
                  ]);
                } else {
                  const currenTags = selectedTags();
                  currenTags.splice(currenTags.indexOf(v), 1);
                  setSelectedTags([...currenTags]);
                }
                if (selectedTags().length === 0 && !theftEnabled()) {
                  setSelectedTags([allTagsTag]);
                }
              }}
              color={selectedTags().includes(v) ? "primary" : "default"}
              label={v}
            />
          ))}
          <Chip
            onClick={() => {
              if (!theftEnabled()) {
                setSelectedTags(
                  selectedTags().filter((tag) => tag !== allTagsTag)
                );
              }
              setTheftEnabled(!theftEnabled());
              if (selectedTags().length === 0 && !theftEnabled()) {
                setSelectedTags([allTagsTag]);
              }
            }}
            color={theftEnabled() ? "primary" : "default"}
            label="theft"
          />
        </Box>
        <Divider />
      </Box>
      {list(anchor)}
    </Drawer>
  );
}
