import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

function App() {
  const [count, setCount] = useState(0)
  const [dbStatus, setDbStatus] = useState<string>('Checking...')

  useEffect(() => {
    async function checkSupabase() {
      try {
        const { error } = await supabase.from('_non_existent_table').select('*').limit(1)
        // If we get an error about table not existing, it means connection worked but table is missing (which is fine)
        if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
          setDbStatus('Error: ' + error.message)
        } else {
          setDbStatus('Connected!')
        }
      } catch {
        setDbStatus('Error connecting to Supabase')
      }
    }
    checkSupabase()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">SafeDrive 2.0</h1>
        <p className="text-gray-600">
          Initialized with React, TS, Tailwind v4, shadcn/ui, and Supabase.
        </p>
        
        <div className="flex flex-col items-center gap-4">
          <Button 
            onClick={() => setCount((c) => c + 1)}
            className="w-full"
          >
            Count is {count}
          </Button>
          
          <div className="text-sm">
            Supabase Status: <span className={dbStatus === 'Connected!' ? 'text-green-600 font-semibold' : 'text-amber-600'}>
              {dbStatus}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-center gap-4 text-xs text-gray-400">
          <span>shadcn/ui Button</span>
          <span>•</span>
          <span>Tailwind v4</span>
          <span>•</span>
          <span>Supabase Ready</span>
        </div>
      </div>
    </div>
  )
}

export default App
