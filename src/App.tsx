import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { ThemeProvider } from "next-themes"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, User, LogOut, Plus } from "lucide-react"

function App() {
  const [count, setCount] = useState(0)
  const [dbStatus, setDbStatus] = useState<string>('Checking...')

  useEffect(() => {
    async function checkSupabase() {
      try {
        const { error } = await supabase.from('_non_existent_table').select('*').limit(1)
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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4 font-sans transition-colors duration-300">
        <div className="max-w-4xl w-full grid gap-8 md:grid-cols-2">
          
          <Card className="shadow-xl border-none bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-3xl font-bold tracking-tight">SafeDrive 2.0</CardTitle>
              <CardDescription>
                Now equipped with essential UI components.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Quick Test Input</Label>
                <Input id="email" placeholder="Enter something..." className="bg-white dark:bg-zinc-800" />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => {
                    setCount((c) => c + 1)
                    toast.success("Count updated!", {
                      description: `The new count is ${count + 1}`,
                    })
                  }}
                  className="flex-1"
                >
                  <Plus className="mr-2 h-4 w-4" /> Count is {count}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="outline" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Settings</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" /> Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" /> Preferences
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem className="text-destructive">
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="text-sm pt-2">
                Supabase Status: <span className={dbStatus === 'Connected!' ? 'text-green-600 font-semibold' : 'text-amber-600'}>
                  {dbStatus}
                </span>
              </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground border-t pt-4">
              Installed: Toast, Table, Card, Toggle, Dropdown, Input, Label, Skeleton.
            </CardFooter>
          </Card>

          <div className="hidden md:flex flex-col justify-center space-y-4">
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 shadow-sm">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Developer Note</h3>
              <p className="text-sm text-blue-800/80 dark:text-blue-400/80 leading-relaxed">
                Basic UI components have been installed in <code>src/components/ui/</code>. 
                You can now build complex layouts using these foundational pieces.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  )
}

export default App
