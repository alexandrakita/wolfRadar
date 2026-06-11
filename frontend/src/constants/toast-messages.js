/** Central toast copy — same pattern as dashboard.bidmanager locales.toast */

export const TOAST = {
  savedSuccessfully: "Saved successfully",
  deletedSuccessfully: "Deleted successfully",
  createdSuccessfully: "Created successfully",
  updatedSuccessfully: "Updated successfully",
  errorOccurred: "Something went wrong. Please try again.",

  dashboardCreated: "Dashboard created",
  dashboardRenamed: "Dashboard renamed",
  dashboardDeleted: (name) => `"${name}" deleted`,
  dashboardSwitched: (name) => `Switched to ${name}`,
  dashboardLimitReached: "You can create up to 3 dashboards",
  widgetAdded: (name) => `${name} added to dashboard`,
  widgetRemoved: "Widget removed",
  layoutSaved: "Dashboard layout saved",

  watchlistAdded: (sym) => `${sym} added to watchlist`,
  watchlistRemoved: (sym) => `${sym} removed from watchlist`,

  holdingAdded: (sym) => `${sym} added to portfolio`,
  holdingUpdated: (sym) => `${sym} holding updated`,
  holdingRemoved: (sym) => `${sym} removed from portfolio`,

  tickerUpdated: (sym) => `Now tracking ${sym}`,

  alertEnabled: "Alert enabled",
  alertDisabled: "Alert disabled",
};
