import React from "react";
import "./SlidePanel.css";

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function SlidePanel({ open, onClose, children }: Props) {
  return (
    <>
      <div
        className={`slide-panel-overlay ${open ? "open" : ""}`}
        onClick={onClose}
      />

      <div className={`slide-panel ${open ? "open" : ""}`}>
        {children}
      </div>
    </>
  );
}
