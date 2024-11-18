import { DatePicker } from '@/components/DatePicker'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-200 p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-slate-800 tracking-wider">
          Recurring Date Picker
        </h1>
        <DatePicker />
      </div>
    </main>
  )
}