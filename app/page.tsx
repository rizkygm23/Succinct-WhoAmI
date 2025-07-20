"use client"
import { useState } from "react"
import type React from "react"

import { supabase } from "@/lib/supabase"

type Who = {
  id: string
  username_x: string
  message: string
  created_at: string
}

export default function Home() {
  // Form state
  const [username, setUsername] = useState("")
  const [message, setMessage] = useState("")
  const [step, setStep] = useState<"submit" | "guess">("submit")
  const [errorMsg, setErrorMsg] = useState("")

  // Data state
  const [allUsers, setAllUsers] = useState<Who[]>([])
  const [clue, setClue] = useState<Who | null>(null)

  // Tebakan
  const [search, setSearch] = useState("")
  const [result, setResult] = useState<"benar" | "salah" | null>(null)

  // Untuk disable double submit
  const [loading, setLoading] = useState(false)

  // 1. Submit clue (username + message), handle duplicate via DB
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg("")
    if (!username || !message) return

    setLoading(true)
    // Insert ke Supabase, tangkap error jika duplikat
    const { error } = await supabase.from("who").insert([{ username_x: username, message }])

    setLoading(false)
    if (error) {
      if (error.code === "23505") {
        setErrorMsg("Username already registered, try another username!")
      } else {
        setErrorMsg("An error occurred, please try again.")
      }
      return
    }

    setStep("guess")
    setUsername(username)
    fetchDataAndClue(username)
  }

  // 2. Fetch user list & random clue (exclude diri sendiri)
  async function fetchDataAndClue(myUsername: string) {
    const { data: users } = await supabase.from("who").select("*")
    if (!users) return

    setAllUsers(users.filter((u) => u.username_x !== myUsername))
    // Pilih clue random (bukan diri sendiri)
    const others = users.filter((u) => u.username_x !== myUsername)
    if (others.length > 0) {
      const randomClue = others[Math.floor(Math.random() * others.length)]
      setClue(randomClue)
    }
  }

  // 3. Handle tebakan user
  function handleGuess(guessUsername: string) {
    if (!clue) return
    if (guessUsername.toLowerCase() === clue.username_x.toLowerCase()) {
      setResult("benar")
    } else {
      setResult("salah")
    }
  }

  // Dropdown always show all users, filter only if search not empty
  const filtered =
    search.length > 0 ? allUsers.filter((u) => u.username_x.toLowerCase().includes(search.toLowerCase())) : allUsers

  return (
    <main className="min-h-screen bg-black text-green-400 font-mono p-2 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Terminal Header */}
        <div className="border border-gray-700 rounded-t-lg bg-gray-900 px-2 sm:px-4 py-2 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="ml-2 sm:ml-4 text-gray-400 text-xs sm:text-sm truncate">whoami-game.terminal</span>
        </div>

        {/* Terminal Content */}
        <div className="border-x border-b border-gray-700 rounded-b-lg bg-black p-3 sm:p-6 min-h-[400px] sm:min-h-[500px]">
          {/* Welcome Message */}
          <div className="mb-4 sm:mb-6">
            <div className="text-[#FE11C5] text-lg sm:text-2xl font-bold mb-2 text-left">══════════════════════════════</div>
            <div className="text-[#FE11C5] text-xl sm:text-2xl font-bold mb-2 text-left">WHOAMI TERMINAL</div>
            <div className="text-[#FE11C5] text-lg sm:text-2xl font-bold mb-4 text-left">══════════════════════════════</div>
            <div className="text-[#90DCFF] mb-2 text-sm sm:text-base">$ whoami --help</div>
            <div className="text-gray-400 mb-4 text-sm sm:text-base">
              A terminal-based guessing game where you submit clues and guess others!
            </div>
          </div>

          {step === "submit" && (
            <div className="space-y-4">
              <div className="text-[#90DCFF]">$ whoami --register</div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="text-gray-400 mb-2 text-sm sm:text-base">Enter your X username:</div>
                  <div className="flex items-center flex-wrap sm:flex-nowrap">
                    <span className="text-[#FE11C5] mr-2 text-sm sm:text-base whitespace-nowrap">
                      username@terminal:~$
                    </span>
                    <input
                      className="bg-transparent border-b border-gray-600 text-white outline-none flex-1 pb-1 focus:border-[#90DCFF] transition-colors text-sm sm:text-base min-w-0"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="your_username"
                      required
                    />
                  </div>
                  {username && (
                    <div className="flex items-center mt-3 text-gray-400">
                      <span className="mr-2">└─ Avatar loaded:</span>
                      <img
                        src={`https://unavatar.io/${username}`}
                        alt="avatar"
                        className="w-8 h-8 rounded border border-gray-600"
                      />
                      <span className="ml-2 text-[#90DCFF]">@{username}</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-gray-400 mb-2 text-sm sm:text-base">Enter your secret clue:</div>
                  <div className="flex items-center flex-wrap sm:flex-nowrap">
                    <span className="text-[#FE11C5] mr-2 text-sm sm:text-base whitespace-nowrap">clue@terminal:~$</span>
                    <input
                      className="bg-transparent border-b border-gray-600 text-white outline-none flex-1 pb-1 focus:border-[#90DCFF] transition-colors text-sm sm:text-base min-w-0"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter a unique fact..."
                      required
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-[#FE11C5] to-[#90DCFF] text-black px-4 sm:px-6 py-2 rounded font-bold hover:opacity-90 transition-opacity disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto"
                  >
                    {loading ? "$ Processing..." : "$ Submit --execute"}
                  </button>
                </div>

                {errorMsg && (
                  <div className="text-red-400 mt-4">
                    <span className="text-red-500">ERROR:</span> {errorMsg}
                  </div>
                )}
              </form>
            </div>
          )}

          {step === "guess" && clue && (
            <div className="space-y-6">
              <div className="text-[#90DCFF]">$ whoami --guess --mode=interactive</div>

              <div className="border border-gray-700 rounded p-4 bg-gray-900">
                <div className="text-[#FE11C5] mb-2">MYSTERY CLUE DETECTED:</div>
                <div className="bg-black border border-gray-600 rounded p-4">
                  <div className="text-[#90DCFF] text-lg">"{clue.message}"</div>
                </div>
              </div>

              {!result && (
                <div>
                  <div className="text-gray-400 mb-3">Who do you think this is?</div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (search) handleGuess(search)
                    }}
                    className="space-y-4"
                  >
                    <div className="flex items-center flex-wrap sm:flex-nowrap">
                      <span className="text-[#FE11C5] mr-2 text-sm sm:text-base whitespace-nowrap">
                        guess@terminal:~$
                      </span>
                      <input
                        className="bg-transparent border-b border-gray-600 text-white outline-none flex-1 pb-1 focus:border-[#90DCFF] transition-colors text-sm sm:text-base min-w-0"
                        placeholder="type username..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoComplete="off"
                        required
                      />
                    </div>

                    {filtered.length > 0 && search && (
                      <div className="border border-gray-700 rounded bg-gray-900 max-h-48 overflow-y-auto">
                        <div className="text-gray-400 px-3 py-2 border-b border-gray-700 text-sm">Search results:</div>
                        {filtered.map((u) => (
                          <div
                            key={u.username_x}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-800 cursor-pointer transition-colors"
                            onClick={() => setSearch(u.username_x)}
                          >
                            <img
                              src={`https://unavatar.io/${u.username_x}`}
                              alt={u.username_x}
                              className="w-6 h-6 rounded border border-gray-600"
                            />
                            <span className="text-[#90DCFF]">@{u.username_x}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="bg-gradient-to-r from-[#90DCFF] to-[#FE11C5] text-black px-4 sm:px-6 py-2 rounded font-bold hover:opacity-90 transition-opacity text-sm sm:text-base w-full sm:w-auto"
                    >
                      $ Execute --guess
                    </button>
                  </form>
                </div>
              )}

              {result === "benar" && (
                <div className="border border-green-500 rounded p-3 sm:p-4 bg-green-900/20">
                  <div className="text-green-400 text-lg sm:text-xl font-bold">✓ SUCCESS: Correct guess! 🎉</div>
                  <div className="text-gray-400 mt-2 text-sm sm:text-base">$ whoami --status: SOLVED</div>
                </div>
              )}

              {result === "salah" && (
                <div className="border border-red-500 rounded p-3 sm:p-4 bg-red-900/20">
                  <div className="text-red-400 text-lg sm:text-xl font-bold">✗ ERROR: Incorrect guess! ❌</div>
                  <div className="text-gray-400 mt-2 text-sm sm:text-base">$ whoami --status: FAILED</div>
                </div>
              )}
            </div>
          )}

          {/* Terminal cursor */}
          <div className="flex items-center mt-6">
            <span className="text-[#FE11C5]">user@whoami:~$</span>
            <div className="w-2 h-5 bg-[#90DCFF] ml-2 animate-pulse"></div>
          </div>
        </div>
      </div>
    </main>
  )
}
