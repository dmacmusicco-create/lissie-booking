export default function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-6 mb-6 text-sm">
      <div className="flex items-center gap-2">
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #166534, #15803d)',
            border: '1px solid rgba(74,222,128,0.4)',
          }}
        />
        <span style={{ color: '#a0a8c0' }}>Available — click to request</span>
      </div>
      <div className="flex items-center gap-2">
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
            border: '1px solid rgba(248,113,113,0.3)',
          }}
        />
        <span style={{ color: '#a0a8c0' }}>Booked — not available</span>
      </div>
      <div className="flex items-center gap-2">
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        />
        <span style={{ color: '#a0a8c0' }}>Past date</span>
      </div>
    </div>
  );
}
