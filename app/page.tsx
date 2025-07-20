"use client"
import { useState, useEffect } from "react"
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

  // Animation states
  const [isBooting, setIsBooting] = useState(true)
  const [bootText, setBootText] = useState("")
  const [showContent, setShowContent] = useState(false)
  const [typingText, setTypingText] = useState("")

  // Tebakan
  const [search, setSearch] = useState("")
  const [result, setResult] = useState<"benar" | "salah" | null>(null)

  // Untuk disable double submit
  const [loading, setLoading] = useState(false)

  // Boot sequence animation
  useEffect(() => {
    const bootSequence = [
      "Initializing WHOAMI Terminal...",
      "Loading neural networks...",
      "Connecting to quantum database...",
      "Calibrating guess algorithms...",
      "System ready. Welcome, user.",
    ]

    let currentIndex = 0
    let currentText = ""
    let charIndex = 0

    const typeWriter = () => {
      if (currentIndex < bootSequence.length) {
        if (charIndex < bootSequence[currentIndex].length) {
          currentText += bootSequence[currentIndex][charIndex]
          setBootText(currentText)
          charIndex++
          setTimeout(typeWriter, 50)
        } else {
          currentText += "\n"
          setBootText(currentText)
          currentIndex++
          charIndex = 0
          setTimeout(typeWriter, 800)
        }
      } else {
        setTimeout(() => {
          setIsBooting(false)
          setShowContent(true)
        }, 1000)
      }
    }

    const bootTimer = setTimeout(typeWriter, 1000)
    return () => clearTimeout(bootTimer)
  }, [])

  // Typewriter effect for help text
  useEffect(() => {
    if (showContent) {
      const helpText = "A terminal-based guessing game where you submit clues and guess others!"
      let index = 0
      const timer = setInterval(() => {
        if (index < helpText.length) {
          setTypingText(helpText.slice(0, index + 1))
          index++
        } else {
          clearInterval(timer)
        }
      }, 30)
      return () => clearInterval(timer)
    }
  }, [showContent])

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

  // Add this function after the handleGuess function
  async function handleSkipToGuess() {
    // Fetch all users for guessing without registering
    const { data: users } = await supabase.from("who").select("*")
    if (!users || users.length === 0) return

    setAllUsers(users)
    // Pick a random clue from all users
    const randomClue = users[Math.floor(Math.random() * users.length)]
    setClue(randomClue)
    setStep("guess")
  }

  // Show all users when search is empty, filter only when user types
  const filtered =
    search.length > 0 ? allUsers.filter((u) => u.username_x.toLowerCase().includes(search.toLowerCase())) : allUsers

  if (isBooting) {
    return (
      <main className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="border border-gray-700 rounded-lg bg-gray-900 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
              <div
                className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
              <span className="ml-4 text-gray-400">system.boot</span>
            </div>
            <div className="bg-black rounded p-4 min-h-[200px]">
              <pre className="text-green-400 whitespace-pre-wrap text-sm leading-relaxed">
                {bootText}
                <span className="animate-pulse">█</span>
              </pre>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-green-400 font-mono p-2 sm:p-6 relative overflow-hidden">
      {/* Matrix rain background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="matrix-rain"></div>
      </div>

      {/* Scanning line effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="scanning-line"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Terminal Header */}
        <div className="border border-gray-700 rounded-t-lg bg-gray-900 px-2 sm:px-4 py-2 flex items-center gap-2 animate-slideDown">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" style={{ animationDelay: "0.3s" }}></div>
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: "0.6s" }}></div>
          <span className="ml-2 sm:ml-4 text-gray-400 text-xs sm:text-sm truncate">whoami-game.terminal</span>
        </div>

        {/* Terminal Content */}
        <div className="border-x border-b border-gray-700 rounded-b-lg bg-black p-3 sm:p-6 min-h-[400px] sm:min-h-[500px] animate-slideUp">
          {/* Welcome Message */}
          <div className="mb-4 sm:mb-6">
            <div className="text-[#FE11C5] text-lg sm:text-2xl font-bold mb-2 text-center glitch-text animate-fadeIn">
              ═══════════════════════
            </div>
            <div
              className="text-[#FE11C5] text-xl sm:text-2xl font-bold mb-2 text-center glitch-text animate-fadeIn"
              style={{ animationDelay: "0.2s" }}
            >
              WHOAMI TERMINAL
            </div>
            <div
              className="text-[#FE11C5] text-lg sm:text-2xl font-bold mb-4 text-center glitch-text animate-fadeIn"
              style={{ animationDelay: "0.4s" }}
            >
              ═══════════════════════
            </div>
            <div className="text-[#90DCFF] mb-2 text-sm sm:text-base animate-fadeIn" style={{ animationDelay: "0.6s" }}>
              $ whoami --help
            </div>
            <div className="text-gray-400 mb-4 text-sm sm:text-base animate-fadeIn" style={{ animationDelay: "0.8s" }}>
              {typingText}
              {typingText.length < 73 && <span className="animate-pulse">█</span>}
            </div>
          </div>

          {step === "submit" && (
            <div className="space-y-4 animate-slideUp" style={{ animationDelay: "1s" }}>
              <div className="text-[#90DCFF] animate-typewriter">$ whoami --register</div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="animate-fadeIn" style={{ animationDelay: "1.2s" }}>
                  <div className="text-gray-400 mb-2 text-sm sm:text-base">Enter your X username:</div>
                  <div className="flex items-center flex-wrap sm:flex-nowrap">
                    <span className="text-[#FE11C5] mr-2 text-sm sm:text-base whitespace-nowrap animate-pulse">
                      username@terminal:~$
                    </span>
                    <input
                      className="bg-transparent border-b border-gray-600 text-white outline-none flex-1 pb-1 focus:border-[#90DCFF] transition-all duration-300 text-sm sm:text-base min-w-0 focus:shadow-glow"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="your_username"
                      required
                    />
                  </div>
                  {username && (
                    <div className="flex items-center mt-3 text-gray-400 animate-slideIn">
                      <span className="mr-2">└─ Avatar loaded:</span>
                      <img
                        src={`https://unavatar.io/x/${username}`}
                        alt="avatar"
                        className="w-8 h-8 rounded border border-gray-600 animate-spin-slow"
                      />
                      <span className="ml-2 text-[#90DCFF] animate-pulse">@{username}</span>
                    </div>
                  )}
                </div>

                <div className="animate-fadeIn" style={{ animationDelay: "1.4s" }}>
                  <div className="text-gray-400 mb-2 text-sm sm:text-base">Enter your secret clue:</div>
                  <div className="flex items-center flex-wrap sm:flex-nowrap">
                    <span className="text-[#FE11C5] mr-2 text-sm sm:text-base whitespace-nowrap animate-pulse">
                      clue@terminal:~$
                    </span>
                    <input
                      className="bg-transparent border-b border-gray-600 text-white outline-none flex-1 pb-1 focus:border-[#90DCFF] transition-all duration-300 text-sm sm:text-base min-w-0 focus:shadow-glow"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter a unique fact..."
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 animate-fadeIn" style={{ animationDelay: "1.6s" }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-[#FE11C5] to-[#90DCFF] text-black px-4 sm:px-6 py-2 rounded font-bold hover:scale-105 transition-all duration-300 disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto hover:shadow-neon animate-pulse-slow"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="loading-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                        Processing...
                      </span>
                    ) : (
                      "$ Submit --execute"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipToGuess}
                    className="bg-gradient-to-r from-gray-600 to-gray-800 text-white px-4 sm:px-6 py-2 rounded font-bold hover:scale-105 transition-all duration-300 text-sm sm:text-base w-full sm:w-auto hover:shadow-neon animate-pulse-slow ml-0 sm:ml-4 mt-2 sm:mt-0"
                  >
                    $ Skip --guest-mode
                  </button>
                </div>

                {errorMsg && (
                  <div className="text-red-400 mt-4 animate-shake">
                    <span className="text-red-500 animate-pulse">ERROR:</span> {errorMsg}
                  </div>
                )}
              </form>
            </div>
          )}

          {step === "guess" && clue && (
            <div className="space-y-6 animate-slideUp">
              <div className="text-[#90DCFF] animate-typewriter">$ whoami --guess --mode=interactive</div>

              <div className="border border-gray-700 rounded p-4 bg-gray-900 animate-fadeIn hover:border-[#90DCFF] transition-colors duration-300">
                <div className="text-[#FE11C5] mb-2 animate-pulse">MYSTERY CLUE DETECTED:</div>
                <div className="bg-black border border-gray-600 rounded p-4 animate-glow">
                  <div className="text-[#90DCFF] text-lg animate-typewriter-slow">"{clue.message}"</div>
                </div>
              </div>

              {!result && (
                <div className="animate-fadeIn" style={{ animationDelay: "0.5s" }}>
                  <div className="text-gray-400 mb-3">Who do you think this is?</div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (search) handleGuess(search)
                    }}
                    className="space-y-4"
                  >
                    <div className="flex items-center flex-wrap sm:flex-nowrap">
                      <span className="text-[#FE11C5] mr-2 text-sm sm:text-base whitespace-nowrap animate-pulse">
                        guess@terminal:~$
                      </span>
                      <input
                        className="bg-transparent border-b border-gray-600 text-white outline-none flex-1 pb-1 focus:border-[#90DCFF] transition-all duration-300 text-sm sm:text-base min-w-0 focus:shadow-glow"
                        placeholder="type username..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoComplete="off"
                        required
                      />
                    </div>

                    {allUsers.length > 0 && (
                      <div className="border border-gray-700 rounded bg-gray-900 max-h-48 overflow-y-auto animate-slideDown">
                        <div className="text-gray-400 px-3 py-2 border-b border-gray-700 text-sm">
                          {search.length > 0 ? "Search results:" : "All users:"}
                        </div>
                        {filtered.map((u, index) => (
                          <div
                            key={u.username_x}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-800 cursor-pointer transition-all duration-300 hover:scale-105 animate-fadeIn"
                            style={{ animationDelay: `${index * 0.1}s` }}
                            onClick={() => setSearch(u.username_x)}
                          >
                            <img
                              src={`https://unavatar.io/x/${u.username_x}`}
                              alt={u.username_x}
                              className="w-6 h-6 rounded border border-gray-600 hover:border-[#90DCFF] transition-colors"
                            />
                            <span className="text-[#90DCFF]">@{u.username_x}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="bg-gradient-to-r from-[#90DCFF] to-[#FE11C5] text-black px-4 sm:px-6 py-2 rounded font-bold hover:scale-105 transition-all duration-300 text-sm sm:text-base w-full sm:w-auto hover:shadow-neon animate-pulse-slow"
                    >
                      $ Execute --guess
                    </button>
                  </form>
                </div>
              )}

              {result === "benar" && (
                <div className="border border-green-500 rounded p-3 sm:p-4 bg-green-900/20 animate-success">
                  <div className="text-green-400 text-lg sm:text-xl font-bold animate-bounce">
                    ✓ SUCCESS: Correct guess! 🎉
                  </div>
                  <div className="text-gray-400 mt-2 text-sm sm:text-base animate-typewriter">
                    $ whoami --status: SOLVED
                  </div>
                </div>
              )}

              {result === "salah" && (
                <div className="border border-red-500 rounded p-3 sm:p-4 bg-red-900/20 animate-error">
                  <div className="text-red-400 text-lg sm:text-xl font-bold animate-shake">
                    ✗ ERROR: Incorrect guess! ❌
                  </div>
                  <div className="text-gray-400 mt-2 text-sm sm:text-base animate-typewriter">
                    $ whoami --status: FAILED
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Terminal cursor */}
          <div className="flex items-center mt-6 animate-fadeIn" style={{ animationDelay: "2s" }}>
            <span className="text-[#FE11C5]">user@whoami:~$</span>
            <div className="w-2 h-5 bg-[#90DCFF] ml-2 animate-pulse"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .matrix-rain {
          background: linear-gradient(0deg, transparent 24%, rgba(32, 194, 14, 0.05) 25%, rgba(32, 194, 14, 0.05) 26%, transparent 27%, transparent 74%, rgba(32, 194, 14, 0.05) 75%, rgba(32, 194, 14, 0.05) 76%, transparent 77%, transparent);
          animation: matrix 20s linear infinite;
        }

        @keyframes matrix {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        .scanning-line {
          background: linear-gradient(90deg, transparent, rgba(144, 220, 255, 0.1), transparent);
          height: 2px;
          width: 100%;
          animation: scan 3s linear infinite;
        }

        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(100vh); }
        }

        .glitch-text {
          position: relative;
        }

        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .glitch-text::before {
          animation: glitch-1 2s infinite;
          color: #FE11C5;
          z-index: -1;
        }

        .glitch-text::after {
          animation: glitch-2 2s infinite;
          color: #90DCFF;
          z-index: -2;
        }

        @keyframes glitch-1 {
          0%, 14%, 15%, 49%, 50%, 99%, 100% { transform: translate(0); }
          15%, 49% { transform: translate(-2px, -1px); }
        }

        @keyframes glitch-2 {
          0%, 20%, 21%, 62%, 63%, 99%, 100% { transform: translate(0); }
          21%, 62% { transform: translate(2px, 1px); }
        }

        .loading-dots span {
          display: inline-block;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background-color: currentColor;
          margin: 0 1px;
          animation: loading 1.4s infinite ease-in-out both;
        }

        .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
        .loading-dots span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes loading {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(144, 220, 255, 0.3); }
          50% { box-shadow: 0 0 20px rgba(144, 220, 255, 0.6); }
        }

        @keyframes success {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes error {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
          100% { transform: translateX(0); }
        }

        .animate-slideDown { animation: slideDown 0.6s ease-out; }
        .animate-slideUp { animation: slideUp 0.6s ease-out; }
        .animate-slideIn { animation: slideIn 0.6s ease-out; }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
        .animate-typewriter { animation: typewriter 1s steps(20) 1s both; }
        .animate-typewriter-slow { animation: typewriter 2s steps(40) 0.5s both; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-glow { animation: glow 2s ease-in-out infinite; }
        .animate-success { animation: success 0.8s ease-out; }
        .animate-error { animation: error 0.6s ease-in-out; }
        .animate-spin-slow { animation: spin 3s linear infinite; }
        .animate-pulse-slow { animation: pulse 3s ease-in-out infinite; }

        .focus\\:shadow-glow:focus {
          box-shadow: 0 0 10px rgba(144, 220, 255, 0.5);
        }

        .hover\\:shadow-neon:hover {
          box-shadow: 0 0 20px rgba(254, 17, 197, 0.5);
        }
      `}</style>
    </main>
  )
}
