'use client'

import { useState } from 'react'
import { format, isValid, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, getDay } from 'date-fns'
import { Calendar as CalendarIcon, AlertCircle, ChevronLeft, ChevronRight, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react'
import { useDatePickerStore } from '../store/useDatePickerStore'

const recurrenceOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
] as const

const weekDays = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
]

const weekNumbers = [
  { value: 1, label: 'First' },
  { value: 2, label: 'Second' },
  { value: 3, label: 'Third' },
  { value: 4, label: 'Fourth' },
  { value: 5, label: 'Last' },
]

function MiniCalendar({ selectedDates }: { selectedDates: Date[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const firstDayOfMonth = getDay(monthStart)

  const isDateSelected = (date: Date) => {
    return selectedDates.some(selectedDate => isSameDay(selectedDate, date))
  }

  // Create array of empty cells for days before the first day of month
  const emptyDays = Array(firstDayOfMonth).fill(null)
  // Combine empty days with month days
  const allDays = [...emptyDays, ...monthDays]

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg text-slate-400 font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day.value} className="text-center text-xs font-medium text-gray-500">
            {day.label}
          </div>
        ))}
      </div>
        
      <div className="grid grid-cols-7 gap-1">
        {allDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />
          }
          
          const isSelected = isDateSelected(day)
          return (
            <div
              key={index}
              className={`
                aspect-square flex items-center justify-center text-sm rounded-full
                ${!isSameMonth(day, currentMonth) ? 'text-gray-300' : 'text-gray-700'}
                ${isSelected ? 'bg-green-600 text-white' : ''}
              `}
            >
              {format(day, 'd')}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
      <AlertCircle className="w-4 h-4" />
      <span>{message}</span>
    </div>
  )
}

