import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  ExternalLink,
  Plus,
} from "lucide-react";

export const EventsView = ({ currentUser, onOpenCreateEventModal }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState("upcoming");
  const [mode, setMode] = useState("");

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.getEvents({
        timeframe: timeframe || undefined,
        mode: mode || undefined,
      });
      setEvents(res.data || []);
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [timeframe, mode]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="responsive-page-header">
        <div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 800 }}>Campus Talks, Meets & Webinars</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Connect with alumni during live webinars, technical workshops, and campus networking sessions.
          </p>
        </div>

        {currentUser?.role === "admin" && (
          <button onClick={onOpenCreateEventModal} className="btn btn-primary">
            <Plus size={16} /> Organize Event
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "28px", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {["upcoming", "past", ""].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                padding: "7px 16px",
                borderRadius: "var(--radius-sm)",
                border: timeframe === tf ? "1px solid var(--accent-primary)" : "1px solid var(--border-color)",
                background: timeframe === tf ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.04)",
                color: timeframe === tf ? "#fff" : "var(--text-muted)",
                fontFamily: "var(--font-heading)",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {tf ? `${tf} Events` : "All Time"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <select
            className="select-control"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            style={{ width: "160px", padding: "6px 12px", fontSize: "0.85rem" }}
          >
            <option value="">All Modes</option>
            <option value="online">Online Webinar</option>
            <option value="offline">In-Person Campus</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          Loading events...
        </div>
      ) : events.length === 0 ? (
        <div className="glass-panel" style={{ padding: "50px", textAlign: "center" }}>
          <Calendar size={48} style={{ color: "var(--text-subtle)", marginBottom: "16px" }} />
          <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>No Events Scheduled</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Check back later for upcoming alumni webinars and networking meets.
          </p>
        </div>
      ) : (
        <div className="responsive-cards-grid">
          {events.map((ev) => {
            const isOnline = ev.mode === "online";
            const dateObj = new Date(ev.eventDate);

            return (
              <div key={ev._id} className="glass-panel glass-panel-hover" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <span className={`badge ${isOnline ? "badge-emerald" : "badge-amber"}`}>
                      {isOnline ? <Video size={12} /> : <MapPin size={12} />}
                      {ev.mode}
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "var(--accent-amber)", fontWeight: 600 }}>
                      <Calendar size={14} />
                      {dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>

                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px", lineHeight: 1.3 }}>
                    {ev.title}
                  </h3>

                  {ev.description && (
                    <p style={{
                      fontSize: "0.88rem",
                      color: "var(--text-muted)",
                      lineHeight: 1.5,
                      marginBottom: "18px",
                    }}>
                      {ev.description}
                    </p>
                  )}
                </div>

                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-subtle)", marginBottom: "12px" }}>
                    Organized by: <strong style={{ color: "var(--text-main)" }}>{ev.organizerId?.name || "College Administration"}</strong>
                  </div>

                  {isOnline && ev.link ? (
                    <a
                      href={ev.link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ width: "100%" }}
                    >
                      <Video size={15} /> Join Live Session <ExternalLink size={13} />
                    </a>
                  ) : (
                    <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)", padding: "6px 0" }}>
                      Venue: Thapar Campus Auditorium
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
