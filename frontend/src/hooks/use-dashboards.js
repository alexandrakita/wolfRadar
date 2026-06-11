"use client";

import { useCallback, useEffect, useState } from "react";

import {
  genDashboardId,
  genWidgetId,
  MAX_DASHBOARDS,
  WIDGET_CATALOG,
} from "@/constants/dashboard";
import { localStorageService, STORAGE_KEYS, SYNC_EVENTS } from "@/services/localStorage";

const EMPTY_DASHBOARDS_STATE = { version: 1, activeId: null, dashboards: [] };

function readState() {
  return localStorageService.getDashboardsState();
}

export function useDashboards() {
  const [state, setState] = useState(EMPTY_DASHBOARDS_STATE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(readState());
    setReady(true);

    const sync = () => setState(readState());
    const onStorage = (e) => {
      if (e.key === STORAGE_KEYS.DASHBOARDS) sync();
    };
    window.addEventListener(SYNC_EVENTS.DASHBOARDS, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SYNC_EVENTS.DASHBOARDS, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const persist = useCallback((next) => {
    localStorageService.setDashboardsState(next);
    setState(next);
  }, []);

  const activeDashboard =
    state.dashboards.find((d) => d.id === state.activeId) ?? null;

  const createDashboard = useCallback(
    (name) => {
      if (state.dashboards.length >= MAX_DASHBOARDS) return null;
      const id = genDashboardId();
      const n = name?.trim() || `Dashboard ${state.dashboards.length + 1}`;
      const next = {
        version: 1,
        activeId: id,
        dashboards: [...state.dashboards, { id, name: n, widgets: [] }],
      };
      persist(next);
      return id;
    },
    [persist, state.dashboards],
  );

  const deleteDashboard = useCallback(
    (id) => {
      const dashboards = state.dashboards.filter((d) => d.id !== id);
      const activeId =
        state.activeId === id ? dashboards[0]?.id ?? null : state.activeId;
      persist({ version: 1, activeId, dashboards });
    },
    [persist, state.activeId, state.dashboards],
  );

  const renameDashboard = useCallback(
    (id, name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      persist({
        ...state,
        dashboards: state.dashboards.map((d) =>
          d.id === id ? { ...d, name: trimmed } : d,
        ),
      });
    },
    [persist, state],
  );

  const setActiveDashboard = useCallback(
    (id) => {
      if (!state.dashboards.some((d) => d.id === id)) return;
      persist({ ...state, activeId: id });
    },
    [persist, state],
  );

  const addWidget = useCallback(
    (dashboardId, type, config = {}) => {
      const meta = WIDGET_CATALOG[type];
      if (!meta) return;
      persist({
        ...state,
        dashboards: state.dashboards.map((d) => {
          if (d.id !== dashboardId) return d;
          const widget = {
            id: genWidgetId(),
            type,
            size: meta.defaultSize,
            config,
          };
          return { ...d, widgets: [...d.widgets, widget] };
        }),
      });
    },
    [persist, state],
  );

  const removeWidget = useCallback(
    (dashboardId, widgetId) => {
      persist({
        ...state,
        dashboards: state.dashboards.map((d) =>
          d.id === dashboardId
            ? { ...d, widgets: d.widgets.filter((w) => w.id !== widgetId) }
            : d,
        ),
      });
    },
    [persist, state],
  );

  const updateWidget = useCallback(
    (dashboardId, widgetId, patch) => {
      persist({
        ...state,
        dashboards: state.dashboards.map((d) =>
          d.id === dashboardId
            ? {
                ...d,
                widgets: d.widgets.map((w) =>
                  w.id === widgetId ? { ...w, ...patch } : w,
                ),
              }
            : d,
        ),
      });
    },
    [persist, state],
  );

  const reorderWidgets = useCallback(
    (dashboardId, fromIndex, toIndex) => {
      persist({
        ...state,
        dashboards: state.dashboards.map((d) => {
          if (d.id !== dashboardId) return d;
          const next = [...d.widgets];
          const [moved] = next.splice(fromIndex, 1);
          if (!moved) return d;
          next.splice(toIndex, 0, moved);
          return { ...d, widgets: next };
        }),
      });
    },
    [persist, state],
  );

  return {
    state,
    activeDashboard,
    ready,
    canCreateDashboard: state.dashboards.length < MAX_DASHBOARDS,
    createDashboard,
    deleteDashboard,
    renameDashboard,
    setActiveDashboard,
    addWidget,
    removeWidget,
    updateWidget,
    reorderWidgets,
  };
}
