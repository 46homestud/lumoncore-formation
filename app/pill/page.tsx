import ChromePill from "../chrome-pill/chrome-pill";

/**
 * Page de démonstration du composant ChromePill (validation du rendu avant intégration).
 * Section haute de 300vh pour tester le mode scrollDriven.
 */
export default function PillDemo() {
  return (
    <section style={{ height: "300vh", background: "#000", position: "relative" }}>
      {/* Le site principal bloque le scroll : on le réactive pour cette page de test */}
      <style>{"html { overflow: auto !important; height: auto !important; } body { overflow: visible !important; height: auto !important; }"}</style>
      <div style={{ position: "sticky", top: 0, height: "100vh" }}>
        <ChromePill scrollDriven />
      </div>
    </section>
  );
}
