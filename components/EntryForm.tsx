type Props = {
  date: string;
  setDate: (value: string) => void;

  status: string;
  setStatus: (value: string) => void;

  startTime: string;
  setStartTime: (value: string) => void;

  endTime: string;
  setEndTime: (value: string) => void;

  breakMinutes: number;
  setBreakMinutes: (value: number) => void;

  note: string;
  setNote: (value: string) => void;

  editingId: string | null;

  saveEntry: () => void;
};

export default function EntryForm({
  date,
  setDate,
  status,
  setStatus,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  breakMinutes,
  setBreakMinutes,
  note,
  setNote,
  editingId,
  saveEntry,
}: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {editingId
              ? "Eintrag bearbeiten"
              : "Arbeitszeit erfassen"}
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Zeiten und Abwesenheiten verwalten
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Datum
          </label>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Status
          </label>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white"
          >
            <option value="WORK">Arbeiten</option>
            <option value="VACATION">Urlaub</option>
            <option value="SICK">Krank</option>
            <option value="FLEXDAY">Gleittag</option>
          </select>
        </div>

        {status === "WORK" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Start
              </label>

              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Ende
              </label>

              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Pause
              </label>

              <input
                type="number"
                value={breakMinutes}
                onChange={(e) =>
                  setBreakMinutes(Number(e.target.value))
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white"
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Notiz / Tätigkeit
        </label>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Was wurde gemacht?"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white"
        />
      </div>

      <div className="mt-6 flex flex-col md:flex-row gap-3">
        <button
          onClick={saveEntry}
          className="bg-black text-white px-5 py-3 rounded-xl font-medium"
        >
          {editingId
            ? "Änderungen speichern"
            : "Eintrag speichern"}
        </button>
      </div>
    </div>
  );
}