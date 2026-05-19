import NewEntryForm from "./new-entry-form";

export default function NewEntryPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Nuevo registro</h2>
        <p className="text-pulso-soft text-sm">Subí un audio o video corto.</p>
      </div>
      <NewEntryForm />
    </div>
  );
}
