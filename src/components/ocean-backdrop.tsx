/** Fixed decorative backdrop behind the whole app: photo, light rays, grain and rising bubbles. */
export function OceanBackdrop() {
  return <div className="ocean-atmosphere" aria-hidden="true"><div className="ocean-backplate" /><div className="ocean-sunlight" /><div className="ocean-grain" /><div className="ocean-bubbles">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ left: (6 + i * 11) + "%", animationDelay: (i * -2.3) + "s", animationDuration: (19 + i * 2) + "s" }} />)}</div></div>;
}
