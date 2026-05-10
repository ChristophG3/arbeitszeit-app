import { Entry } from "@/types";

type Props = {
  entries: Entry[];
  editEntry: (entry: Entry) => void;
  deleteEntry: (id: string) => void;
};

export default function EntriesTable({
  entries,
  editEntry,
  deleteEntry,
}: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">
          Einträge
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Übersicht aller Arbeitszeiten
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="p-10 text-center text-gray-500">
          Keine Einträge vorhanden
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">
                  Datum
                </th>

                <th className="text-left px-4 py-3 font-medium">
                  Status
                </th>

                <th className="text-left px-4 py-3 font-medium">
                  Zeit
                </th>

                <th className="text-left px-4 py-3 font-medium">
                  Pause
                </th>

                <th className="text-left px-4 py-3 font-medium">
                  Ist
                </th>

                <th className="text-left px-4 py-3 font-medium">
                  Überstunden
                </th>

                <th className="text-left px-4 py-3 font-medium">
                  Notiz
                </th>

                <th className="text-right px-4 py-3 font-medium">
                  Aktionen
                </th>
              </tr>
            </thead>

            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    {entry.date}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {entry.status}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {entry.start_time && entry.end_time
                      ? `${entry.start_time} - ${entry.end_time}`
                      : "-"}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {entry.break_minutes ?? 0} min
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap font-medium">
                    {((entry.actual_minutes ?? 0) / 60).toFixed(1)} h
                  </td>

                  <td
                    className={`px-4 py-3 whitespace-nowrap font-medium ${
                      (entry.overtime_minutes ?? 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {((entry.overtime_minutes ?? 0) / 60).toFixed(1)} h
                  </td>

                  <td className="px-4 py-3 max-w-xs truncate text-gray-600">
                    {entry.note || "-"}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => editEntry(entry)}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
                      >
                        Bearbeiten
                      </button>

                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-sm"
                      >
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}