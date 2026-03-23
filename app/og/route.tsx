import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") || "GCInsight";
  const subtitle =
    searchParams.get("subtitle") || "ガバメントクラウド移行ダッシュボード";
  const rate = searchParams.get("rate"); // e.g. "0.65" or "65"
  const type = searchParams.get("type") || "default";

  // Parse rate for progress ring
  let rateValue: number | null = null;
  if (rate) {
    const parsed = parseFloat(rate);
    // Accept both 0.65 and 65 formats
    rateValue = parsed > 1 ? parsed : parsed * 100;
  }

  // Circular progress ring SVG data
  const ringSize = 140;
  const strokeWidth = 12;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = rateValue !== null ? (rateValue / 100) * circumference : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #002D72 0%, #001440 100%)",
          fontFamily: '"Noto Sans JP", sans-serif',
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            opacity: 0.05,
            background:
              "repeating-linear-gradient(45deg, transparent, transparent 40px, #fff 40px, #fff 42px)",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "60px 80px 0",
            flex: 1,
          }}
        >
          {/* Left: text */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: rateValue !== null ? "700px" : "1040px",
            }}
          >
            {/* Logo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "32px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #4A90E2, #7FB8E6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#fff",
                }}
              >
                G
              </div>
              <span
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "0.05em",
                }}
              >
                GCInsight
              </span>
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: title.length > 30 ? "36px" : "48px",
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.3,
                margin: 0,
              }}
            >
              {title}
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: "22px",
                color: "#7FB8E6",
                marginTop: "16px",
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </p>

            {/* Type badge */}
            {type !== "default" && (
              <div
                style={{
                  display: "flex",
                  marginTop: "24px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#002D72",
                    backgroundColor: "#7FB8E6",
                    padding: "6px 16px",
                    borderRadius: "20px",
                    letterSpacing: "0.02em",
                  }}
                >
                  {type === "cost"
                    ? "コスト分析"
                    : type === "risk"
                      ? "リスク分析"
                      : type === "prefecture"
                        ? "都道府県別"
                        : type === "article"
                          ? "記事"
                          : type}
                </span>
              </div>
            )}
          </div>

          {/* Right: progress ring */}
          {rateValue !== null && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                width: `${ringSize + 40}px`,
                height: `${ringSize + 40}px`,
                flexShrink: 0,
              }}
            >
              <svg
                width={ringSize + 40}
                height={ringSize + 40}
                viewBox={`0 0 ${ringSize + 40} ${ringSize + 40}`}
              >
                {/* Background circle */}
                <circle
                  cx={(ringSize + 40) / 2}
                  cy={(ringSize + 40) / 2}
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                  cx={(ringSize + 40) / 2}
                  cy={(ringSize + 40) / 2}
                  r={radius}
                  fill="none"
                  stroke={
                    rateValue >= 75
                      ? "#4ADE80"
                      : rateValue >= 50
                        ? "#FACC15"
                        : "#F87171"
                  }
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={`${progress} ${circumference - progress}`}
                  strokeDashoffset={circumference * 0.25}
                  transform={`rotate(-90 ${(ringSize + 40) / 2} ${(ringSize + 40) / 2})`}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "36px",
                    fontWeight: 800,
                    color: "#ffffff",
                  }}
                >
                  {rateValue.toFixed(1)}%
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#7FB8E6",
                    marginTop: "2px",
                  }}
                >
                  進捗率
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 80px",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          <span
            style={{
              fontSize: "16px",
              color: "#7FB8E6",
              fontWeight: 500,
            }}
          >
            gcinsight.jp
          </span>
          <span
            style={{
              fontSize: "14px",
              color: "rgba(127,184,230,0.6)",
            }}
          >
            全国1,741自治体のガバメントクラウド移行進捗を可視化
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
