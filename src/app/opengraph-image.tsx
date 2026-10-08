import { ImageResponse } from "next/og";

export const alt = "Bioliz Global Sport";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0d0d0f",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "600px",
            height: "600px",
            background:
              "radial-gradient(circle at 70% 30%, rgba(255,90,31,0.25), transparent 50%)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#ff5a1f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0d0d0f"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 5v14" />
              <path d="M18 5v14" />
              <path d="M2 12h20" />
            </svg>
          </div>
          <span
            style={{
              fontSize: "42px",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              fontFamily: "Geist, Arial, sans-serif",
            }}
          >
            Bioliz<span style={{ color: "#ff5a1f" }}>.</span>
          </span>
        </div>
        <h1
          style={{
            fontSize: "72px",
            fontWeight: 900,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
            textTransform: "uppercase",
            fontFamily: "Geist, Arial, sans-serif",
          }}
        >
          Build your space.
          <br />
          <span style={{ color: "#ff5a1f" }}>Train harder.</span>
        </h1>
        <p
          style={{
            fontSize: "26px",
            color: "#a1a1aa",
            marginTop: "32px",
            textAlign: "center",
            maxWidth: "800px",
            fontFamily: "Geist, Arial, sans-serif",
          }}
        >
          Premium gym & sports equipment in Nigeria
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