export function DatePicker() {
  const [isOpen, setIsOpen] = useState(false)
  const {
    selectedDate,
    endDate,
    recurrenceType,
    recurrenceInterval,
    selectedDays,
    monthlyRecurrenceType,
    nthDayConfig,
    previewDates,
    errors,
    setSelectedDate,
    setEndDate,
    setRecurrenceType,
    setRecurrenceInterval,
    setSelectedDays,
    setMonthlyRecurrenceType,
    setNthDayConfig,
    clearErrors,
  } = useDatePickerStore()

  const getErrorForField = (fieldName: string) => {
    return errors.find(error => error.field === fieldName)?.message
  }

  const handleDateChange = (date: string | Date, isEndDate: boolean = false) => {
    try {
      const newDate = new Date(date)
      if (!isValid(newDate)) {
        throw new Error('Invalid date')
      }
      if (isEndDate) {
        setEndDate(newDate)
      } else {
        setSelectedDate(newDate)
      }
    } catch (error) {
      console.log('Error handling date change:', error)
    }
  }

  return (
    <div className="w-full max-w-md p-4 bg-white rounded-lg shadow-lg">
      {/* Date Range Selection */}
      <div className="space-y-4">
        {/* Start Date Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-bold tracking-wider text-slate-700">
            Start Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => handleDateChange(e.target.value)}
              className={`w-full px-3 py-2 border text-slate-500 rounded-md  ${getErrorForField('startDate') ? 'border-red-500' : ''
                }`}
            />
          </div>
          {getErrorForField('startDate') && (
            <ErrorMessage message={getErrorForField('startDate')!} />
          )}
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between gap-2 px-1 py-2 text-xs fon font-bold text-slate-600 tracking-wider rounded-md  transition-colors w-full"
        >
          <p>
            {isOpen ? 'Hide' : 'Show'} Recurrence Options
          </p>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {isOpen && (
          <div className="space-y-4 transition-all delay-1000">
            {/* End Date Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-bold tracking-wider text-slate-700">
                End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                  min={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={(e) => handleDateChange(e.target.value, true)}
                  className={`w-full px-3 py-2 border rounded-md text-slate-500 ${getErrorForField('endDate') || getErrorForField('dateRange')
                    ? 'border-red-500'
                    : ''
                    }`}
                />
              </div>
              {(getErrorForField('endDate') || getErrorForField('dateRange')) && (
                <ErrorMessage
                  message={
                    getErrorForField('endDate') || getErrorForField('dateRange')!
                  }
                />
              )}
            </div>

            {/* Recurrence Type */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold tracking-wider text-slate-700">
                Repeat
              </label>
              <div className="grid grid-cols-2 gap-2">
                {recurrenceOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      clearErrors()
                      setRecurrenceType(option.value)
                    }}
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${recurrenceType === option.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interval Selection */}
            {recurrenceType && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold tracking-wider text-gray-700">
                  Repeat every
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={recurrenceInterval}
                    onChange={(e) => {
                      clearErrors()
                      setRecurrenceInterval(Number(e.target.value))
                    }}
                    className={`w-20 px-2 py-1 border text-slate-500 text-sm rounded-md ${getErrorForField('interval') ? 'border-red-500' : ''
                      }`}
                  />
                  <span className="text-sm text-gray-600">
                    {recurrenceType}
                  </span>
                </div>
                {getErrorForField('interval') && (
                  <ErrorMessage message={getErrorForField('interval')!} />
                )}
              </div>
            )}

            {/* Weekly Day Selection */}
            {recurrenceType === 'weekly' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold tracking-wider text-slate-700">
                  Repeat on
                </label>
                <div className="flex gap-1">
                  {weekDays.map((day) => (
                    <button
                      key={day.value}
                      onClick={() => {
                        clearErrors()
                        const isSelected = selectedDays.includes(day.value)
                        setSelectedDays(
                          isSelected
                            ? selectedDays.filter((d) => d !== day.value)
                            : [...selectedDays, day.value].sort()
                        )
                      }}
                      className={`w-8 h-8 text-xs rounded-full ${selectedDays.includes(day.value)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                {getErrorForField('selectedDays') && (
                  <ErrorMessage message={getErrorForField('selectedDays')!} />
                )}
              </div>
            )}

            {/* Monthly Recurrence Options */}
            {recurrenceType === 'monthly' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold tracking-wider text-slate-700">
                    Monthly Repeat Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        clearErrors()
                        setMonthlyRecurrenceType('dayOfMonth')
                      }}
                      className={`px-4 py-2 text-sm rounded-md ${monthlyRecurrenceType === 'dayOfMonth'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      Same Day
                    </button>
                    <button
                      onClick={() => {
                        clearErrors()
                        setMonthlyRecurrenceType('nthDay')
                      }}
                      className={`px-4 py-2 text-sm rounded-md ${monthlyRecurrenceType === 'nthDay'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      Nth Day
                    </button>
                  </div>
                </div>

                {monthlyRecurrenceType === 'nthDay' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold tracking-wider text-slate-700">
                      Select Week and Day
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <select
                        value={nthDayConfig?.weekNum || 1}
                        onChange={(e) => {
                          clearErrors()
                          setNthDayConfig({
                            weekNum: Number(e.target.value),
                            dayOfWeek: nthDayConfig?.dayOfWeek || 0,
                          })
                        }}
                        className="px-3 py-2 text-slate-500 border rounded-md"
                      >
                        {weekNumbers.map((week) => (
                          <option key={week.value} value={week.value}>
                            {week.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={nthDayConfig?.dayOfWeek || 0}
                        onChange={(e) => {
                          clearErrors()
                          setNthDayConfig({
                            weekNum: nthDayConfig?.weekNum || 1,
                            dayOfWeek: Number(e.target.value),
                          })
                        }}
                        className="px-3 py-2 text-slate-500 border rounded-md"
                      >
                        {weekDays.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Calendar Preview */}
            {recurrenceType && errors.length === 0 && (
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-700 tracking-wider">
                  Calendar Preview
                </label>
                <MiniCalendar selectedDates={previewDates} />

                <div className="space-y-2">
                  <label className="block text-sm font-semibold tracking-wider text-slate-700">
                    Upcoming dates
                  </label>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {previewDates.map((date, index) => (
                      <div
                        key={index}
                        className="p-2 text-sm text-gray-600 bg-gray-50 rounded-md"
                      >
                        {format(date, 'PPP')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}