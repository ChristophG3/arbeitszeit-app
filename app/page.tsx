"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Entry = {
  id: string;
  date: string;
  status: string;
  start_time?: string;
  end_time?: string;
  break_minutes?: number;
  actual_minutes?: number;
  overtime_minutes?: number;
  note: string;
};

type Adjustment = {
  id: string;
  date: string;
  minutes: number;
  reason: string;
};

const bavarianHolidays = [
  // 2026
  "2026-01-01",
  "2026-01-06",
  "2026-04-03",
  "2026-04-06",
  "2026-05-01",
  "2026-05-14",
  "2026-05-25",
  "2026-06-04",
  "2026-08-15",
  "2026-10-03",
  "2026-11-01",
  "2026-12-25",
  "2026-12-26",

  // 2027
  "2027-01-01",
  "2027-01-06",
  "2027-03-26",
  "2027-03-29",
  "2027-05-01",
  "2027-05-06",
  "2027-05-17",
  "2027-05-27",
  "2027-08-15",
  "2027-10-03",
  "2027-11-01",
  "2027-12-25",
  "2027-12-26",
];

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [adjustmentMinutes, setAdjustmentMinutes] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState("");

  const [date, setDate] = useState("");
  const [status, setStatus] = useState("WORK");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const filteredEntries = entries.filter((entry) =>
    entry.date.startsWith(selectedMonth)
  );

  const filteredAdjustments = adjustments.filter((adjustment) =>
    adjustment.date.startsWith(selectedMonth)
  );

  const holidaysInMonth = bavarianHolidays.filter((holiday) =>
    holiday.startsWith(selectedMonth)
  );

  function getWorkingDaysInMonth(month: string) {
    const [year, monthIndex] = month.split("-").map(Number);

    const daysInMonth = new Date(year, monthIndex, 0).getDate();

    let workingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, monthIndex - 1, day);

      const isoDate = currentDate
        .toISOString()
        .slice(0, 10);

      const weekday = currentDate.getDay();

      const isWeekend = weekday === 0 || weekday === 6;

      const isHoliday = bavarianHolidays.includes(isoDate);

      if (!isWeekend && !isHoliday) {
        workingDays++;
      }
    }

    return workingDays;
  }

  const workingDaysInMonth = getWorkingDaysInMonth(
    selectedMonth
  );

  const totalActualMinutes = filteredEntries.reduce(
    (sum, entry) => sum + (entry.actual_minutes ?? 0),
    holidaysInMonth.length * 360
  );

  const totalOvertimeMinutes = filteredEntries.reduce(
    (sum, entry) => sum + (entry.overtime_minutes ?? 0),
    0
  );

  const totalAdjustmentMinutes = filteredAdjustments.reduce(
    (sum, adjustment) => sum + adjustment.minutes,
    0
  );

  const expectedMinutes = workingDaysInMonth * 360;

  const vacationDays = filteredEntries.filter(
    (entry) => entry.status === "VACATION"
  ).length;

  const sickDays = filteredEntries.filter(
    (entry) => entry.status === "SICK"
  ).length;

  const flexDays = filteredEntries.filter(
    (entry) => entry.status === "FLEXDAY"
  ).length;

  const overtimeBalance = useMemo(() => {
    return totalOvertimeMinutes + totalAdjustmentMinutes;
  }, [totalOvertimeMinutes, totalAdjustmentMinutes]);

  useEffect(() => {
    loadEntries();
    loadAdjustments();
  }, []);

  async function loadEntries() {
    const { data, error } = await supabase
      .from("time_entries")
      .select("*")
      .order("date", { ascending: false });

    if (!error && data) {
      setEntries(data);
    }
  }

  async function loadAdjustments() {
    const { data, error } = await supabase
      .from("overtime_adjustments")
      .select("*")
      .order("date", { ascending: false });

    if (!error && data) {
      setAdjustments(data);
    }
  }

  function calculateMinutes(start: string, end: string, pause: number) {
    if (!start || !end) return 0;

    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    const startTotal = startHour * 60 + startMinute;
    const endTotal = endHour * 60 + endMinute;

    return endTotal - startTotal - pause;
  }

  function editEntry(entry: Entry) {
    setEditingId(entry.id);

    setDate(entry.date);
    setStatus(entry.status);
    setStartTime(entry.start_time || "");
    setEndTime(entry.end_time || "");
    setBreakMinutes(entry.break_minutes || 30);
    setNote(entry.note || "");
    setMessage("Bearbeitungsmodus aktiv ✏️");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveEntry() {
    let actualMinutes = 0;
    let overtimeMinutes = 0;

    if (status === "WORK") {
      actualMinutes = calculateMinutes(
        startTime,
        endTime,
        breakMinutes
      );

      overtimeMinutes = actualMinutes - 360;
    }

    if (status === "SICK" || status === "VACATION") {
      actualMinutes = 360;
      overtimeMinutes = 0;
    }

    if (status === "FLEXDAY") {
      actualMinutes = 0;
      overtimeMinutes = -360;
    }

    const payload = {
      date,
      status,
      note,
      start_time: startTime || null,
      end_time: endTime || null,
      break_minutes: breakMinutes,
      actual_minutes: actualMinutes,
      overtime_minutes: overtimeMinutes,
    };

    let error;

    if (editingId) {
      const result = await supabase
        .from("time_entries")
        .update(payload)
        .eq("id", editingId);

      error = result.error;
    } else {
      const result = await supabase
        .from("time_entries")
        .insert([payload]);

      error = result.error;
    }

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        editingId
          ? "Eintrag aktualisiert 🚀"
          : "Eintrag gespeichert 🚀"
      );

      setEditingId(null);
      setDate("");
      setStatus("WORK");
      setStartTime("");
      setEndTime("");
      setBreakMinutes(30);
      setNote("");

      loadEntries();
    }
  }

  async function deleteEntry(id: string) {
    const confirmed = window.confirm(
      "Eintrag wirklich löschen?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("time_entries")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Eintrag gelöscht 🗑️");
      loadEntries();
    }
  }

  async function saveAdjustment() {
    const { error } = await supabase
      .from("overtime_adjustments")
      .insert([
        {
          date: new Date().toISOString().slice(0, 10),
          minutes: adjustmentMinutes,
          reason: adjustmentReason,
        },
      ]);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Korrektur gespeichert ✅");
      setAdjustmentMinutes(0);
      setAdjustmentReason("");
      loadAdjustments();
    }
  }

  async function resetOvertimeBalance() {
    const confirmed = window.confirm(
      "Überstundenkonto wirklich zurücksetzen?"
    );

    if (!confirmed) return;

    const resetMinutes = overtimeBalance * -1;

    const { error } = await supabase
      .from("overtime_adjustments")
      .insert([
        {
          date: new Date().toISOString().slice(0, 10),
          minutes: resetMinutes,
          reason: "Überstundenkonto zurückgesetzt",
        },
      ]);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Überstundenkonto zurückgesetzt 🔄");
      loadAdjustments();
    }
  }

  function exportPdf() {
    window.print();
  }

  return (
    <main className="p-10 max-w-5xl bg-white text-black">
      <h1 className="text-3xl font-bold mb-6">
        Arbeitszeit App
      </h1>

      <div className="mb-6">
        <label className="block mb-2 font-medium">
          Monat auswählen
        </label>

        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      <div className="mb-8 print:hidden">
        <button
          type="button"
          onClick={exportPdf}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          PDF Monatsreport exportieren
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10 md:grid-cols-4 print:grid-cols-4">

        <div className="border rounded p-4 bg-gray-50">
          <p className="text-sm text-gray-500">
            Iststunden
          </p>

          <p className="text-2xl font-bold">
            {(totalActualMinutes / 60).toFixed(1)} h
          </p>
        </div>

        <div className="border rounded p-4 bg-gray-50">
          <p className="text-sm text-gray-500">
            Überstunden
          </p>

          <p className="text-2xl font-bold">
            {(totalOvertimeMinutes / 60).toFixed(1)} h
          </p>
        </div>

        <div className="border rounded p-4 bg-yellow-50">
          <p className="text-sm text-gray-500">
            Überstundenkonto
          </p>

          <p
            className={`text-2xl font-bold ${
              overtimeBalance > 0
                ? "text-green-600"
                : overtimeBalance < 0
                ? "text-red-600"
                : "text-black"
            }`}
          >
            {(overtimeBalance / 60).toFixed(1)} h
          </p>
        </div>

        <div className="border rounded p-4 bg-gray-50">
          <p className="text-sm text-gray-500">
            Sollstunden
          </p>

          <p className="text-2xl font-bold">
            {(expectedMinutes / 60).toFixed(1)} h
          </p>
        </div>

        <div className="border rounded p-4 bg-green-50">
          <p className="text-sm text-gray-500">
            Arbeitstage
          </p>

          <p className="text-2xl font-bold text-green-700">
            {workingDaysInMonth}
          </p>
        </div>

        <div className="border rounded p-4 bg-gray-50">
          <p className="text-sm text-gray-500">
            Urlaub
          </p>

          <p className="text-2xl font-bold">
            {vacationDays}
          </p>
        </div>

        <div className="border rounded p-4 bg-gray-50">
          <p className="text-sm text-gray-500">
            Krank
          </p>

          <p className="text-2xl font-bold">
            {sickDays}
          </p>
        </div>

        <div className="border rounded p-4 bg-gray-50">
          <p className="text-sm text-gray-500">
            Gleittage
          </p>

          <p className="text-2xl font-bold">
            {flexDays}
          </p>
        </div>

        <div className="border rounded p-4 bg-blue-50">
          <p className="text-sm text-gray-500">
            Feiertage Bayern
          </p>

          <p className="text-2xl font-bold text-blue-600">
            {holidaysInMonth.length}
          </p>
        </div>

        <div className="border rounded p-4 bg-purple-50">
          <p className="text-sm text-gray-500">
            Wochenenden
          </p>

          <p className="text-2xl font-bold text-purple-700">
            {(() => {
              const [year, monthIndex] = selectedMonth
                .split("-")
                .map(Number);

              const daysInMonth = new Date(
                year,
                monthIndex,
                0
              ).getDate();

              let weekendDays = 0;

              for (let day = 1; day <= daysInMonth; day++) {
                const currentDate = new Date(
                  year,
                  monthIndex - 1,
                  day
                );

                const weekday = currentDate.getDay();

                if (weekday === 0 || weekday === 6) {
                  weekendDays++;
                }
              }

              return weekendDays;
            })()}
          </p>
        </div>

      </div>

      <div className="flex flex-col gap-4 mb-10">

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-2 rounded"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="WORK">Arbeiten</option>
          <option value="SICK">Krank</option>
          <option value="VACATION">Urlaub</option>
          <option value="FLEXDAY">Gleittag</option>
        </select>

        {status === "WORK" && (
          <>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="border p-2 rounded"
            />

            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="border p-2 rounded"
            />

            <input
              type="number"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
              className="border p-2 rounded"
              placeholder="Pause in Minuten"
            />
          </>
        )}

        <textarea
          placeholder="Notiz"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="border p-2 rounded"
        />

        <div className="flex gap-4">

          <button
            type="button"
            onClick={saveEntry}
            className="bg-black text-white p-2 rounded flex-1"
          >
            {editingId ? "Aktualisieren" : "Speichern"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setDate("");
                setStatus("WORK");
                setStartTime("");
                setEndTime("");
                setBreakMinutes(30);
                setNote("");
                setMessage("Bearbeitung abgebrochen");
              }}
              className="bg-gray-500 text-white p-2 rounded"
            >
              Abbrechen
            </button>
          )}

        </div>

        {message && (
          <p>{message}</p>
        )}
      </div>

      <div className="border rounded p-6 mb-10 bg-gray-50">

        <h2 className="text-2xl font-bold mb-4">
          Überstunden Korrektur
        </h2>

        <div className="flex flex-col gap-4 mb-4">

          <input
            type="number"
            value={adjustmentMinutes}
            onChange={(e) =>
              setAdjustmentMinutes(Number(e.target.value))
            }
            className="border p-2 rounded"
            placeholder="Minuten (+/-)"
          />

          <input
            type="text"
            value={adjustmentReason}
            onChange={(e) => setAdjustmentReason(e.target.value)}
            className="border p-2 rounded"
            placeholder="Grund"
          />

          <div className="flex gap-4">

            <button
              type="button"
              onClick={saveAdjustment}
              className="bg-black text-white p-2 rounded"
            >
              Korrektur speichern
            </button>

            <button
              type="button"
              onClick={resetOvertimeBalance}
              className="bg-orange-500 text-white p-2 rounded"
            >
              Überstunden zurücksetzen
            </button>

          </div>

        </div>

        <div className="mt-6">
          <h3 className="font-bold mb-2">
            Korrekturen
          </h3>

          <div className="flex flex-col gap-2">
            {filteredAdjustments.map((adjustment) => (
              <div
                key={adjustment.id}
                className="border rounded p-3 bg-white"
              >
                <div className="flex justify-between">
                  <span>
                    {adjustment.reason}
                  </span>

                  <span
                    className={`font-bold ${
                      adjustment.minutes > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {(adjustment.minutes / 60).toFixed(2)} h
                  </span>
                </div>

                <p className="text-sm text-gray-500 mt-1">
                  {adjustment.date}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="border rounded p-6 mb-10 bg-blue-50">
        <h2 className="text-2xl font-bold mb-4">
          Feiertage Bayern
        </h2>

        <div className="flex flex-col gap-2">
          {holidaysInMonth.map((holiday) => (
            <div
              key={holiday}
              className="border rounded p-3 bg-white flex justify-between"
            >
              <span>
                Feiertag
              </span>

              <span className="font-medium">
                {holiday}
              </span>
            </div>
          ))}

          {holidaysInMonth.length === 0 && (
            <p className="text-gray-500">
              Keine Feiertage im ausgewählten Monat
            </p>
          )}
        </div>
      </div>

      <div className="border rounded p-6 mb-10 bg-green-50">
        <h2 className="text-2xl font-bold mb-4">
          Monatslogik
        </h2>

        <div className="flex flex-col gap-2 text-sm">
          <p>
            • Sollstunden werden nur für Werktage berechnet
          </p>

          <p>
            • Wochenenden zählen nicht als Arbeitstage
          </p>

          <p>
            • Feiertage Bayern werden automatisch berücksichtigt
          </p>

          <p>
            • Urlaub und Krankheit zählen als volle Sollzeit
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">
        Einträge
      </h2>

      <table className="w-full border border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Datum</th>
            <th className="border p-2 text-left">Status</th>
            <th className="border p-2 text-left">Zeit</th>
            <th className="border p-2 text-left">Pause</th>
            <th className="border p-2 text-left">Ist</th>
            <th className="border p-2 text-left">Überstunden</th>
            <th className="border p-2 text-left">Notiz</th>
          </tr>
        </thead>

        <tbody>
          {filteredEntries.map((entry) => (
            <tr key={entry.id}>
              <td className="border p-2">
                {entry.date}
              </td>

              <td className="border p-2 font-medium">
                {entry.status === "WORK" && "Arbeiten"}
                {entry.status === "SICK" && "Krank"}
                {entry.status === "VACATION" && "Urlaub"}
                {entry.status === "FLEXDAY" && "Gleittag"}
              </td>

              <td className="border p-2">
                {entry.start_time && entry.end_time
                  ? `${entry.start_time} - ${entry.end_time}`
                  : "-"}
              </td>

              <td className="border p-2">
                {entry.break_minutes ?? 0} min
              </td>

              <td className="border p-2">
                {entry.actual_minutes
                  ? `${(entry.actual_minutes / 60).toFixed(2)} h`
                  : "0 h"}
              </td>

              <td
                className={`border p-2 font-medium ${
                  (entry.overtime_minutes ?? 0) > 0
                    ? "text-green-600"
                    : (entry.overtime_minutes ?? 0) < 0
                    ? "text-red-600"
                    : "text-black"
                }`}
              >
                {entry.overtime_minutes
                  ? `${(entry.overtime_minutes / 60).toFixed(2)} h`
                  : "0 h"}
              </td>

              <td className="border p-2">
                {entry.note}
              </td>
              <td className="border p-2 print:hidden">
                <div className="flex gap-2">

                  <button
                    type="button"
                    onClick={() => editEntry(entry)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Bearbeiten
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteEntry(entry.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Löschen
                  </button>

                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="hidden print:block mt-10 text-sm text-gray-500">
        Exportiert am {new Date().toLocaleDateString("de-DE")}
      </div>
    </main>
  );
}