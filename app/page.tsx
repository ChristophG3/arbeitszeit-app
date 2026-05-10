"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Entry, Adjustment } from "@/types";
import { bavarianHolidays } from "@/lib/holidays";

import {
  calculateMinutes,
  getWorkingDaysInMonth,
  getWeekendDaysInMonth,
} from "@/lib/calculations";

import DashboardCards from "@/components/DashboardCards";
import EntryForm from "@/components/EntryForm";
import EntriesTable from "@/components/EntriesTable";

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);

  const [date, setDate] = useState("");
  const [status, setStatus] = useState("WORK");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [resetValue, setResetValue] =
    useState(0);

  const [resetNote, setResetNote] =
    useState("");

  const [selectedMonth, setSelectedMonth] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 7)
    );

  const filteredEntries = entries.filter(
    (entry) =>
      entry.date.startsWith(
        selectedMonth
      )
  );

  const filteredAdjustments =
    adjustments.filter((adjustment) =>
      adjustment.date.startsWith(
        selectedMonth
      )
    );

  const holidaysInMonth =
    bavarianHolidays.filter((holiday) =>
      holiday.startsWith(
        selectedMonth
      )
    );

  const workingDaysInMonth =
    getWorkingDaysInMonth(
      selectedMonth
    );

  const totalActualMinutes =
    filteredEntries.reduce(
      (sum, entry) =>
        sum +
        (entry.actual_minutes ?? 0),
      holidaysInMonth.length * 360
    );

  const totalOvertimeMinutes =
    filteredEntries.reduce(
      (sum, entry) =>
        sum +
        (entry.overtime_minutes ??
          0),
      0
    );

  const totalAdjustmentMinutes =
    filteredAdjustments.reduce(
      (sum, adjustment) =>
        sum + adjustment.minutes,
      0
    );

  const expectedMinutes =
    workingDaysInMonth * 360;

  const vacationDays =
    filteredEntries.filter(
      (entry) =>
        entry.status ===
        "VACATION"
    ).length;

  const sickDays =
    filteredEntries.filter(
      (entry) =>
        entry.status === "SICK"
    ).length;

  const flexDays =
    filteredEntries.filter(
      (entry) =>
        entry.status ===
        "FLEXDAY"
    ).length;

  const overtimeBalance =
    useMemo(() => {
      return (
        totalOvertimeMinutes +
        totalAdjustmentMinutes
      );
    }, [
      totalOvertimeMinutes,
      totalAdjustmentMinutes,
    ]);

  useEffect(() => {
    loadEntries();
    loadAdjustments();
  }, []);

  async function loadEntries() {
    const { data, error } =
      await supabase
        .from("time_entries")
        .select("*")
        .order("date", {
          ascending: false,
        });

    if (!error && data) {
      setEntries(data);
    }
  }

  async function loadAdjustments() {
    const { data, error } =
      await supabase
        .from(
          "overtime_adjustments"
        )
        .select("*")
        .order("date", {
          ascending: false,
        });

    if (!error && data) {
      setAdjustments(data);
    }
  }

  function editEntry(entry: Entry) {
    setEditingId(entry.id);

    setDate(entry.date);
    setStatus(entry.status);
    setStartTime(
      entry.start_time || ""
    );
    setEndTime(
      entry.end_time || ""
    );

    setBreakMinutes(
      entry.break_minutes || 30
    );

    setNote(entry.note || "");

    setMessage(
      "Bearbeitungsmodus aktiv ✏️"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveEntry() {
    let actualMinutes = 0;
    let overtimeMinutes = 0;

    if (status === "WORK") {
      actualMinutes =
        calculateMinutes(
          startTime,
          endTime,
          breakMinutes
        );

      overtimeMinutes =
        actualMinutes - 360;
    }

    if (
      status === "SICK" ||
      status === "VACATION"
    ) {
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

      start_time:
        startTime || null,

      end_time:
        endTime || null,

      break_minutes:
        breakMinutes,

      actual_minutes:
        actualMinutes,

      overtime_minutes:
        overtimeMinutes,
    };

    let error;

    if (editingId) {
      const result =
        await supabase
          .from("time_entries")
          .update(payload)
          .eq("id", editingId);

      error = result.error;
    } else {
      const result =
        await supabase
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

  async function deleteEntry(
    id: string
  ) {
    const confirmed =
      window.confirm(
        "Eintrag wirklich löschen?"
      );

    if (!confirmed) return;

    const { error } =
      await supabase
        .from("time_entries")
        .delete()
        .eq("id", id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        "Eintrag gelöscht 🗑️"
      );

      loadEntries();
    }
  }

  async function saveAdjustment() {
    const payload = {
      date: new Date()
        .toISOString()
        .slice(0, 10),

      minutes: resetValue,

      note:
        resetNote ||
        "Manuelle Korrektur",
    };

    const { error } =
      await supabase
        .from(
          "overtime_adjustments"
        )
        .insert([payload]);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        "Überstundenkonto angepasst ✅"
      );

      setResetValue(0);
      setResetNote("");

      loadAdjustments();
    }
  }

  function exportPdf() {
    window.print();
  }

  return (
    <main className="min-h-screen bg-gray-100 text-black">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">

        <EntryForm
          date={date}
          setDate={setDate}
          status={status}
          setStatus={setStatus}
          startTime={startTime}
          setStartTime={
            setStartTime
          }
          endTime={endTime}
          setEndTime={setEndTime}
          breakMinutes={
            breakMinutes
          }
          setBreakMinutes={
            setBreakMinutes
          }
          note={note}
          setNote={setNote}
          editingId={editingId}
          saveEntry={saveEntry}
        />

        {message && (
          <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-xl">
            {message}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Arbeitszeit Dashboard
            </h1>

            <p className="text-gray-500 mt-1">
              Arbeitszeiten,
              Überstunden und
              Abwesenheiten
              verwalten
            </p>
          </div>

          <div className="flex items-center gap-3">

            <input
              type="month"
              value={
                selectedMonth
              }
              onChange={(e) =>
                setSelectedMonth(
                  e.target.value
                )
              }
              className="border rounded-xl px-4 py-3 bg-white shadow-sm"
            />

            <button
              onClick={exportPdf}
              className="bg-black text-white px-4 py-3 rounded-xl shadow-sm"
            >
              PDF Export
            </button>

          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-5 md:p-6">

          <h2 className="text-2xl font-bold mb-2">
            Überstundenkonto
            korrigieren
          </h2>

          <p className="text-gray-500 mb-5">
            Manuelle Anpassung des
            Überstundenkontos
          </p>

          <div className="grid gap-4 md:grid-cols-2">

            <div>
              <label className="block text-sm font-medium mb-2">
                Minuten (+ / -)
              </label>

              <input
                type="number"
                value={resetValue}
                onChange={(e) =>
                  setResetValue(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="w-full rounded-2xl border border-gray-300 px-4 py-4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Notiz
              </label>

              <input
                type="text"
                value={resetNote}
                onChange={(e) =>
                  setResetNote(
                    e.target.value
                  )
                }
                placeholder="z. B. Jahreskorrektur"
                className="w-full rounded-2xl border border-gray-300 px-4 py-4"
              />
            </div>

          </div>

          <button
            onClick={saveAdjustment}
            className="mt-5 bg-black text-white px-6 py-4 rounded-2xl"
          >
            Korrektur speichern
          </button>

        </div>

        <DashboardCards
          workingDays={
            workingDaysInMonth
          }
          expectedMinutes={
            expectedMinutes
          }
          actualMinutes={
            totalActualMinutes
          }
          overtimeMinutes={
            totalOvertimeMinutes
          }
          overtimeBalance={
            overtimeBalance
          }
          vacationDays={
            vacationDays
          }
          sickDays={sickDays}
          flexDays={flexDays}
          holidayCount={
            holidaysInMonth.length
          }
          weekendDays={getWeekendDaysInMonth(
            selectedMonth
          )}
        />

        <EntriesTable
          entries={filteredEntries}
          editEntry={editEntry}
          deleteEntry={
            deleteEntry
          }
        />

      </div>
    </main>
  );
}