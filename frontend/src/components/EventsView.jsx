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

  const isAdmin = currentUser?.role === "admin" || currentUser?.isAdmin;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="responsive-page-header">
        <div>
          <div className="page-eyebrow"><Calendar size={14} /> Events</div>
          <h1>Campus Talks, Meets & Webinars</h1>
          <p>Connect with alumni during live webinars, technical workshops, and campus networking sessions.</p>
        </div>

        {isAdmin && (
          <button onClick={onOpenCreateEventModal} className="btn btn-primary">
            <Plus size={16} /> Organize Event
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="toolbar">
        <div className="toolbar__chips" role="group" aria-label="Timeframe">
          {[
            { id: "upcoming", label: "Upcoming" },
            { id: "past", label: "Past" },
            { id: "", label: "All" },
          ].map((tf) => (
            <button
              key={tf.id || "all"}
              onClick={() => setTimeframe(tf.id)}
              className={`chip${timeframe === tf.id ? " active" : ""}`}
              aria-pressed={timeframe === tf.id}
            >
              {tf.label}
            </button>
          ))}
        </div>

        <select
          className="select-control"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          aria-label="Event mode"
        >
          <option value="">All modes</option>
          <option value="online">Online webinar</option>
          <option value="offline">In-person on campus</option>
        </select>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="responsive-cards-grid" aria-busy="true" aria-label="Loading events">
          {[0, 1, 2].map((i) => <div key={i} className="glass-panel skeleton-card" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <Calendar size={40} />
          <h3>No events {timeframe === "past" ? "in the past" : timeframe === "upcoming" ? "coming up" : "yet"}</h3>
          <p>Check back later for alumni webinars and networking meets.</p>
        </div>
      ) : (
        <div className="responsive-cards-grid">
          {events.map((ev) => {
            const isOnline = ev.mode === "online";
            const dateObj = new Date(ev.eventDate);
            const isPast = dateObj < new Date();

            return (
              <article key={ev._id} className="glass-panel glass-panel-hover feed-card">
                <div className="feed-card__top" style={{ justifyContent: "flex-start", gap: "16px" }}>
                  <div className="date-tile" aria-hidden="true">
                    <span className="date-tile__month">{dateObj.toLocaleDateString(undefined, { month: "short" })}</span>
                    <span className="date-tile__day">{dateObj.getDate()}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span className={`badge ${isOnline ? "badge-emerald" : "badge-amber"}`} style={{ textTransform: "capitalize", marginBottom: "8px" }}>
                      {isOnline ? <Video size={12} /> : <MapPin size={12} />}
                      {isOnline ? "Online" : "On campus"}
                    </span>
                    <h3 className="feed-card__title">{ev.title}</h3>
                  </div>
                </div>

                <div className="meta-row">
                  <span>
                    <Calendar size={13} />
                    {dateObj.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span>
                    <Clock size={13} />
                    {dateObj.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>

                {ev.description && <p className="feed-card__desc">{ev.description}</p>}

                <div className="feed-card__footer">
                  <div className="byline">
                    <span>Organized by <strong style={{ display: "inline" }}>{ev.organizerId?.name || "College Administration"}</strong></span>
                  </div>

                  {isOnline && ev.link && !isPast ? (
                    <a href={ev.link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ width: "100%" }}>
                      <Video size={15} /> Join live session <ExternalLink size={13} />
                    </a>
                  ) : isOnline && ev.link ? (
                    <a href={ev.link} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ width: "100%" }}>
                      Open event link <ExternalLink size={13} />
                    </a>
                  ) : !isOnline ? (
                    <div className="inset" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", padding: "10px 12px" }}>
                      <MapPin size={14} color="var(--accent-amber)" /> Thapar Campus Auditorium
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
