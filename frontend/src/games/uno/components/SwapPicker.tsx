import { AnimatePresence, motion } from "framer-motion";

interface SwapTarget {
  id: string;
  name: string;
  cardCount: number;
}

interface SwapPickerProps {
  open: boolean;
  targets: SwapTarget[];
  onSwap: (targetId: string) => void;
}

export function SwapPicker({ open, targets, onSwap }: SwapPickerProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="swap-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.80)",
            backdropFilter: "blur(8px)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.82, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 16 }}
            transition={{ type: "spring", stiffness: 360, damping: 26 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              background: "rgba(10,10,28,0.97)",
              borderRadius: 24,
              border: "1px solid rgba(34,211,238,0.25)",
              padding: "38px 44px",
              boxShadow:
                "0 0 56px rgba(34,211,238,0.12), 0 28px 70px rgba(0,0,0,0.85)",
              minWidth: 280,
            }}
          >
            {/* Icon badge */}
            <motion.div
              initial={{ rotate: -20, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.07 }}
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, rgba(34,211,238,0.18) 0%, rgba(139,92,246,0.18) 100%)",
                border: "2px solid rgba(34,211,238,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                boxShadow: "0 0 28px rgba(34,211,238,0.25)",
              }}
            >
              🔄
            </motion.div>

            {/* Header */}
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  color: "rgba(255,255,255,0.42)",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Seven Card Swap
              </div>
              <div style={{ color: "white", fontSize: 18, fontWeight: 900 }}>
                Choose who to swap hands with
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                width: "100%",
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
              }}
            />

            {/* Target list */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                width: "100%",
              }}
            >
              {targets.map((target, i) => (
                <motion.button
                  id={`swap-target-${target.id}`}
                  key={target.id}
                  type="button"
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.06 + i * 0.07,
                    type: "spring",
                    stiffness: 340,
                    damping: 22,
                  }}
                  onClick={() => onSwap(target.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1.5px solid rgba(255,255,255,0.09)",
                    background: "rgba(255,255,255,0.04)",
                    color: "white",
                    cursor: "pointer",
                    transition: "background 0.16s, border-color 0.16s, transform 0.16s",
                    textAlign: "left",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0,229,255,0.08)";
                    e.currentTarget.style.borderColor = "rgba(0,229,255,0.6)";
                    e.currentTarget.style.boxShadow = "0 0 20px rgba(0,229,255,0.3)";
                    e.currentTarget.style.transform = "scale(1.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {/* Name */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, rgba(34,211,238,0.25), rgba(139,92,246,0.25))",
                        border: "1px solid rgba(255,255,255,0.18)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 900,
                        color: "white",
                        flexShrink: 0,
                      }}
                    >
                      {target.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>
                      {target.name}
                    </span>
                  </div>

                  {/* Card count badge */}
                  <span
                    style={{
                      background: "rgba(255,255,255,0.10)",
                      borderRadius: 8,
                      padding: "4px 11px",
                      fontSize: 13,
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.65)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {target.cardCount} {target.cardCount === 1 ? "card" : "cards"}
                  </span>
                </motion.button>
              ))}
            </div>

            <div
              style={{
                color: "rgba(255,255,255,0.25)",
                fontSize: 11,
                fontWeight: 600,
                marginTop: -4,
              }}
            >
              No action? Your turn will auto-advance.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
