import { ImageResponse } from 'next/og';
import { siteConfig } from '@/config/site';

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Plain, brand-neutral card. Replace colors and layout with brand tokens per project.
export default function OpengraphImage(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 80,
        background: '#f7f7f6',
        color: '#1c1c1a',
      }}
    >
      <div style={{ fontSize: 72, fontWeight: 600 }}>{siteConfig.name}</div>
      <div style={{ fontSize: 32, color: '#5c5c58', marginTop: 16 }}>{siteConfig.description}</div>
    </div>,
    size,
  );
}
