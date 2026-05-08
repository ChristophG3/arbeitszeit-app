type Props = {
  workingDays: number;
  expectedMinutes: number;
  actualMinutes: number;
  overtimeMinutes: number;
  overtimeBalance: number;
  vacationDays: number;
  sickDays: number;
  flexDays: number;
  holidayCount: number;
  weekendDays: number;
};

export default function DashboardCards({
  workingDays,
  expectedMinutes,
  actualMinutes,
  overtimeMinutes,
  overtimeBalance,
  vacationDays,
  sickDays,
  flexDays,
  holidayCount,
  weekendDays,
}: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      <div className="border rounded p-4 bg-blue-50">
        <p className="text-sm text-gray-500">
          Arbeitstage
        </p>

        <p className="text-2xl font-bold text-blue-700">
          {workingDays}
        </p>
      </div>

      <div className="border rounded p-4 bg-green-50">
        <p className="text-sm text-gray-500">
          Sollstunden
        </p>

        <p className="text-2xl font-bold text-green-700">
          {(expectedMinutes / 60).toFixed(1)}h
        </p>
      </div>

      <div className="border rounded p-4 bg-cyan-50">
        <p className="text-sm text-gray-500">
          Iststunden
        </p>

        <p className="text-2xl font-bold text-cyan-700">
          {(actualMinutes / 60).toFixed(1)}h
        </p>
      </div>

      <div className="border rounded p-4 bg-yellow-50">
        <p className="text-sm text-gray-500">
          Monats-Überstunden
        </p>

        <p className="text-2xl font-bold text-yellow-700">
          {(overtimeMinutes / 60).toFixed(1)}h
        </p>
      </div>

      <div className="border rounded p-4 bg-orange-50">
        <p className="text-sm text-gray-500">
          Überstundenkonto
        </p>

        <p className="text-2xl font-bold text-orange-700">
          {(overtimeBalance / 60).toFixed(1)}h
        </p>
      </div>

      <div className="border rounded p-4 bg-indigo-50">
        <p className="text-sm text-gray-500">
          Urlaub
        </p>

        <p className="text-2xl font-bold text-indigo-700">
          {vacationDays}
        </p>
      </div>

      <div className="border rounded p-4 bg-red-50">
        <p className="text-sm text-gray-500">
          Krank
        </p>

        <p className="text-2xl font-bold text-red-700">
          {sickDays}
        </p>
      </div>

      <div className="border rounded p-4 bg-gray-100">
        <p className="text-sm text-gray-500">
          Gleittage
        </p>

        <p className="text-2xl font-bold text-gray-700">
          {flexDays}
        </p>
      </div>

      <div className="border rounded p-4 bg-pink-50">
        <p className="text-sm text-gray-500">
          Feiertage
        </p>

        <p className="text-2xl font-bold text-pink-700">
          {holidayCount}
        </p>
      </div>

      <div className="border rounded p-4 bg-purple-50">
        <p className="text-sm text-gray-500">
          Wochenenden
        </p>

        <p className="text-2xl font-bold text-purple-700">
          {weekendDays}
        </p>
      </div>
    </div>
  );
}