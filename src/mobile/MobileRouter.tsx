{isEmployee && (
  <Route
    path="today"
    element={
      <MobileTodayViewEmployee
        stationName={stationName}
        onOpenMonth={onOpenMonth}
      />
    }
  />
)}

{isEmployee && (
  <Route
    path="month"
    element={
      <MobileMonthViewEmployee />
    }
  />
)}
