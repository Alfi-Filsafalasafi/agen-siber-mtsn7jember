/* Matching (R1) */
.match-col-title {
  font-family: var(--font-head);
  font-weight: 700;
  font-size: .8rem;
  text-transform: uppercase;
  letter-spacing: .8px;
  color: var(--muted);
  margin-bottom: .5rem;
}

.match-card {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 58px;
}
.match-card .mc-icon { font-size: 1.5rem; line-height: 1; }
.match-card small { color: var(--muted); font-weight: 600; }
.match-card.selected::after { float: none; margin-left: auto; }
.match-card.correct { cursor: default; }

@media (max-width: 576px) {
  .match-card { font-size: .88rem; padding: 10px; gap: 8px; }
  .match-card .mc-icon { font-size: 1.25rem; }
}