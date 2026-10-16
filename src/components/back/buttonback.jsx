export default function Volver({ onClick, titulo = 'Volver' }) {
  return (
    <button
      type="button"
      className="btn-volver"
      onClick={onClick}
      title={titulo}
    >
      <span className="material-symbols-outlined">
        arrow_back
      </span>
    </button>
  )
}