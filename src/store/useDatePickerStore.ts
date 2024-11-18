import { create } from 'zustand'
import { addDays, addMonths, addWeeks, addYears, format, startOfWeek, isValid, isBefore, isAfter } from 'date-fns'

type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly'
type MonthlyRecurrenceType = 'dayOfMonth' | 'nthDay'

interface NthDayConfig {
  weekNum: number // 1-5 for first-fifth
  dayOfWeek: number // 0-6 for Sunday-Saturday
}

interface ValidationError {
  field: string
  message: string
}

interface DatePickerState {
  selectedDate: Date
  endDate: Date | null
  recurrenceType: RecurrenceType | null
  recurrenceInterval: number
  selectedDays: number[]
  monthlyRecurrenceType: MonthlyRecurrenceType
  nthDayConfig: NthDayConfig | null
  previewDates: Date[]
  errors: ValidationError[]
  
  // Actions
  setSelectedDate: (date: Date | string) => void
  setEndDate: (date: Date | string | null) => void
  setRecurrenceType: (type: RecurrenceType | null) => void
  setRecurrenceInterval: (interval: number) => void
  setSelectedDays: (days: number[]) => void
  setMonthlyRecurrenceType: (type: MonthlyRecurrenceType) => void
  setNthDayConfig: (config: NthDayConfig | null) => void
  updatePreviewDates: () => void
  validateState: () => ValidationError[]
  clearErrors: () => void
}

const validateDate = (date: Date | null): boolean => {
  if (!date) return false
  return isValid(date) && !isNaN(date.getTime())
}

const validateDateRange = (startDate: Date, endDate: Date | null): boolean => {
  if (!endDate) return true
  return isValid(endDate) && !isBefore(endDate, startDate)
}

const calculatePreviewDates = (
  startDate: Date,
  recurrenceType: RecurrenceType | null,
  interval: number,
  endDate: Date | null,
  selectedDays: number[],
  monthlyRecurrenceType: MonthlyRecurrenceType,
  nthDayConfig: NthDayConfig | null
): Date[] => {
  try {
    if (!recurrenceType || !validateDate(startDate)) return [startDate]
    
    const dates: Date[] = []
    const maxPreviewDates = endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) : Infinity;
    
    if (recurrenceType === 'weekly' && selectedDays.length > 0) {
      let currentDate = startDate
      let weekStart = startOfWeek(currentDate)
      
      while (dates.length < maxPreviewDates && (!endDate || currentDate <= endDate)) {
        for (const day of selectedDays) {
          const nextDate = addDays(weekStart, day)
          if (nextDate >= startDate && (!endDate || nextDate <= endDate)) {
            dates.push(nextDate)
            if (dates.length >= maxPreviewDates) break
          }
        }
        weekStart = addWeeks(weekStart, interval)
        currentDate = weekStart
      }
      
      return dates.sort((a, b) => a.getTime() - b.getTime())
    }
    
    let currentDate = startDate
    while (dates.length < maxPreviewDates && (!endDate || currentDate <= endDate)) {
      if (recurrenceType === 'monthly' && monthlyRecurrenceType === 'nthDay' && nthDayConfig) {
        const nthDate = getNthDayOfMonth(currentDate, nthDayConfig.weekNum, nthDayConfig.dayOfWeek)
        if (nthDate && nthDate >= startDate && (!endDate || nthDate <= endDate)) {
          dates.push(nthDate)
        }
      } else {
        dates.push(currentDate)
      }
      
      switch (recurrenceType) {
        case 'daily':
          currentDate = addDays(currentDate, interval)
          break
        case 'monthly':
          currentDate = addMonths(currentDate, interval)
          break
        case 'yearly':
          currentDate = addYears(currentDate, interval)
          break
      }
    }
    
    return dates
  } catch (error) {
    console.error('Error calculating preview dates:', error)
    return [startDate]
  }
}

const getNthDayOfMonth = (date: Date, weekNum: number, dayOfWeek: number): Date | null => {
  try {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    let currentDay = firstDayOfMonth
    let weekCount = 0
    
    while (currentDay.getDay() !== dayOfWeek) {
      currentDay = addDays(currentDay, 1)
    }
    
    const targetDate = addWeeks(currentDay, weekNum - 1)
    
    if (targetDate.getMonth() !== date.getMonth()) {
      return addWeeks(currentDay, weekCount - 1)
    }
    
    return targetDate
  } catch (error) {
    console.error('Error calculating nth day of month:', error)
    return null
  }
}

