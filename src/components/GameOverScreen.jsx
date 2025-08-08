export function GameOverScreen({ onRestart }) {
    return (
        <div
            style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "#000",
                color: "#0f0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                fontFamily: "monospace",
                fontSize: "32px",
                textShadow: "0 0 5px #0f0",
                animation: "flicker 1s infinite",
            }}
        >
            <div>💀 GAME OVER 💀</div>
            <button
                onClick={onRestart}
                style={{
                    marginTop: "20px",
                    background: "none",
                    border: "1px solid #0f0",
                    color: "#0f0",
                    padding: "10px 20px",
                    cursor: "pointer",
                    fontFamily: "monospace",
                }}
            >
                Retry
            </button>

            <style>{`
        @keyframes flicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
            opacity: 1;
          }
          20%, 24%, 55% {
            opacity: 0;
          }
        }
      `}</style>
        </div>
    );
}