export const useDatePickerStore = create<DatePickerState>((set, get) => ({
  selectedDate: new Date(),
  endDate: null,
  recurrenceType: null,
  recurrenceInterval: 1,
  selectedDays: [],
  monthlyRecurrenceType: 'dayOfMonth',
  nthDayConfig: null,
  previewDates: [new Date()],
  errors: [],
  
  setSelectedDate: (date) => {
    try {
      const newDate = date instanceof Date ? date : new Date(date)
      if (!validateDate(newDate)) {
        set({ errors: [{ field: 'startDate', message: 'Invalid start date' }] })
        return
      }
      
      const { endDate } = get()
      if (endDate && !validateDateRange(newDate, endDate)) {
        set({ errors: [{ field: 'dateRange', message: 'End date must be after start date' }] })
        return
      }
      
      set({ selectedDate: newDate, errors: [] })
      get().updatePreviewDates()
    } catch (error) {
      set({ errors: [{ field: 'startDate', message: 'Error setting start date' }] })
    }
  },
  
  setEndDate: (date) => {
    try {
      const newDate = date ? (date instanceof Date ? date : new Date(date)) : null
      if (newDate && !validateDate(newDate)) {
        set({ errors: [{ field: 'endDate', message: 'Invalid end date' }] })
        return
      }
      
      const { selectedDate } = get()
      if (newDate && !validateDateRange(selectedDate, newDate)) {
        set({ errors: [{ field: 'dateRange', message: 'End date must be after start date' }] })
        return
      }
      
      set({ endDate: newDate, errors: [] })
      get().updatePreviewDates()
    } catch (error) {
      set({ errors: [{ field: 'endDate', message: 'Error setting end date' }] })
    }
  },
  
  setRecurrenceType: (type) => {
    set({ recurrenceType: type, errors: [] })
    if (type === 'weekly' && get().selectedDays.length === 0) {
      set({ selectedDays: [get().selectedDate.getDay()] })
    }
    get().updatePreviewDates()
  },
  
  setRecurrenceInterval: (interval) => {
    if (interval < 1) {
      set({ errors: [{ field: 'interval', message: 'Interval must be at least 1' }] })
      return
    }
    set({ recurrenceInterval: interval, errors: [] })
    get().updatePreviewDates()
  },
  
  setSelectedDays: (days) => {
    if (get().recurrenceType === 'weekly' && days.length === 0) {
      set({ errors: [{ field: 'selectedDays', message: 'Select at least one day for weekly recurrence' }] })
      return
    }
    set({ selectedDays: days, errors: [] })
    get().updatePreviewDates()
  },
  
  setMonthlyRecurrenceType: (type) => {
    set({ monthlyRecurrenceType: type, errors: [] })
    get().updatePreviewDates()
  },
  
  setNthDayConfig: (config) => {
    set({ nthDayConfig: config, errors: [] })
    get().updatePreviewDates()
  },
  
  validateState: () => {
    const errors: ValidationError[] = []
    const state = get()
    
    if (!validateDate(state.selectedDate)) {
      errors.push({ field: 'startDate', message: 'Invalid start date' })
    }
    
    if (state.endDate && !validateDateRange(state.selectedDate, state.endDate)) {
      errors.push({ field: 'dateRange', message: 'End date must be after start date' })
    }
    
    if (state.recurrenceType === 'weekly' && state.selectedDays.length === 0) {
      errors.push({ field: 'selectedDays', message: 'Select at least one day for weekly recurrence' })
    }
    
    if (state.recurrenceInterval < 1) {
      errors.push({ field: 'interval', message: 'Interval must be at least 1' })
    }
    
    set({ errors })
    return errors
  },
  
  clearErrors: () => set({ errors: [] }),
  
  updatePreviewDates: () => {
    try {
      const { selectedDate, recurrenceType, recurrenceInterval, endDate, selectedDays, monthlyRecurrenceType, nthDayConfig } = get()
      
      const errors = get().validateState()
      if (errors.length > 0) return
      
      const newPreviewDates = calculatePreviewDates(
        selectedDate,
        recurrenceType,
        recurrenceInterval,
        endDate,
        selectedDays,
        monthlyRecurrenceType,
        nthDayConfig
      )
      set({ previewDates: newPreviewDates })
    } catch (error) {
      console.error('Error updating preview dates:', error)
      set({ previewDates: [get().selectedDate] })
    }
  }
}))